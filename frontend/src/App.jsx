/**
 * FILE PURPOSE:
 * The Main Application Component.
 *
 * RESPONSIBILITIES:
 * - Manages Global State (User, Grid History, Selection, Play/Pause).
 * - Runs the Simulation Loop (Traffic logic, Car movement).
 * - Handles User Interactions (Clicking, Dragging, Key presses).
 * - Orchestrates the layout of the Sidebar and Main Stage.
 * - Manages Themes (Light/Dark) and Grid Resizing.
 *
 * DEPENDENCIES:
 * - ./components/* (UI Building Blocks)
 * - ./constants (Configuration)
 * - Firebase (Auth)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
// --- FIREBASE IMPORTS ---
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// --- COMPONENT IMPORTS ---
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

// --- CONSTANTS ---
import {
  MAIN_PALETTE_ITEMS,
  ROAD_PALETTE_ITEMS,
  DECORATION_PALETTE_ITEMS,
  RANDOM_PALETTE_ITEMS,
  THEMES,
} from "./constants";

// --- Helper Functions ---
const createEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array(cols).fill(null));

export default function App() {
  // --- STATE: Auth ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- STATE: Grid & History ---
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(25);
  const [gridMultiplier, setGridMultiplier] = useState(1.0);
  const [history, setHistory] = useState([createEmptyGrid(16, 25)]);
  const [step, setStep] = useState(0);

  // --- STATE: Tools & UI ---
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

  // --- STATE: Settings & Config ---
  const [autoSpawnEnabled, setAutoSpawnEnabled] = useState(false);
  const [spawnRate, setSpawnRate] = useState(5);
  const [theme, setTheme] = useState("dark");

  // --- REFS (Simulation Performance) ---
  const globalTickRef = useRef(0);
  const simulationState = useRef({
    history: [createEmptyGrid(16, 25)],
    step: 0,
  });

  // Determine current Theme Colors
  const T = THEMES?.[theme] || {
    bgApp: "bg-slate-950",
    textMain: "text-slate-200",
    textDim: "text-slate-400",
    panelBg: "bg-slate-900",
    panelBorder: "border-slate-800",
    sidebarBg: "bg-slate-900/95",
  };

  const grid =
    history && history[step] ? history[step] : createEmptyGrid(rows, cols);

  // --- 1. AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. SYNC REFS (When not playing) ---
  useEffect(() => {
    if (!isPlaying) {
      simulationState.current = { history, step };
    }
  }, [history, step, isPlaying]);

  // --- 3. HELPER: Get Cell Safe ---
  const getCell = (g, r, c) => {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return null;
    return g[r][c];
  };

  // --- NEW: Handle Grid Resizing (Resolution Change) ---
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

  // --- 4. LOGIC: Populate Cars ---
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

  // --- 5. LOGIC: Simulation Loop ---
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

      const isTargetCompatible = (tCell, entryDir) => {
        if (!tCell) return false;
        if (tCell.hasCar) return false;
        if (tCell.type === "traffic_light") return false;
        if (!tCell.type.startsWith("road")) return false;

        if (tCell.flowDirection) {
          if (tCell.flowDirection.startsWith("turn_")) {
            const entry = tCell.flowDirection.split("_")[1];
            return entryDir === entry;
          } else {
            return tCell.flowDirection === entryDir;
          }
        }
        return true;
      };

      // --- NEW: Individual Spawner Logic ---
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = newGrid[r][c];
          if (cell && cell.isSpawner && !cell.hasCar) {
            const interval = cell.spawnInterval || 20;
            const lastTick = cell.lastSpawnTick || 0;

            if (globalTickRef.current - lastTick >= interval) {
              let spawnDir = "right";
              if (
                cell.flowDirection &&
                !cell.flowDirection.startsWith("turn")
              ) {
                spawnDir = cell.flowDirection;
              } else if (cell.type.includes("vertical")) {
                spawnDir = "down";
              } else if (cell.type.includes("horizontal")) {
                spawnDir = "right";
              }

              cell.hasCar = spawnDir;
              cell.carConfig = { speed: 1, turnBias: "none" };
              cell.movementProgress = Math.random() * 200;
              cell.lastSpawnTick = globalTickRef.current;
            }
          }
        }
      }

      // [Auto-Spawn Logic (Global)]
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
            if (cell.flowDirection && !cell.flowDirection.startsWith("turn"))
              spawnDir = cell.flowDirection;
            else if (cell.type.includes("vertical"))
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

      // [Traffic Lights] (Updated to handle 'hasTrafficLight' property)
      if (globalTickRef.current % 5 === 0) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            let cell = newGrid[r][c];
            if (
              cell &&
              (cell.type === "traffic_light" || cell.hasTrafficLight)
            ) {
              // Ensure config exists
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

                // Update universal props
                cell.lightState = nextState;
                cell.state = nextState;
              }
              cell.lightTimer = timer;
              cell.timer = timer;
            }
          }
        }
      }

      // [Car Movement]
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

          // Flow Override
          if (currentFlow) {
            if (currentFlow === "left" && direction === "right")
              direction = "left";
            else if (currentFlow === "right" && direction === "left")
              direction = "right";
            else if (currentFlow === "up" && direction === "down")
              direction = "up";
            else if (currentFlow === "down" && direction === "up")
              direction = "down";
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
          const adjOffsets = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 },
          ];
          for (const offset of adjOffsets) {
            const neighbor = getCell(newGrid, r + offset.dr, c + offset.dc);
            if (
              neighbor &&
              (neighbor.type === "traffic_light" || neighbor.hasTrafficLight)
            ) {
              const state = neighbor.lightState || neighbor.state || "green";
              if (state === "yellow" || state === "red")
                isBlockedByLight = true;
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
              if (
                cell.flowDirection &&
                cell.flowDirection !== dir &&
                !cell.flowDirection.startsWith("turn_")
              )
                return false;
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

            if (cell.flowDirection && cell.flowDirection.startsWith("turn_")) {
              const exit = cell.flowDirection.split("_")[2];
              if (isValidMove(exit)) {
                possibleMoves.length = 0;
                possibleMoves.push(exit);
              }
            }

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
              canMove = false;
              newGrid[r][c] = {
                ...cell,
                hasCar: direction,
                movementProgress: MOVE_THRESHOLD,
              };
            }

            if (canMove) {
              const movingConfig = cell.carConfig;
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

  // --- 6. LOGIC: Update Grid ---
  const updateGrid = useCallback(
    (row, col, newItemOrType) => {
      if (isPlaying) setIsPlaying(false);

      setHistory((prev) => {
        const current = prev[step];
        const newGrid = current.map((r) =>
          r.map((cell) => (cell ? { ...cell } : null))
        );
        let updatedCell = newGrid[row][col] || { type: null, hasCar: false };

        if (selectedTool === "select") return prev;

        if (newItemOrType === "eraser") {
          // If we have a traffic light, remove it first, but keep the road?
          // User request implied they want to place lights on roads.
          // Standard erasing usually kills the whole cell.
          if (updatedCell.hasCar) {
            updatedCell.hasCar = false;
            updatedCell.carConfig = undefined;
            newGrid[row][col] = updatedCell;
          } else {
            updatedCell = null;
            newGrid[row][col] = null;
          }
        } else if (newItemOrType === "car") {
          let startDir = "right";
          if (
            updatedCell.flowDirection &&
            !updatedCell.flowDirection.startsWith("turn")
          ) {
            startDir = updatedCell.flowDirection;
          }
          updatedCell.hasCar = startDir;
          updatedCell.carConfig = { speed: 1, turnBias: "none" };
          newGrid[row][col] = updatedCell;
        }
        // --- TRAFFIC LIGHT (Overlay Logic) ---
        else if (newItemOrType === "traffic_light") {
          if (updatedCell.type && updatedCell.type.startsWith("road")) {
            updatedCell.hasTrafficLight = true;
            updatedCell.lightState = "green";
            updatedCell.lightTimer = 0;
            updatedCell.lightConfig = { green: 10, yellow: 4, red: 10 };
          } else {
            // Fallback: Create intersection with light
            updatedCell.type = "road_intersection";
            updatedCell.hasTrafficLight = true;
            updatedCell.lightState = "green";
            updatedCell.lightTimer = 0;
            updatedCell.lightConfig = { green: 10, yellow: 4, red: 10 };
          }
          newGrid[row][col] = updatedCell;
        }
        // ... (Rest of road types)
        else if (newItemOrType === "road_divider_vertical") {
          updatedCell.type = newItemOrType;
          updatedCell.lanePosition = 0;
          newGrid[row][col] = updatedCell;
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

        const newHist = [...prev.slice(0, step + 1), newGrid];
        simulationState.current = { history: newHist, step: step + 1 };
        return newHist;
      });
      setStep((s) => s + 1);
    },
    [step, selectedTool, isPlaying, rows, cols, toolLaneCount]
  );

  // --- 7. LOGIC: Update Configs ---
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
        }
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

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
        // Sync legacy prop just in case
        newGrid[row][col].config = newGrid[row][col].lightConfig;
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  const updateRoadFlow = (row, col, direction) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      if (newGrid[row][col] && newGrid[row][col].type.startsWith("road")) {
        newGrid[row][col].flowDirection = direction;
        newGrid[row][col].flowPriority = null; // Clear priority
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

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

  const floodFillFlow = (row, col, direction) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      const startCell = newGrid[row][col];
      if (!startCell || !startCell.type.startsWith("road")) return prev;

      let initialPropDir = direction;
      if (direction && direction.startsWith("turn_")) {
        initialPropDir = direction.split("_")[2];
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
          // Lane Hopping
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
          let newFlow = currDir;

          if (r !== row || c !== col) {
            const cellType = currentCell.type;
            if (
              cellType.includes("horizontal") &&
              (currDir === "up" || currDir === "down")
            ) {
              const leftN = getCell(newGrid, r, c - 1);
              const rightN = getCell(newGrid, r, c + 1);
              if (leftN && leftN.type.startsWith("road")) {
                nextPropDir = "left";
                newFlow = `turn_${currDir}_left`;
              } else if (rightN && rightN.type.startsWith("road")) {
                nextPropDir = "right";
                newFlow = `turn_${currDir}_right`;
              }
            } else if (
              cellType.includes("vertical") &&
              (currDir === "left" || currDir === "right")
            ) {
              const upN = getCell(newGrid, r - 1, c);
              const downN = getCell(newGrid, r + 1, c);
              if (upN && upN.type.startsWith("road")) {
                nextPropDir = "up";
                newFlow = `turn_${currDir}_up`;
              } else if (downN && downN.type.startsWith("road")) {
                nextPropDir = "down";
                newFlow = `turn_${currDir}_down`;
              }
            }
          } else {
            newFlow = direction || null;
            if (direction && direction.startsWith("turn_")) {
              nextPropDir = direction.split("_")[2];
            }
          }

          let dr = 0,
            dc = 0;
          if (nextPropDir === "up") dr = -1;
          if (nextPropDir === "down") dr = 1;
          if (nextPropDir === "left") dc = -1;
          if (nextPropDir === "right") dc = 1;

          const nr = r + dr;
          const nc = c + dc;
          const isNextCellValid =
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            newGrid[nr][nc] &&
            newGrid[nr][nc].type.startsWith("road");

          if (isNextCellValid) {
            currentCell.flowDirection = newFlow;
            currentCell.flowPriority = null;
            queue.push([nr, nc, nextPropDir]);
          } else {
            currentCell.flowDirection = null;
            currentCell.flowPriority = newFlow; // Set Priority at end of line
          }
        }
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  const handleCellAction = (r, c) => {
    if (selectedTool === "select") {
      setSelectedCell({ row: r, col: c });
      if (!isSidebarOpen) setIsSidebarOpen(true);
    } else {
      updateGrid(r, c, selectedTool);
    }
  };

  const handleLoadLayout = (loadedGrid, loadedRows, loadedCols, id) => {
    const parsedGrid =
      typeof loadedGrid === "string" ? JSON.parse(loadedGrid) : loadedGrid;
    setRows(loadedRows);
    setCols(loadedCols);
    setGridMultiplier(loadedRows / 16); // Approximate multiplier from loaded rows
    setHistory([parsedGrid]);
    setStep(0);
    setIsPlaying(false);
    setPrePlayStep(null);
    setCurrentLayoutId(id);
  };

  // Determine active palette
  let currentPaletteItems = MAIN_PALETTE_ITEMS;
  if (paletteMode === "road") currentPaletteItems = ROAD_PALETTE_ITEMS;
  if (paletteMode === "decoration")
    currentPaletteItems = DECORATION_PALETTE_ITEMS;
  if (paletteMode === "random") currentPaletteItems = RANDOM_PALETTE_ITEMS;

  const selectedCellData = selectedCell
    ? grid && grid[selectedCell.row] && grid[selectedCell.row][selectedCell.col]
    : null;

  // --- RENDER ---
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 items-center justify-center font-sans text-slate-400 animate-pulse">
        Loading Authentication...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div
      className={`flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300 ${T.bgApp} ${T.textMain}`}
    >
      {/* --- Modals --- */}
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

      {/* --- Sidebar Mobile Toggle --- */}
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

      {/* --- Main Sidebar --- */}
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
              {/* SIDEBAR CLOSE BUTTON - FIXED */}
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
            {/* ... (Keep Tool Settings / Auto Spawn / Properties Panels) ... */}
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

            {/* --- PROPERTIES PANEL: Selected Multi-Lane Road --- */}
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

            {/* ... (Keep Traffic Light / Car Config / Flow Config / Auto Spawn) ... */}
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

            {/* ... (Traffic light panel) ... */}
            {selectedCell &&
              selectedCellData &&
              (selectedCellData.type === "traffic_light" ||
                selectedCellData.hasTrafficLight) && (
                <div
                  className={`mb-6 p-4 rounded-xl border-l-4 border-blue-500 shadow-md animate-fadeIn ${T.panelBg} ${T.panelBorder} border`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2
                      className={`text-sm font-bold uppercase tracking-wider ${T.textMain}`}
                    >
                      🚦 Signal Config
                    </h2>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className={`text-xs ${T.textDim} hover:${T.textMain}`}
                    >
                      Close
                    </button>
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
                              selectedCellData.lightConfig?.[color] ||
                              selectedCellData.config?.[color] ||
                              10
                            }
                            onChange={(e) =>
                              updateTrafficLightConfig(
                                selectedCell.row,
                                selectedCell.col,
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
              )}

            {/* ... (Car Settings Panel) ... */}
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

            {/* ... (Flow Settings Panel) ... */}
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
                      {["up", "down", "left", "right"].map((dir) => (
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
                            selectedCellData.flowDirection === dir
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
                      ))}
                    </div>

                    {/* --- NEW: SPAWNER CONFIG SECTION --- */}
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
                          // 1. "w-9" gives a bit more breathing room (36px).
                          // 2. "flex items-center" ensures perfect vertical centering (fixes Y-axis).
                          // 3. "p-1" adds consistent padding around the ball.
                          className={`w-9 h-5 rounded-full transition-colors flex items-center p-1 ${
                            selectedCellData.isSpawner
                              ? "bg-emerald-500"
                              : "bg-slate-600"
                          }`}
                        >
                          <div
                            // 1. Removed absolute positioning.
                            // 2. "translate-x-4" moves it 16px to the right (perfect for this width).
                            className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              selectedCellData.isSpawner
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          ></div>
                        </button>
                      </div>

                      {selectedCellData.isSpawner && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className={T.textDim}>Frequency:</span>
                            <span className={T.textMain}>
                              {selectedCellData.spawnInterval || 20} ticks
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${T.textDim}`}>
                              Fast
                            </span>
                            <input
                              type="range"
                              min="5"
                              max="50"
                              step="5"
                              className={`flex-1 min-w-0 h-1 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${
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

            {/* --- Helper Text --- */}
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

            {/* --- Tools Palette (Updated to pass theme) --- */}
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
                    // ADDED: theme prop passed down
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

      {/* --- Main Stage --- */}
      <div
        className={`flex-1 relative overflow-hidden flex flex-col min-w-0 ${T.bgApp}`}
      >
        {/* Floating Controls: Bottom Right (Updated colors for visibility) */}
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
                if (prePlayStep !== null) setStep(prePlayStep);
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

        {/* Grid Canvas Container with Scaling */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          {/* CHANGED: Removed scale transform, wrapper now just holds the Grid */}
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
