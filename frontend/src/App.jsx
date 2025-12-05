/**
 * Main Application Entry Point.
 * * This component orchestrates the entire traffic simulation, including:
 * - Managing the grid state and simulation history (undo/redo).
 * - Running the main simulation loop (car movement, traffic lights).
 * - Handling user input (painting roads, configuration).
 * - Managing UI state (modals, sidebar, themes).
 * * @module App
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import { Grid } from "./components/Grid";
import PaletteItem from "./components/PaletteItem";
import LoginScreen from "./components/LoginScreen";
import { UserProfileModal, SaveLoadModal } from "./components/Modals";
import {
  MenuIcon,
  XIcon,
  UndoIcon,
  RedoIcon,
  TrashIcon,
  SaveIcon,
  LoadIcon,
  BackArrowIcon,
} from "./components/Icons";

import {
  MAIN_PALETTE_ITEMS,
  ROAD_PALETTE_ITEMS,
  DECORATION_PALETTE_ITEMS,
  RANDOM_PALETTE_ITEMS,
  THEMES,
} from "./constants";

/**
 * Creates a 2D array representing the grid filled with null values.
 * * @param {number} rows - Number of rows in the grid.
 * @param {number} cols - Number of columns in the grid.
 * @returns {Array<Array<null>>} A 2D array initialized with nulls.
 */
const createEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array(cols).fill(null));

export default function App() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Grid & Simulation History State
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(25);
  const [gridMultiplier, setGridMultiplier] = useState(1.0);
  const [history, setHistory] = useState([createEmptyGrid(16, 25)]);
  const [step, setStep] = useState(0);

  // UI & Tool Selection State
  const [selectedTool, setSelectedTool] = useState("select");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paletteMode, setPaletteMode] = useState("main");
  const [isPlaying, setIsPlaying] = useState(false);
  const [prePlayStep, setPrePlayStep] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [currentLayoutId, setCurrentLayoutId] = useState(null);
  const [toolLaneCount, setToolLaneCount] = useState(2);
  const [activeModal, setActiveModal] = useState(null);

  // Placement Logic State
  const [pendingLightCoords, setPendingLightCoords] = useState(null);

  // Configuration State
  const [autoSpawnEnabled, setAutoSpawnEnabled] = useState(false);
  const [spawnRate, setSpawnRate] = useState(5);
  const [theme, setTheme] = useState("dark");

  // Performance Refs
  const globalTickRef = useRef(0);
  const simulationState = useRef({
    history: [createEmptyGrid(16, 25)],
    step: 0,
  });
  const latestStepRef = useRef(0);

  const T = THEMES?.[theme] || {
    bgApp: "bg-slate-950",
    textMain: "text-slate-200",
    textDim: "text-slate-400",
    panelBg: "bg-slate-900",
    panelBorder: "border-slate-800",
    sidebarBg: "bg-slate-900/95",
  };

  // Derived state for the current grid view
  const grid =
    history && history[step] ? history[step] : createEmptyGrid(rows, cols);

  /**
   * Effect: Monitors Firebase authentication state changes.
   * Updates the user state and disables the loading indicator upon resolution.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Effect: Synchronizes Refs with React State when simulation is paused.
   * This ensures that when the simulation starts, it picks up exactly where the UI is.
   */
  useEffect(() => {
    if (!isPlaying) {
      simulationState.current = { history, step };
      latestStepRef.current = step;
    }
  }, [history, step, isPlaying]);

  /**
   * Safely retrieves a cell from the grid.
   * * @param {Array<Array<Object>>} g - The grid array.
   * @param {number} r - Row index.
   * @param {number} c - Column index.
   * @returns {Object|null} The cell object or null if out of bounds/empty.
   */
  const getCell = (g, r, c) => {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return null;
    return g[r][c];
  };

  /**
   * Effect: Resets multi-step tool states (like traffic light placement)
   * when the user switches to a different tool.
   */
  useEffect(() => {
    setPendingLightCoords(null);
  }, [selectedTool]);

  /**
   * Resizes the grid resolution based on a multiplier.
   * * Preserves existing cells where possible.
   * Resets simulation history to prevent index out-of-bounds errors on undo.
   * * @param {number} multiplier - Scaling factor (e.g., 1.0, 1.5, 2.0).
   */
  const handleGridResize = (multiplier) => {
    const BASE_ROWS = 16;
    const BASE_COLS = 25;
    const newRows = Math.round(BASE_ROWS * multiplier);
    const newCols = Math.round(BASE_COLS * multiplier);

    if (newRows === rows && newCols === cols) return;

    if (isPlaying) setIsPlaying(false);

    const currentGrid = grid;
    const newGrid = createEmptyGrid(newRows, newCols);

    for (let r = 0; r < Math.min(rows, newRows); r++) {
      for (let c = 0; c < Math.min(cols, newCols); c++) {
        if (currentGrid[r][c]) {
          newGrid[r][c] = { ...currentGrid[r][c] };
        }
      }
    }

    setRows(newRows);
    setCols(newCols);
    setGridMultiplier(multiplier);
    setHistory([newGrid]);
    setStep(0);
    setPrePlayStep(null);
  };

  /**
   * Randomly populates empty roads with cars.
   * Used as a "Quick Start" feature for users.
   */
  const handlePopulateCars = () => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((row) =>
        row.map((cell) => (cell ? { ...cell } : null))
      );

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = newGrid[r][c];
          if (
            cell &&
            cell.type.startsWith("road") &&
            !cell.hasCar &&
            Math.random() < 0.2
          ) {
            let carDir = "right";
            if (cell.flowDirection && !cell.flowDirection.startsWith("turn")) {
              carDir = cell.flowDirection;
            } else if (cell.type.includes("vertical")) {
              carDir = Math.random() > 0.5 ? "up" : "down";
            } else if (cell.type.includes("horizontal")) {
              carDir = Math.random() > 0.5 ? "left" : "right";
            }
            cell.hasCar = carDir;
            cell.carConfig = { speed: 1, turnBias: "none" };
          }
        }
      }
      const newHist = [...prev.slice(0, step + 1), newGrid];
      simulationState.current = { history: newHist, step: step + 1 };
      return newHist;
    });
    setStep((s) => s + 1);
  };

  /**
   * Effect: The Main Simulation Loop.
   * * Runs continuously when `isPlaying` is true. It handles:
   * 1. Spawning new cars from configured spawners.
   * 2. Updating traffic light states (Green -> Yellow -> Red).
   * 3. Moving cars based on flow direction, collisions, and traffic rules.
   * 4. Updating the grid state (efficiently managing history).
   */
  useEffect(() => {
    if (!isPlaying) return;

    const SIMULATION_TICK_MS = 100;
    const MOVE_THRESHOLD = 500;

    const interval = setInterval(() => {
      globalTickRef.current += 1;

      const { history: curHistory, step: curStep } = simulationState.current;
      const currentGrid = curHistory[curStep];

      if (!currentGrid) {
        setIsPlaying(false);
        return;
      }

      const newGrid = currentGrid.map((row) =>
        row.map((cell) => (cell ? { ...cell } : null))
      );
      const movedCars = new Set();

      /**
       * Checks if a target cell accepts entry from a specific direction.
       * @param {Object} tCell - Target cell data.
       * @param {string} entryDir - Direction from which the car is entering.
       */
      const isTargetCompatible = (tCell, entryDir) => {
        if (!tCell) return false;
        if (tCell.hasCar) return false;
        if (tCell.type === "traffic_light") return false;
        if (!tCell.type.startsWith("road")) return false;

        const flow = tCell.flowDirection;
        if (flow) {
          if (Array.isArray(flow)) {
            return flow.includes(entryDir);
          } else if (typeof flow === "string") {
            if (flow.startsWith("turn_")) {
              const entry = flow.split("_")[1];
              return entryDir === entry;
            } else {
              return flow === entryDir;
            }
          }
        }
        return true;
      };

      // --- Spawner Logic ---
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = newGrid[r][c];
          if (cell && cell.isSpawner && !cell.hasCar) {
            // Check against max spawn tick limit if set
            if (
              cell.maxSpawnTick !== undefined &&
              cell.maxSpawnTick !== null &&
              globalTickRef.current > cell.maxSpawnTick
            ) {
              continue;
            }
            const interval = cell.spawnInterval || 20;
            const lastTick = cell.lastSpawnTick || 0;

            if (globalTickRef.current - lastTick >= interval) {
              let spawnDir = "right";
              const flow = cell.flowDirection;

              if (flow) {
                if (Array.isArray(flow) && flow.length > 0) {
                  spawnDir = flow[Math.floor(Math.random() * flow.length)];
                } else if (
                  typeof flow === "string" &&
                  !flow.startsWith("turn")
                ) {
                  spawnDir = flow;
                }
              } else if (cell.type.includes("vertical")) {
                spawnDir = "down";
              } else if (cell.type.includes("horizontal")) {
                spawnDir = "right";
              }

              const possibleBiases = cell.spawnerTurnBiases || ["none"];
              const randomBias =
                possibleBiases[
                  Math.floor(Math.random() * possibleBiases.length)
                ];

              cell.hasCar = spawnDir;
              cell.carConfig = { speed: 1, turnBias: randomBias };
              cell.movementProgress = Math.random() * 200;
              cell.lastSpawnTick = globalTickRef.current;
            }
          }
        }
      }

      // --- Global Auto-Spawn Logic ---
      const spawnInterval = Math.max(3, 33 - spawnRate * 3);
      if (autoSpawnEnabled && globalTickRef.current % spawnInterval === 0) {
        let attempts = 0;
        const maxAttempts = Math.max(3, Math.floor(spawnRate / 2) + 3);
        while (attempts < maxAttempts) {
          const r = Math.floor(Math.random() * rows);
          const c = Math.floor(Math.random() * cols);
          const cell = newGrid[r][c];
          if (cell && cell.type.startsWith("road") && !cell.hasCar) {
            let spawnDir = "right";
            const flow = cell.flowDirection;

            if (flow) {
              if (Array.isArray(flow) && flow.length > 0) spawnDir = flow[0];
              else if (typeof flow === "string" && !flow.startsWith("turn"))
                spawnDir = flow;
            } else if (cell.type.includes("vertical"))
              spawnDir = Math.random() > 0.5 ? "up" : "down";
            else if (cell.type.includes("horizontal"))
              spawnDir = Math.random() > 0.5 ? "left" : "right";

            cell.hasCar = spawnDir;
            cell.carConfig = { speed: 1, turnBias: "none" };
            cell.movementProgress = Math.random() * 400;
            break;
          }
          attempts++;
        }
      }

      // --- Traffic Light Updates ---
      if (globalTickRef.current % 5 === 0) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            let cell = newGrid[r][c];
            if (
              cell &&
              (cell.type === "traffic_light" || cell.hasTrafficLight)
            ) {
              const config = cell.lightConfig ||
                cell.config || { green: 10, yellow: 4, red: 10 };
              if (!cell.lightConfig && !cell.config) cell.lightConfig = config;

              const state = cell.lightState || cell.state || "green";
              if (!cell.lightState && !cell.state) cell.lightState = state;

              let timer =
                cell.lightTimer !== undefined
                  ? cell.lightTimer
                  : cell.timer || 0;
              timer += 1;
              const limit = config[state];

              if (timer >= limit) {
                timer = 0;
                let nextState = state;
                if (state === "green") nextState = "yellow";
                else if (state === "yellow") nextState = "red";
                else if (state === "red") nextState = "green";

                cell.lightState = nextState;
                cell.state = nextState;
              }
              cell.lightTimer = timer;
              cell.timer = timer;
            }
          }
        }
      }

      // --- Car Movement Logic ---
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let cell = newGrid[r][c];
          if (!cell || !cell.hasCar) continue;
          if (movedCars.has(`${r},${c}`)) continue;

          if (cell.movementProgress === undefined) cell.movementProgress = 0;
          const speed = cell.carConfig?.speed || 1;
          cell.movementProgress += speed * SIMULATION_TICK_MS;

          if (cell.movementProgress < MOVE_THRESHOLD) continue;

          let direction = cell.hasCar;
          const currentFlow = cell.flowDirection;
          const currentPriority = cell.flowPriority;

          // Determine preferred direction based on flow restrictions
          if (currentFlow) {
            if (Array.isArray(currentFlow)) {
              if (!currentFlow.includes(direction)) {
                if (currentFlow.length > 0) direction = currentFlow[0];
              }
            } else {
              if (currentFlow === "left" && direction === "right")
                direction = "left";
              else if (currentFlow === "right" && direction === "left")
                direction = "right";
              else if (currentFlow === "up" && direction === "down")
                direction = "up";
              else if (currentFlow === "down" && direction === "up")
                direction = "down";
            }
          } else if (currentPriority) {
            let pr = r,
              pc = c;
            if (currentPriority === "up") pr--;
            if (currentPriority === "down") pr++;
            if (currentPriority === "left") pc--;
            if (currentPriority === "right") pc++;
            if (
              pr < 0 ||
              pr >= rows ||
              pc < 0 ||
              pc >= cols ||
              isTargetCompatible(getCell(newGrid, pr, pc), currentPriority)
            ) {
              direction = currentPriority;
            }
          }

          let nextR = r,
            nextC = c,
            nextDir = direction;
          let canMove = false;

          let isBlockedByLight = false;

          const isInsideIntersection =
            cell.type === "traffic_light" ||
            cell.type === "road_intersection" ||
            (cell.type && cell.type.includes("intersection"));

          // Check for Stop Lines / Traffic Lights
          if (!isInsideIntersection) {
            if (cell.stopMarker) {
              const targetLight = getCell(
                newGrid,
                cell.stopMarker.r,
                cell.stopMarker.c
              );
              if (targetLight) {
                const state =
                  targetLight.lightState || targetLight.state || "green";
                if (state !== "green") {
                  isBlockedByLight = true;
                }
              }
            }
          }

          if (!isBlockedByLight) {
            const possibleMoves = [];
            const getCoords = (d) => {
              let nr = r,
                nc = c;
              if (d === "up") nr--;
              if (d === "down") nr++;
              if (d === "left") nc--;
              if (d === "right") nc++;
              return { nr, nc };
            };

            const isValidMove = (dir) => {
              const flow = cell.flowDirection;
              if (flow) {
                if (Array.isArray(flow)) {
                  if (!flow.includes(dir)) return false;
                } else {
                  if (flow !== dir && !flow.startsWith("turn_")) return false;
                }
              }

              const { nr, nc } = getCoords(dir);
              const isOffScreen = nr < 0 || nr >= rows || nc < 0 || nc >= cols;
              if (isOffScreen) return true;
              const target = getCell(newGrid, nr, nc);
              if (!target) return false;
              if (!isTargetCompatible(target, dir)) return false;

              const tType = target.type || "";
              const isTargetVertical = tType.includes("vertical");
              const isTargetHorizontal = tType.includes("horizontal");
              const isTargetIntersection = tType.includes("intersection");

              if (
                (dir === "left" || dir === "right") &&
                isTargetVertical &&
                !isTargetIntersection
              )
                return false;
              if (
                (dir === "up" || dir === "down") &&
                isTargetHorizontal &&
                !isTargetIntersection
              )
                return false;
              return true;
            };

            if (isValidMove(direction)) possibleMoves.push(direction);
            if (direction === "up" || direction === "down") {
              if (isValidMove("left")) possibleMoves.push("left");
              if (isValidMove("right")) possibleMoves.push("right");
            } else {
              if (isValidMove("up")) possibleMoves.push("up");
              if (isValidMove("down")) possibleMoves.push("down");
            }

            // Handle forced turn flows
            if (
              cell.flowDirection &&
              typeof cell.flowDirection === "string" &&
              cell.flowDirection.startsWith("turn_")
            ) {
              const exit = cell.flowDirection.split("_")[2];
              if (isValidMove(exit)) {
                possibleMoves.length = 0;
                possibleMoves.push(exit);
              }
            }

            // Decide move
            if (possibleMoves.length > 0) {
              let chosen = null;
              const config = cell.carConfig || {};
              const bias = config.turnBias || "none";

              if (bias !== "none") {
                const getRelativeDir = (currentFacing, turnType) => {
                  const dirs = ["up", "right", "down", "left"];
                  const idx = dirs.indexOf(currentFacing);
                  if (idx === -1) return null;
                  if (turnType === "left") return dirs[(idx + 3) % 4];
                  if (turnType === "right") return dirs[(idx + 1) % 4];
                  return null;
                };
                const preferredDir = getRelativeDir(direction, bias);
                if (preferredDir && possibleMoves.includes(preferredDir)) {
                  chosen = preferredDir;
                }
              }

              if (!chosen && possibleMoves.includes(direction))
                chosen = direction;
              if (!chosen)
                chosen =
                  possibleMoves[
                    Math.floor(Math.random() * possibleMoves.length)
                  ];

              nextDir = chosen;
              const { nr, nc } = getCoords(nextDir);
              nextR = nr;
              nextC = nc;
              canMove = true;
            } else {
              // Blocked
              canMove = false;
              newGrid[r][c] = {
                ...cell,
                hasCar: direction,
                movementProgress: MOVE_THRESHOLD,
              };
            }

            if (canMove) {
              let movingConfig = cell.carConfig ? { ...cell.carConfig } : {};

              if (
                isInsideIntersection &&
                movingConfig.turnBias &&
                movingConfig.turnBias !== "none"
              ) {
                if (nextDir !== direction) {
                  movingConfig.turnBias = "none";
                }
              }

              if (cell.type) {
                newGrid[r][c] = {
                  ...cell,
                  hasCar: false,
                  carConfig: undefined,
                  movementProgress: 0,
                };
              } else {
                newGrid[r][c] = null;
              }
              if (newGrid[nextR] && newGrid[nextR][nextC] !== undefined) {
                const target = newGrid[nextR][nextC];
                const newCellData = target
                  ? { ...target }
                  : { type: "road_straight_horizontal" };
                newCellData.hasCar = nextDir;
                newCellData.carConfig = movingConfig;
                newCellData.movementProgress = 0;
                newGrid[nextR][nextC] = newCellData;
                movedCars.add(`${nextR},${nextC}`);
              }
            }
          } else {
            newGrid[r][c] = { ...cell, movementProgress: MOVE_THRESHOLD };
          }
        }
      }

      // --- History Management (Optimized for Playback) ---
      let nextHistory = [...curHistory.slice(0, curStep + 1), newGrid];
      if (nextHistory.length > 500) {
        nextHistory = nextHistory.slice(nextHistory.length - 500);
        simulationState.current = { history: nextHistory, step: 499 };
        setHistory(nextHistory);
        setStep(499);
      } else {
        simulationState.current = { history: nextHistory, step: curStep + 1 };
        setHistory(nextHistory);
        setStep(curStep + 1);
      }
    }, SIMULATION_TICK_MS);

    return () => clearInterval(interval);
  }, [isPlaying, rows, cols, autoSpawnEnabled, spawnRate]);

  /**
   * Primary grid modification handler.
   * Updates the grid state based on the selected tool and target cell.
   * Records changes in history for Undo/Redo.
   * * @param {number} row - Row index of the click.
   * @param {number} col - Column index of the click.
   * @param {string} newItemOrType - Tool type or Item ID being applied.
   */
  const updateGrid = useCallback(
    (row, col, newItemOrType) => {
      if (isPlaying) setIsPlaying(false);

      const currentStepIndex = latestStepRef.current;
      latestStepRef.current = currentStepIndex + 1;

      setHistory((prev) => {
        const safeStep = Math.min(currentStepIndex, prev.length - 1);
        const current = prev[safeStep];

        const newGrid = current.map((r) =>
          r.map((cell) => (cell ? { ...cell } : null))
        );
        let updatedCell = newGrid[row][col] || { type: null, hasCar: false };

        if (selectedTool === "select" && newItemOrType !== "eraser")
          return prev;

        if (newItemOrType === "eraser") {
          // Eraser logic: Prioritize removing cars, then markers, then the cell itself
          if (updatedCell.hasCar) {
            updatedCell.hasCar = false;
            updatedCell.carConfig = undefined;
            newGrid[row][col] = updatedCell;
          } else if (updatedCell.stopMarker) {
            delete updatedCell.stopMarker;
            newGrid[row][col] = updatedCell;
          } else if (updatedCell.hasTrafficLight) {
            updatedCell.hasTrafficLight = false;
            updatedCell.lightState = undefined;
            updatedCell.lightConfig = undefined;
            updatedCell.lightTimer = undefined;
            newGrid[row][col] = updatedCell;
          } else if (updatedCell.type === "traffic_light") {
            updatedCell.type = "road_intersection";
            updatedCell.hasTrafficLight = false;
            newGrid[row][col] = updatedCell;
          } else {
            updatedCell = null;
            newGrid[row][col] = null;
          }
        } else if (newItemOrType === "car") {
          // Car Placement: Enforce placement only on roads
          if (updatedCell.type && updatedCell.type.startsWith("road")) {
            let startDir = "right";
            const flow = updatedCell.flowDirection;

            if (flow) {
              if (Array.isArray(flow) && flow.length > 0) {
                startDir = flow[0];
              } else if (typeof flow === "string" && !flow.startsWith("turn")) {
                startDir = flow;
              }
            } else {
              if (updatedCell.type.includes("vertical")) {
                startDir = "down";
              } else if (updatedCell.type.includes("horizontal")) {
                startDir = "right";
              }
            }

            updatedCell.hasCar = startDir;
            updatedCell.carConfig = { speed: 1, turnBias: "none" };
            newGrid[row][col] = updatedCell;
          }
        } else if (newItemOrType === "traffic_light") {
          // Two-step placement: 1. Place Light, 2. Place Stop Line
          if (!pendingLightCoords) {
            if (updatedCell.type && updatedCell.type.startsWith("road")) {
              updatedCell.hasTrafficLight = true;
              updatedCell.lightState = "green";
              updatedCell.lightTimer = 0;
              updatedCell.lightConfig = { green: 10, yellow: 4, red: 10 };
            } else {
              updatedCell.type = "road_intersection";
              updatedCell.hasTrafficLight = true;
              updatedCell.lightState = "green";
              updatedCell.lightTimer = 0;
              updatedCell.lightConfig = { green: 10, yellow: 4, red: 10 };
            }
            newGrid[row][col] = updatedCell;
            setPendingLightCoords({ row, col });
          } else {
            // Place Stop Line
            if (updatedCell.type && updatedCell.type.startsWith("road")) {
              const dRow = pendingLightCoords.row - row;
              const dCol = pendingLightCoords.col - col;
              let side = "bottom";

              if (dRow < 0) side = "top";
              else if (dRow > 0) side = "bottom";
              else if (dCol < 0) side = "left";
              else if (dCol > 0) side = "right";

              updatedCell.stopMarker = {
                r: pendingLightCoords.row,
                c: pendingLightCoords.col,
                side: side,
              };
              newGrid[row][col] = updatedCell;
            }
            setPendingLightCoords(null);
          }
        } else if (newItemOrType === "road_divider_vertical") {
          updatedCell.type = newItemOrType;
          updatedCell.lanePosition = 0;
          newGrid[row][col] = updatedCell;
          // Auto-place adjacent lane
          if (col + 1 < cols) {
            const rightCell = newGrid[row][col + 1] || {
              type: null,
              hasCar: false,
            };
            if (!rightCell.type) {
              rightCell.type = "road_divider_vertical";
              rightCell.lanePosition = 1;
              newGrid[row][col + 1] = rightCell;
            }
          }
        } else if (newItemOrType === "road_divider_horizontal") {
          updatedCell.type = newItemOrType;
          updatedCell.lanePosition = 0;
          newGrid[row][col] = updatedCell;
          // Auto-place adjacent lane
          if (row + 1 < rows) {
            const bottomCell = newGrid[row + 1][col] || {
              type: null,
              hasCar: false,
            };
            if (!bottomCell.type) {
              bottomCell.type = "road_divider_horizontal";
              bottomCell.lanePosition = 1;
              newGrid[row + 1][col] = bottomCell;
            }
          }
        } else if (newItemOrType === "road_multilane_vertical") {
          const laneCount = toolLaneCount;
          for (let i = 0; i < laneCount; i++) {
            if (col + i < cols) {
              const cell = newGrid[row][col + i] || {
                type: null,
                hasCar: false,
              };
              if (cell.type && cell.type.includes("divider")) continue;
              cell.type = newItemOrType;
              cell.laneCount = laneCount;
              cell.lanePosition = i;
              newGrid[row][col + i] = cell;
            }
          }
        } else if (newItemOrType === "road_multilane_horizontal") {
          const laneCount = toolLaneCount;
          for (let i = 0; i < laneCount; i++) {
            if (row + i < rows) {
              const cell = newGrid[row + i][col] || {
                type: null,
                hasCar: false,
              };
              if (cell.type && cell.type.includes("divider")) continue;
              cell.type = newItemOrType;
              cell.laneCount = laneCount;
              cell.lanePosition = i;
              newGrid[row + i][col] = cell;
            }
          }
        } else {
          updatedCell.type = newItemOrType;
          newGrid[row][col] = updatedCell;
        }

        const newHist = [...prev.slice(0, safeStep + 1), newGrid];
        simulationState.current = { history: newHist, step: safeStep + 1 };
        return newHist;
      });
      setStep((s) => s + 1);
    },
    [
      step,
      selectedTool,
      isPlaying,
      rows,
      cols,
      toolLaneCount,
      pendingLightCoords,
    ]
  );

  /**
   * Updates configuration for a Car Spawner cell.
   * * @param {number} row - Cell row.
   * @param {number} col - Cell column.
   * @param {string} key - Configuration key (e.g., 'spawnInterval').
   * @param {any} value - New value.
   */
  const updateSpawnerConfig = (row, col, key, value) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      if (newGrid[row][col]) {
        newGrid[row][col][key] = value;
        if (key === "isSpawner" && value === true) {
          newGrid[row][col].lastSpawnTick = globalTickRef.current;
          if (!newGrid[row][col].spawnInterval)
            newGrid[row][col].spawnInterval = 20;
          if (!newGrid[row][col].spawnerTurnBiases)
            newGrid[row][col].spawnerTurnBiases = ["none"];
        }
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  /**
   * Updates timing configuration for a Traffic Light.
   * * @param {number} row
   * @param {number} col
   * @param {string} key - e.g., 'green', 'red', 'yellow'.
   * @param {number} value - Duration in ticks.
   */
  const updateTrafficLightConfig = (row, col, key, value) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      if (
        newGrid[row][col] &&
        (newGrid[row][col].type === "traffic_light" ||
          newGrid[row][col].hasTrafficLight)
      ) {
        const config = newGrid[row][col].lightConfig ||
          newGrid[row][col].config || { green: 10, yellow: 4, red: 10 };
        newGrid[row][col].lightConfig = {
          ...config,
          [key]: parseInt(value),
        };
        newGrid[row][col].config = newGrid[row][col].lightConfig;
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  /**
   * Manually toggles the state of a traffic light.
   * Used for interactive clicking on lights to force a change.
   * * @param {number} row
   * @param {number} col
   * @param {string} newState - 'green', 'yellow', or 'red'.
   */
  const updateTrafficLightState = (row, col, newState) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      const cell = newGrid[row][col];
      if (cell && (cell.type === "traffic_light" || cell.hasTrafficLight)) {
        cell.lightState = newState;
        cell.state = newState;
        cell.lightTimer = 0;
        cell.timer = 0;
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  /**
   * Updates the allowed flow direction for a road cell.
   * Toggles direction in the array or sets to null (Any) if deselected.
   * * @param {number} row
   * @param {number} col
   * @param {string|null} direction - 'up', 'down', 'left', 'right', or null.
   */
  const updateRoadFlow = (row, col, direction) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      const cell = newGrid[row][col];

      if (cell && cell.type.startsWith("road")) {
        if (direction === null) {
          cell.flowDirection = null;
        } else {
          let flows = [];

          if (Array.isArray(cell.flowDirection)) {
            flows = [...cell.flowDirection];
          } else if (
            cell.flowDirection &&
            typeof cell.flowDirection === "string"
          ) {
            flows = [cell.flowDirection];
          }

          if (flows.includes(direction)) {
            flows = flows.filter((d) => d !== direction);
          } else {
            flows.push(direction);
          }

          cell.flowDirection = flows.length > 0 ? flows : null;
        }
        cell.flowPriority = null;
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  /**
   * Dynamically adjusts the lane count of an existing multi-lane road.
   * * @param {number} row
   * @param {number} col
   * @param {number} delta - +1 or -1 lane.
   */
  const updateLaneCount = (row, col, delta) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      const targetCell = newGrid[row][col];
      if (targetCell && targetCell.type.includes("multilane")) {
        const currentLanes = targetCell.laneCount || 2;
        const currentPos = targetCell.lanePosition || 0;
        const newLanes = Math.max(2, Math.min(6, currentLanes + delta));

        if (newLanes === currentLanes) return prev;

        let baseR = row;
        let baseC = col;
        const isVertical = targetCell.type.includes("vertical");

        if (isVertical) baseC = col - currentPos;
        else baseR = row - currentPos;

        for (let i = 0; i < Math.max(currentLanes, newLanes); i++) {
          const r = isVertical ? baseR : baseR + i;
          const c = isVertical ? baseC + i : baseC;

          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            if (
              newGrid[r][c] &&
              newGrid[r][c].type &&
              newGrid[r][c].type.includes("divider")
            )
              continue;

            if (i < newLanes) {
              const cell = newGrid[r][c] || { type: null, hasCar: false };
              cell.type = targetCell.type;
              cell.laneCount = newLanes;
              cell.lanePosition = i;
              if (!cell.flowDirection && targetCell.flowDirection)
                cell.flowDirection = targetCell.flowDirection;
              newGrid[r][c] = cell;
            } else {
              if (
                newGrid[r][c] &&
                newGrid[r][c].type === targetCell.type &&
                newGrid[r][c].lanePosition === i
              ) {
                newGrid[r][c] = null;
              }
            }
          }
        }
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  /**
   * Updates configuration for a specific car.
   * * @param {number} row
   * @param {number} col
   * @param {string} key - e.g., 'speed', 'turnBias'.
   * @param {any} value
   */
  const updateCarConfig = (row, col, key, value) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      if (newGrid[row][col] && newGrid[row][col].hasCar) {
        newGrid[row][col].carConfig = {
          ...newGrid[row][col].carConfig,
          [key]: value,
        };
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  /**
   * Applies a flow direction to a road network using a BFS flood fill algorithm.
   * Detects turns (corners) and applies appropriate turn logic (e.g., up -> right).
   * * @param {number} row - Starting row.
   * @param {number} col - Starting column.
   * @param {string|Array} direction - The flow direction to propagate.
   */
  const floodFillFlow = (row, col, direction) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      const startCell = newGrid[row][col];
      if (!startCell || !startCell.type.startsWith("road")) return prev;

      // Determine Initial Heading safely
      let initialPropDir = null;
      if (typeof direction === "string") {
        initialPropDir = direction;
        if (direction.startsWith("turn_")) {
          initialPropDir = direction.split("_")[2];
        }
      } else if (Array.isArray(direction) && direction.length > 0) {
        initialPropDir = direction[0];
      }

      const queue = [[row, col, initialPropDir]];
      const visited = new Set();

      while (queue.length > 0) {
        let [r, c, currDir] = queue.shift();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        const currentCell = newGrid[r][c];

        if (currentCell && currentCell.type.startsWith("road")) {
          // Lane Hopping Logic (Spread to adjacent lanes)
          if (currentCell.type.includes("multilane")) {
            const laneCount = currentCell.laneCount || 2;
            const currentPos = currentCell.lanePosition || 0;
            const isVertical = currentCell.type.includes("vertical");
            const baseR = isVertical ? r : r - currentPos;
            const baseC = isVertical ? c - currentPos : c;
            for (let i = 0; i < laneCount; i++) {
              if (i === currentPos) continue;
              const siblingR = isVertical ? baseR : baseR + i;
              const siblingC = isVertical ? baseC + i : baseC;
              const siblingKey = `${siblingR},${siblingC}`;
              if (
                !visited.has(siblingKey) &&
                siblingR >= 0 &&
                siblingR < rows &&
                siblingC >= 0 &&
                siblingC < cols &&
                newGrid[siblingR][siblingC] &&
                newGrid[siblingR][siblingC].type === currentCell.type
              ) {
                queue.push([siblingR, siblingC, currDir]);
              }
            }
          }

          // Intersection Logic (Stop propagation but check exits)
          if (currentCell.type === "road_intersection") {
            currentCell.flowDirection = null;
            currentCell.flowPriority = null;
            const potentialExits = [
              { dr: -1, dc: 0, dir: "up" },
              { dr: 1, dc: 0, dir: "down" },
              { dr: 0, dc: -1, dir: "left" },
              { dr: 0, dc: 1, dir: "right" },
            ];
            for (const exit of potentialExits) {
              const nr = r + exit.dr;
              const nc = c + exit.dc;
              if (
                nr >= 0 &&
                nr < rows &&
                nc >= 0 &&
                nc < cols &&
                newGrid[nr][nc] &&
                newGrid[nr][nc].type.startsWith("road")
              ) {
                queue.push([nr, nc, exit.dir]);
              }
            }
            continue;
          }

          let nextPropDir = currDir;
          let newFlow = direction;

          // Smart Propagation Logic
          const singleCurr =
            Array.isArray(currDir) && currDir.length === 1
              ? currDir[0]
              : typeof currDir === "string"
              ? currDir
              : null;
          const singleDir =
            Array.isArray(direction) && direction.length === 1
              ? direction[0]
              : typeof direction === "string"
              ? direction
              : null;

          if (singleCurr && singleDir) {
            if (r !== row || c !== col) {
              const cellType = currentCell.type;
              // Detect Turns
              if (
                cellType.includes("horizontal") &&
                (singleCurr === "up" || singleCurr === "down")
              ) {
                const leftN = getCell(newGrid, r, c - 1);
                const rightN = getCell(newGrid, r, c + 1);
                if (leftN && leftN.type.startsWith("road")) {
                  nextPropDir = "left";
                  newFlow = `turn_${singleCurr}_left`;
                } else if (rightN && rightN.type.startsWith("road")) {
                  nextPropDir = "right";
                  newFlow = `turn_${singleCurr}_right`;
                }
              } else if (
                cellType.includes("vertical") &&
                (singleCurr === "left" || singleCurr === "right")
              ) {
                const upN = getCell(newGrid, r - 1, c);
                const downN = getCell(newGrid, r + 1, c);
                if (upN && upN.type.startsWith("road")) {
                  nextPropDir = "up";
                  newFlow = `turn_${singleCurr}_up`;
                } else if (downN && downN.type.startsWith("road")) {
                  nextPropDir = "down";
                  newFlow = `turn_${singleCurr}_down`;
                }
              } else {
                newFlow = singleCurr; // Continue straight
                nextPropDir = singleCurr;
              }
            } else {
              // Starting Cell
              newFlow = direction;
              if (singleDir.startsWith("turn_")) {
                nextPropDir = singleDir.split("_")[2];
              }
            }
          } else if (Array.isArray(direction)) {
            newFlow = direction;
            if (direction.length > 0) nextPropDir = direction[0];
          }

          let dr = 0,
            dc = 0;

          const propDirString = Array.isArray(nextPropDir)
            ? nextPropDir[0]
            : nextPropDir;

          if (typeof propDirString === "string") {
            if (propDirString === "up") dr = -1;
            if (propDirString === "down") dr = 1;
            if (propDirString === "left") dc = -1;
            if (propDirString === "right") dc = 1;
          }

          const nr = r + dr;
          const nc = c + dc;
          const isNextCellValid =
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            newGrid[nr][nc] &&
            newGrid[nr][nc].type.startsWith("road");

          // Apply Flow
          currentCell.flowDirection = newFlow;
          currentCell.flowPriority = null;

          if (isNextCellValid && (dr !== 0 || dc !== 0)) {
            queue.push([nr, nc, nextPropDir]);
          }
        }
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  /**
   * Router for cell click actions.
   * If 'Select' tool is active, updates selection state.
   * Otherwise, calls updateGrid to modify the cell.
   * * @param {number} r
   * @param {number} c
   */
  const handleCellAction = (r, c) => {
    if (selectedTool === "select") {
      setSelectedCell({ row: r, col: c });
      if (!isSidebarOpen) setIsSidebarOpen(true);
    } else {
      updateGrid(r, c, selectedTool);
    }
  };

  /**
   * Loads a saved layout into the simulator.
   * Resets simulation timers and clears temporary states.
   * * @param {Array|string} loadedGrid - The grid data (or JSON string).
   * @param {number} loadedRows
   * @param {number} loadedCols
   * @param {string} id - Database ID of the layout.
   */
  const handleLoadLayout = (loadedGrid, loadedRows, loadedCols, id) => {
    const parsedGrid =
      typeof loadedGrid === "string" ? JSON.parse(loadedGrid) : loadedGrid;

    // Reset ticks/timers in the grid to 0
    const cleanGrid = parsedGrid.map((row) =>
      row.map((cell) => {
        if (!cell) return null;

        const cleanCell = { ...cell };

        if (cleanCell.type === "traffic_light" || cleanCell.hasTrafficLight) {
          cleanCell.lightTimer = 0;
          cleanCell.timer = 0;
        }

        if (cleanCell.isSpawner) {
          cleanCell.lastSpawnTick = 0;
          cleanCell.nextSpawnTick = null;
        }

        return cleanCell;
      })
    );

    globalTickRef.current = 0;

    setRows(loadedRows);
    setCols(loadedCols);
    setGridMultiplier(loadedRows / 16);
    setHistory([cleanGrid]);
    setStep(0);
    setIsPlaying(false);
    setPrePlayStep(null);
    setCurrentLayoutId(id);
  };

  // Determine active palette based on mode
  let currentPaletteItems = MAIN_PALETTE_ITEMS;
  if (paletteMode === "road") currentPaletteItems = ROAD_PALETTE_ITEMS;
  if (paletteMode === "decoration")
    currentPaletteItems = DECORATION_PALETTE_ITEMS;
  if (paletteMode === "random") currentPaletteItems = RANDOM_PALETTE_ITEMS;

  const selectedCellData = selectedCell
    ? grid && grid[selectedCell.row] && grid[selectedCell.row][selectedCell.col]
    : null;

  // Render Authentication Loading State
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center font-sans text-slate-400 animate-pulse">
        Loading Authentication...
      </div>
    );
  }

  // Render Login Screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div
      className={`flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300 ${T.bgApp} ${T.textMain}`}
    >
      {/* Modals */}
      {activeModal === "save" && (
        <SaveLoadModal
          mode="save"
          onClose={() => setActiveModal(null)}
          grid={grid}
          rows={rows}
          cols={cols}
          onLoadLayout={handleLoadLayout}
          currentLayoutId={currentLayoutId}
          setCurrentLayoutId={setCurrentLayoutId}
          user={user}
          theme={theme}
        />
      )}
      {activeModal === "load" && (
        <SaveLoadModal
          mode="load"
          onClose={() => setActiveModal(null)}
          grid={grid}
          rows={rows}
          cols={cols}
          onLoadLayout={handleLoadLayout}
          currentLayoutId={currentLayoutId}
          setCurrentLayoutId={setCurrentLayoutId}
          user={user}
          theme={theme}
        />
      )}
      {activeModal === "profile" && (
        <UserProfileModal
          user={user}
          onClose={() => setActiveModal(null)}
          theme={theme}
          setTheme={setTheme}
          gridMultiplier={gridMultiplier}
          onResizeGrid={handleGridResize}
        />
      )}

      {/* Pending Action Tooltip */}
      {pendingLightCoords && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-bounce">
          👇 Select a road for the Stop Line
        </div>
      )}

      {/* Sidebar Toggle (Mobile) */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`p-2 rounded-lg shadow-lg border hover:opacity-90 transition-all ${
            isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          } ${
            theme === "light"
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-slate-800 border-slate-700 text-slate-200"
          }`}
        >
          <MenuIcon />
        </button>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <div
        className={`flex-shrink-0 h-full backdrop-blur-md shadow-2xl z-40 overflow-hidden transition-all duration-300 ease-in-out border-r flex flex-col ${
          isSidebarOpen ? "w-64" : "w-0 border-none"
        } ${T.sidebarBg} ${T.panelBorder}`}
      >
        <div className="w-64 h-full flex flex-col">
          {/* Header */}
          <div
            className={`p-6 border-b flex justify-between items-center ${
              T.panelBorder
            } ${theme === "light" ? "bg-slate-50" : "bg-slate-900"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg shadow-lg shadow-blue-500/30">
                🏗️
              </div>
              <h1 className={`text-xl font-bold tracking-tight ${T.textMain}`}>
                City<span className="text-blue-500 font-light">Pro</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal("profile")}
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all ${
                  theme === "light"
                    ? "bg-slate-200 border-slate-300 text-slate-600"
                    : "bg-slate-700 border-slate-600 text-slate-300"
                }`}
                title="User Settings"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : user.email ? (
                  user.email[0].toUpperCase()
                ) : (
                  "U"
                )}
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                  theme === "light"
                    ? "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Close Menu"
              >
                <XIcon />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Tool Settings (Lane Count) */}
            {!selectedCell &&
              selectedTool &&
              selectedTool.includes("multilane") && (
                <div
                  className={`mb-6 p-4 rounded-xl border-l-4 border-slate-400 shadow-md animate-fadeIn ${T.panelBg} ${T.panelBorder} border`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2
                      className={`text-sm font-bold uppercase tracking-wider ${T.textMain}`}
                    >
                      🛠️ Tool Settings
                    </h2>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={T.textDim}>Lanes to Place:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setToolLaneCount(Math.max(2, toolLaneCount - 1))
                        }
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          theme === "light"
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                      >
                        -
                      </button>
                      <span className={`font-bold ${T.textMain}`}>
                        {toolLaneCount}
                      </span>
                      <button
                        onClick={() =>
                          setToolLaneCount(Math.min(6, toolLaneCount + 1))
                        }
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          theme === "light"
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Properties Panel: Selected Multi-Lane Road */}
            {selectedCell &&
              selectedCellData &&
              selectedCellData.type &&
              selectedCellData.type.includes("multilane") && (
                <div
                  className={`mb-6 p-4 rounded-xl border-l-4 border-slate-400 shadow-md animate-fadeIn ${T.panelBg} ${T.panelBorder} border`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2
                      className={`text-sm font-bold uppercase tracking-wider ${T.textMain}`}
                    >
                      🛣️ Road Config
                    </h2>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className={`text-xs ${T.textDim} hover:${T.textMain}`}
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={T.textDim}>Lanes:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateLaneCount(
                            selectedCell.row,
                            selectedCell.col,
                            -1
                          )
                        }
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          theme === "light"
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                      >
                        -
                      </button>
                      <span className={`font-bold ${T.textMain}`}>
                        {selectedCellData.laneCount || 2}
                      </span>
                      <button
                        onClick={() =>
                          updateLaneCount(selectedCell.row, selectedCell.col, 1)
                        }
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          theme === "light"
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Global Auto-Spawn Settings */}
            {!selectedCell && autoSpawnEnabled && (
              <div
                className={`mb-6 p-4 rounded-xl border-l-4 border-fuchsia-500 shadow-md animate-fadeIn ${T.panelBg} ${T.panelBorder} border`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className={`text-sm font-bold uppercase tracking-wider ${T.textMain}`}
                  >
                    🔄 Auto-Spawn Intensity
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className={`text-xs min-w-[30px] ${T.textDim}`}>
                      Slow
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={spawnRate}
                      onChange={(e) => setSpawnRate(parseInt(e.target.value))}
                      className={`w-full flex-1 accent-fuchsia-500 h-1 rounded-lg appearance-none cursor-pointer ${
                        theme === "light" ? "bg-slate-300" : "bg-slate-700"
                      }`}
                    />
                    <span
                      className={`text-xs min-w-[30px] text-right ${T.textDim}`}
                    >
                      Fast
                    </span>
                  </div>
                  <div className="text-center mt-1 text-[10px] text-fuchsia-500 font-mono font-bold">
                    Intensity: {spawnRate}
                  </div>
                </div>
              </div>
            )}

            {/* Properties Panel: Traffic Light */}
            {(() => {
              let activeLight = null;
              let activeCoords = null;
              let isLinked = false;

              if (selectedCellData) {
                if (
                  selectedCellData.type === "traffic_light" ||
                  selectedCellData.hasTrafficLight
                ) {
                  activeLight = selectedCellData;
                  activeCoords = { r: selectedCell.row, c: selectedCell.col };
                } else if (selectedCellData.stopMarker) {
                  const { r, c } = selectedCellData.stopMarker;
                  const target = grid[r] && grid[r][c];
                  if (
                    target &&
                    (target.type === "traffic_light" || target.hasTrafficLight)
                  ) {
                    activeLight = target;
                    activeCoords = { r, c };
                    isLinked = true;
                  }
                }
              }

              if (!activeLight) return null;

              return (
                <div
                  className={`mb-6 p-4 rounded-xl border-l-4 border-blue-500 shadow-md animate-fadeIn ${T.panelBg} ${T.panelBorder} border`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2
                      className={`text-sm font-bold uppercase tracking-wider ${T.textMain}`}
                    >
                      {isLinked ? "🚦 Linked Signal" : "🚦 Signal Config"}
                    </h2>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className={`text-xs ${T.textDim} hover:${T.textMain}`}
                    >
                      Close
                    </button>
                  </div>

                  <div className="mb-4 flex items-center justify-between p-2 rounded-lg bg-black/10 border border-black/5">
                    <span className={`text-xs font-bold ${T.textDim}`}>
                      Current State:
                    </span>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          const nextState =
                            (activeLight.lightState || activeLight.state) ===
                            "green"
                              ? "yellow"
                              : (activeLight.lightState ||
                                  activeLight.state) === "yellow"
                              ? "red"
                              : "green";
                          updateTrafficLightState(
                            activeCoords.r,
                            activeCoords.c,
                            nextState
                          );
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95 ${
                          (activeLight.lightState || activeLight.state) ===
                          "green"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : (activeLight.lightState || activeLight.state) ===
                              "yellow"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            (activeLight.lightState || activeLight.state) ===
                            "green"
                              ? "bg-emerald-500"
                              : (activeLight.lightState ||
                                  activeLight.state) === "yellow"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        {activeLight.lightState || activeLight.state || "GREEN"}
                      </button>

                      <div className="ml-4 whitespace-nowrap text-[10px] font-mono font-bold opacity-70 text-slate-400">
                        ⏱{" "}
                        {activeLight.lightTimer !== undefined
                          ? activeLight.lightTimer
                          : activeLight.timer || 0}
                        /
                        {
                          (activeLight.lightConfig ||
                            activeLight.config || {
                              green: 10,
                              yellow: 4,
                              red: 10,
                            })[
                            activeLight.lightState ||
                              activeLight.state ||
                              "green"
                          ]
                        }
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {["green", "yellow", "red"].map((color) => (
                        <div key={color}>
                          <label
                            className={`text-[10px] text-${color}-500 block mb-1 capitalize font-bold`}
                          >
                            {color}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={
                              activeLight.lightConfig?.[color] ||
                              activeLight.config?.[color] ||
                              10
                            }
                            onChange={(e) =>
                              updateTrafficLightConfig(
                                activeCoords.r,
                                activeCoords.c,
                                color,
                                e.target.value
                              )
                            }
                            className={`w-full border rounded p-1 text-xs text-center ${
                              theme === "light"
                                ? "bg-slate-50 border-slate-300 text-slate-900"
                                : "bg-slate-900 border-slate-600 text-white"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Properties Panel: Car Config */}
            {selectedCell && selectedCellData && selectedCellData.hasCar && (
              <div
                className={`mb-6 p-4 rounded-xl border-l-4 border-orange-500 shadow-md animate-fadeIn ${T.panelBg} ${T.panelBorder} border`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h2
                    className={`text-sm font-bold uppercase tracking-wider ${T.textMain}`}
                  >
                    🚗 Car Settings
                  </h2>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className={`text-xs ${T.textDim} hover:${T.textMain}`}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <div
                      className={`flex justify-between text-[10px] mb-1 ${T.textDim}`}
                    >
                      <span>Speed</span>
                      <span>{selectedCellData.carConfig?.speed || 1}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.5"
                      value={selectedCellData.carConfig?.speed || 1}
                      onChange={(e) =>
                        updateCarConfig(
                          selectedCell.row,
                          selectedCell.col,
                          "speed",
                          parseFloat(e.target.value)
                        )
                      }
                      className={`w-full accent-orange-500 h-1 rounded-lg appearance-none cursor-pointer ${
                        theme === "light" ? "bg-slate-300" : "bg-slate-700"
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] block mb-2 ${T.textDim}`}>
                      Turn Priority
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["left", "none", "right"].map((bias) => (
                        <button
                          key={bias}
                          onClick={() =>
                            updateCarConfig(
                              selectedCell.row,
                              selectedCell.col,
                              "turnBias",
                              bias
                            )
                          }
                          className={`p-2 rounded text-xs border capitalize ${
                            (selectedCellData.carConfig?.turnBias || "none") ===
                            bias
                              ? "bg-orange-600 border-orange-400 text-white"
                              : theme === "light"
                              ? "bg-slate-100 border-slate-300 text-slate-500"
                              : "bg-slate-700 border-slate-600 text-slate-400"
                          }`}
                        >
                          {bias === "left"
                            ? "⬅ Left"
                            : bias === "right"
                            ? "Right ➡"
                            : "None"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Panel: Road Flow & Spawner */}
            {selectedCell &&
              selectedCellData &&
              selectedCellData.type &&
              selectedCellData.type.startsWith("road") && (
                <div
                  className={`mb-6 p-4 rounded-xl border-l-4 border-emerald-500 shadow-md animate-fadeIn ${T.panelBg} ${T.panelBorder} border`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2
                      className={`text-sm font-bold uppercase tracking-wider ${T.textMain}`}
                    >
                      🛣️ Traffic Flow
                    </h2>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className={`text-xs ${T.textDim} hover:${T.textMain}`}
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      <button
                        onClick={() =>
                          updateRoadFlow(
                            selectedCell.row,
                            selectedCell.col,
                            null
                          )
                        }
                        className={`p-1 rounded text-[10px] border ${
                          !selectedCellData.flowDirection
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : theme === "light"
                            ? "bg-slate-100 border-slate-300 text-slate-500"
                            : "bg-slate-700 border-slate-600 text-slate-300"
                        }`}
                      >
                        Any
                      </button>
                      {["up", "down", "left", "right"].map((dir) => {
                        // Check if this direction is active (Array or String)
                        const currentFlow = selectedCellData.flowDirection;
                        const isSelected = Array.isArray(currentFlow)
                          ? currentFlow.includes(dir)
                          : currentFlow === dir;

                        return (
                          <button
                            key={dir}
                            onClick={() =>
                              updateRoadFlow(
                                selectedCell.row,
                                selectedCell.col,
                                dir
                              )
                            }
                            className={`p-1 rounded text-lg border ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : theme === "light"
                                ? "bg-slate-100 border-slate-300 text-slate-500"
                                : "bg-slate-700 border-slate-600 text-slate-300"
                            }`}
                          >
                            {dir === "up"
                              ? "⬆️"
                              : dir === "down"
                              ? "⬇️"
                              : dir === "left"
                              ? "⬅️"
                              : "➡️"}
                          </button>
                        );
                      })}
                    </div>

                    {/* Spawner Toggle */}
                    <div
                      className={`pt-3 border-t mt-1 ${
                        theme === "light"
                          ? "border-slate-200"
                          : "border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className={`text-xs font-bold uppercase tracking-wider ${T.textMain}`}
                        >
                          🚙 Car Generator
                        </h3>
                        <button
                          onClick={() =>
                            updateSpawnerConfig(
                              selectedCell.row,
                              selectedCell.col,
                              "isSpawner",
                              !selectedCellData.isSpawner
                            )
                          }
                          className={`w-9 h-5 rounded-full transition-colors flex items-center p-1 ${
                            selectedCellData.isSpawner
                              ? "bg-emerald-500"
                              : "bg-slate-600"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              selectedCellData.isSpawner
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          ></div>
                        </button>
                      </div>

                      {selectedCellData.isSpawner && (
                        <div className="space-y-3">
                          <div
                            className={`flex justify-between items-center text-xs px-1 ${T.textDim}`}
                          >
                            <span>Frequency:</span>
                            <span
                              className={`font-mono font-bold ${
                                theme === "light"
                                  ? "text-slate-800"
                                  : "text-white"
                              }`}
                            >
                              {selectedCellData.spawnInterval || 20} ticks
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] ${T.textDim}`}>
                              Fast
                            </span>
                            <input
                              type="range"
                              min="5"
                              max="50"
                              step="5"
                              className={`flex-1 min-w-0 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${
                                theme === "light"
                                  ? "bg-slate-300"
                                  : "bg-slate-700"
                              }`}
                              value={selectedCellData.spawnInterval || 20}
                              onChange={(e) =>
                                updateSpawnerConfig(
                                  selectedCell.row,
                                  selectedCell.col,
                                  "spawnInterval",
                                  parseInt(e.target.value)
                                )
                              }
                            />
                            <span className={`text-[10px] ${T.textDim}`}>
                              Slow
                            </span>
                          </div>

                          <div className="flex justify-between items-center gap-2 px-1">
                            <label className={`text-[10px] ${T.textDim}`}>
                              Stop Gen. at Tick:
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="∞"
                              className={`w-16 p-1 text-[10px] text-right rounded border outline-none focus:border-emerald-500 transition-colors ${
                                theme === "light"
                                  ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                                  : "bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                              }`}
                              value={
                                selectedCellData.maxSpawnTick !== undefined &&
                                selectedCellData.maxSpawnTick !== null
                                  ? selectedCellData.maxSpawnTick
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSpawnerConfig(
                                  selectedCell.row,
                                  selectedCell.col,
                                  "maxSpawnTick",
                                  val === "" ? null : parseInt(val)
                                );
                              }}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] ${T.textDim}`}>
                              Random Turn Bias
                            </span>
                            <div className="flex gap-1 w-full">
                              {["left", "none", "right"].map((bias) => {
                                const currentBiases =
                                  selectedCellData.spawnerTurnBiases || [
                                    "none",
                                  ];
                                const isSelected = currentBiases.includes(bias);

                                return (
                                  <button
                                    key={bias}
                                    onClick={() => {
                                      let newBiases;
                                      if (isSelected) {
                                        newBiases = currentBiases.filter(
                                          (b) => b !== bias
                                        );
                                        if (newBiases.length === 0)
                                          newBiases = [bias];
                                      } else {
                                        newBiases = [...currentBiases, bias];
                                      }
                                      updateSpawnerConfig(
                                        selectedCell.row,
                                        selectedCell.col,
                                        "spawnerTurnBiases",
                                        newBiases
                                      );
                                    }}
                                    className={`flex-1 py-1.5 px-1 rounded text-[10px] border capitalize transition-all ${
                                      isSelected
                                        ? "bg-emerald-600 border-emerald-400 text-white font-bold"
                                        : theme === "light"
                                        ? "bg-slate-100 border-slate-300 text-slate-500"
                                        : "bg-slate-700 border-slate-600 text-slate-400"
                                    }`}
                                  >
                                    {bias === "left"
                                      ? "⬅ Left"
                                      : bias === "right"
                                      ? "Right ➡"
                                      : "Straight"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`pt-2 border-t mt-2 ${
                        theme === "light"
                          ? "border-slate-200"
                          : "border-slate-700"
                      }`}
                    >
                      <button
                        onClick={() =>
                          floodFillFlow(
                            selectedCell.row,
                            selectedCell.col,
                            selectedCellData.flowDirection
                          )
                        }
                        className={`w-full py-1.5 text-xs rounded transition-colors ${
                          theme === "light"
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        }`}
                      >
                        Apply to Connected
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Empty Selection Helper */}
            {!selectedCell && (
              <div
                className={`mb-6 p-4 border border-dashed rounded-xl text-center ${
                  theme === "light" ? "border-slate-300" : "border-slate-700"
                }`}
              >
                <p className={`text-xs ${T.textDim}`}>
                  Select a Road or Signal with{" "}
                  <span className="text-lg">👆</span> to edit.
                </p>
              </div>
            )}

            {/* Tool Selection Grid */}
            <div className="mb-8">
              <h2
                className={`text-xs font-bold uppercase tracking-wider mb-3 ml-1 ${T.textDim}`}
              >
                Tools & Objects
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {currentPaletteItems.map((item) => (
                  <PaletteItem
                    key={item.type}
                    item={item}
                    theme={theme}
                    isSelected={
                      selectedTool === item.type ||
                      (item.type === "toggle_autospawn" && autoSpawnEnabled)
                    }
                    onClick={() => {
                      if (item.type === "road_menu") {
                        setPaletteMode("road");
                        setSelectedTool("select");
                      } else if (item.type === "decoration_menu") {
                        setPaletteMode("decoration");
                        setSelectedTool("select");
                      } else if (item.type === "random_menu") {
                        setPaletteMode("random");
                        setSelectedTool("select");
                      } else if (item.type === "populate_cars") {
                        if (confirm("Randomly place cars on empty roads?")) {
                          handlePopulateCars();
                        }
                      } else if (item.type === "toggle_autospawn") {
                        setAutoSpawnEnabled(!autoSpawnEnabled);
                      } else {
                        setSelectedTool(item.type);
                      }
                      if (
                        ![
                          "select",
                          "populate_cars",
                          "toggle_autospawn",
                        ].includes(item.type)
                      ) {
                        setSelectedCell(null);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer: Back Button */}
          {paletteMode !== "main" && (
            <div
              className={`p-4 border-t ${T.panelBorder} ${
                theme === "light" ? "bg-slate-50" : "bg-slate-900"
              }`}
            >
              <button
                onClick={() => {
                  setPaletteMode("main");
                  setSelectedTool("select");
                }}
                className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border ${
                  theme === "light"
                    ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                }`}
              >
                <BackArrowIcon />
                <span className="text-sm font-medium">Back to Menu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Simulation Stage */}
      <div
        className={`flex-1 relative overflow-hidden flex flex-col min-w-0 ${T.bgApp}`}
      >
        {/* Floating Controls: Bottom Right */}
        <div
          className={`absolute bottom-8 right-8 z-50 flex items-center gap-2 p-2 backdrop-blur-md border rounded-2xl shadow-2xl ${
            theme === "light"
              ? "bg-white/90 border-slate-200"
              : "bg-slate-900/90 border-slate-700"
          }`}
        >
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={`p-3 rounded-xl transition-colors disabled:opacity-30 ${
              theme === "light"
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
            title="Undo"
          >
            <UndoIcon />
          </button>
          <button
            onClick={() => setStep((s) => Math.min(history.length - 1, s + 1))}
            disabled={step === history.length - 1}
            className={`p-3 rounded-xl transition-colors disabled:opacity-30 ${
              theme === "light"
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
            title="Redo"
          >
            <RedoIcon />
          </button>
          <div
            className={`w-px h-6 mx-1 ${
              theme === "light" ? "bg-slate-300" : "bg-slate-700"
            }`}
          ></div>
          <button
            onClick={() => setActiveModal("save")}
            className={`p-3 rounded-xl transition-colors ${
              theme === "light"
                ? "bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
            }`}
            title="Save Layout"
          >
            <SaveIcon />
          </button>
          <button
            onClick={() => setActiveModal("load")}
            className={`p-3 rounded-xl transition-colors ${
              theme === "light"
                ? "bg-blue-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
            }`}
            title="Load Layout"
          >
            <LoadIcon />
          </button>
          <div
            className={`w-px h-6 mx-1 ${
              theme === "light" ? "bg-slate-300" : "bg-slate-700"
            }`}
          ></div>
          <button
            onClick={() => {
              if (confirm("Clear entire grid? This cannot be undone.")) {
                setIsPlaying(false);
                setHistory((prev) => [
                  ...prev.slice(0, step + 1),
                  createEmptyGrid(rows, cols),
                ]);
                setStep((s) => s + 1);
              }
            }}
            className={`p-3 rounded-xl transition-colors ${
              theme === "light"
                ? "bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100"
                : "text-red-400 hover:text-red-300 hover:bg-red-500/20"
            }`}
            title="Clear Grid"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Floating Controls: Top Center */}
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div
            className={`flex items-center gap-4 px-6 py-3 backdrop-blur-md rounded-full border shadow-2xl pointer-events-auto ${
              theme === "light"
                ? "bg-white/90 border-slate-200"
                : "bg-slate-900/90 border-slate-700"
            }`}
          >
            <div
              className={`hidden md:block mr-4 pr-4 border-r text-xs ${
                theme === "light"
                  ? "border-slate-300 text-slate-500"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {selectedTool === "select"
                ? "Select Mode (Click objects)"
                : `Painting: ${selectedTool}`}
            </div>
            <button
              onClick={() => {
                if (!isPlaying) setPrePlayStep(step);
                setIsPlaying(!isPlaying);
              }}
              className={`px-6 py-2 rounded-full font-bold text-white shadow-lg flex items-center gap-2 ${
                isPlaying ? "bg-amber-500" : "bg-emerald-500"
              }`}
            >
              {isPlaying ? "⏸ Pause" : "▶ Start"}
            </button>
            <button
              onClick={() => {
                if (prePlayStep !== null) {
                  // Logic: Reset Grid to Pre-Play State
                  const originalGrid = history[prePlayStep];

                  // Reset ephemeral states (timers)
                  const resetGrid = originalGrid.map((row) =>
                    row.map((cell) => {
                      if (!cell) return null;
                      if (
                        cell.type === "traffic_light" ||
                        cell.hasTrafficLight
                      ) {
                        return {
                          ...cell,
                          lightTimer: 0,
                          timer: 0,
                        };
                      }
                      return { ...cell };
                    })
                  );

                  setHistory((prev) => {
                    const newHist = [...prev];
                    newHist[prePlayStep] = resetGrid;
                    return newHist;
                  });
                  setStep(prePlayStep);
                }
                setIsPlaying(false);
              }}
              className={`px-4 py-2 rounded-full text-xs border ${
                theme === "light"
                  ? "bg-slate-100 text-slate-600 border-slate-300"
                  : "bg-slate-800 text-slate-300 border-slate-600"
              }`}
              disabled={prePlayStep === null}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Grid Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="relative">
            <Grid
              grid={grid}
              rows={rows}
              cols={cols}
              onDrop={(r, c, t) => updateGrid(r, c, t)}
              onPaint={(r, c) => handleCellAction(r, c)}
              setIsMouseDown={setIsMouseDown}
              onRightClick={(r, c) => updateGrid(r, c, "eraser")}
              selectedCell={selectedCell}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
