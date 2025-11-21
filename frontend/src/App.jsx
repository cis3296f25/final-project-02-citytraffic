// version 3 - Merged and Enhanced
import React, { useState, useEffect, useCallback, useMemo } from "react";

// --- Constants ---
const TOTAL_GRID_WIDTH_PX = 19 * 64;
const TOTAL_GRID_HEIGHT_PX = 12 * 64;
const RATIO = 1.5625;
const API_BASE_URL = 'http://localhost:8000/api';

// --- Palettes ---
const MAIN_PALETTE_ITEMS = [
  { type: "select", label: "Select", emoji: "👆" },
  { type: "road_menu", label: "Road", emoji: "🛣️" },
  { type: "car", label: "Car", emoji: "🚗" },
  { type: "building", label: "Building", emoji: "🏢" },
  { type: "tree", label: "Tree", emoji: "🌳" },
  { type: "traffic_light", label: "Light", emoji: "🚦" },
  { type: "eraser", label: "Eraser", emoji: "🧼" },
];

const ROAD_PALETTE_ITEMS = [
  { type: "road_straight_vertical", label: "Vertical", emoji: "⬆️" },
  { type: "road_straight_horizontal", label: "Horizontal", emoji: "➡️" },
  { type: "road_intersection", label: "Intersection", emoji: "➕" },
  { type: "back", label: "Back", emoji: "⬅️" },
];

// --- Helper Functions ---
const createEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array(cols).fill(null));

/**
 * Renders the SVG Car with rotation based on direction
 */
const renderCar = (direction) => {
  let rotation = 0;
  if (direction === "right") rotation = 90;
  if (direction === "down") rotation = 180;
  if (direction === "left") rotation = 270;

  return (
    <g transform={`translate(50,50) rotate(${rotation}) translate(-25,-30)`}>
      <rect x="2" y="4" width="50" height="60" rx="8" fill="rgba(0,0,0,0.2)" />
      <rect x="-4" y="8" width="8" height="12" rx="2" fill="#333" />
      <rect x="46" y="8" width="8" height="12" rx="2" fill="#333" />
      <rect x="-4" y="40" width="8" height="12" rx="2" fill="#333" />
      <rect x="46" y="40" width="8" height="12" rx="2" fill="#333" />
      <rect
        x="0"
        y="0"
        width="50"
        height="60"
        rx="8"
        fill="#EF4444"
        stroke="#991B1B"
        strokeWidth="2"
      />
      <rect x="5" y="8" width="40" height="10" rx="2" fill="#93C5FD" />
      <rect x="5" y="42" width="40" height="8" rx="2" fill="#93C5FD" />
      <rect
        x="6"
        y="20"
        width="38"
        height="20"
        rx="1"
        fill="#F87171"
        opacity="0.5"
      />
    </g>
  );
};

const renderCellContent = (cellData, neighborInfo) => {
  const cellType = cellData?.type;
  const carDirection = cellData?.hasCar;
  const content = [];

  // --- 1. Render BASE ---
  if (cellType) {
    const isRoad = cellType.startsWith("road_");

    if (!isRoad) {
      const item =
        MAIN_PALETTE_ITEMS.find((p) => p.type === cellType) ||
        ROAD_PALETTE_ITEMS.find((p) => p.type === cellType);

      if (item) {
        content.push(
          <foreignObject key="base" x="0" y="0" width="100" height="100">
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {item.emoji}
            </div>
          </foreignObject>
        );
      }
    } else {
      const strokeColor = "#4A5568";
      const strokeWidth = 80;
      const center = 50;

      if (cellType === "road_intersection") {
        const { up, down, left, right } = neighborInfo;
        
        // Draw segments based on which roads neighbor the intersection
        if (up)
          content.push(
            <line
              key="up"
              x1={center}
              y1={center}
              x2={center}
              y2={-1}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        if (down)
          content.push(
            <line
              key="down"
              x1={center}
              y1={center}
              x2={center}
              y2={101}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        if (left)
          content.push(
            <line
              key="left"
              x1={center}
              y1={center}
              x2={-1}
              y2={center}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        if (right)
          content.push(
            <line
              key="right"
              x1={center}
              y1={center}
              x2={101}
              y2={center}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        
        if (!(up || down || left || right)) {
          content.push(
            <circle
              key="dot"
              cx={center}
              cy={center}
              r={strokeWidth / 2}
              fill={strokeColor}
            />
          );
        }
      } else if (cellType === "road_straight_vertical") {
        content.push(
          <line
            key="vertical"
            x1={center}
            y1={-1}
            x2={center}
            y2={101}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      } else if (cellType === "road_straight_horizontal") {
        content.push(
          <line
            key="horizontal"
            x1={-1}
            y1={center}
            x2={101}
            y2={center}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      }
    }
  }

  // --- 2. Render CAR ---
  if (carDirection) {
    content.push(
      <React.Fragment key="car">{renderCar(carDirection)}</React.Fragment>
    );
  }

  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {content}
    </svg>
  );
};

// --- Grid Cell Component ---
const GridCell = React.memo(
  ({
    cellData,
    row,
    col,
    onDrop,
    onPaint,
    onRightClick,
    cellWidth,
    cellHeight,
    neighborInfo,
  }) => {
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
      e.preventDefault();
      onDrop(row, col, e.dataTransfer.getData("itemType"));
    };
    const handleMouseEnter = (e) => {
      if (e.buttons === 1) onPaint(row, col);
    };
    const handleMouseDown = (e) => {
      if (e.button === 0) onPaint(row, col);
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      onRightClick(row, col);
    };

    return (
      <div
        style={{
          position: "absolute",
          left: `${col * cellWidth}px`,
          top: `${row * cellHeight}px`,
          width: `${cellWidth}px`,
          height: `${cellHeight}px`,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onContextMenu={handleContextMenu}
        className="bg-transparent flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
      >
        {renderCellContent(cellData, neighborInfo)}
      </div>
    );
  }
);

// --- Grid Component ---
const Grid = ({
  grid,
  rows,
  cols,
  onDrop,
  onPaint,
  setIsMouseDown,
  onRightClick,
}) => {
  const cellWidth = TOTAL_GRID_WIDTH_PX / cols;
  const cellHeight = TOTAL_GRID_HEIGHT_PX / rows;

  // Road detection functions
  const getIsVerticalRoad = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r][c] &&
    grid[r][c].type === "road_straight_vertical";

  const getIsHorizontalRoad = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r][c] &&
    grid[r][c].type === "road_straight_horizontal";

  const getIsIntersection = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r][c] &&
    grid[r][c].type === "road_intersection";

  const getIsAnyRoad = (r, c) =>
    getIsVerticalRoad(r, c) || getIsHorizontalRoad(r, c) || getIsIntersection(r, c);

  // Centerlines Logic - Memoized for performance
  const centerLines = useMemo(() => {
    const lines = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!getIsAnyRoad(r, c)) continue;
        const cx = (c + 0.5) * cellWidth;
        const cy = (r + 0.5) * cellHeight;

        // Only connect matching road types and intersections
        if (getIsIntersection(r, c)) {
          if (getIsVerticalRoad(r - 1, c) || getIsIntersection(r - 1, c))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx,
              y2: cy - cellHeight,
              key: `i-vu-${r}-${c}`,
            });
          if (getIsVerticalRoad(r + 1, c) || getIsIntersection(r + 1, c))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx,
              y2: cy + cellHeight,
              key: `i-vd-${r}-${c}`,
            });
          if (getIsHorizontalRoad(r, c - 1) || getIsIntersection(r, c - 1))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx - cellWidth,
              y2: cy,
              key: `i-hl-${r}-${c}`,
            });
          if (getIsHorizontalRoad(r, c + 1) || getIsIntersection(r, c + 1))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx + cellWidth,
              y2: cy,
              key: `i-hr-${r}-${c}`,
            });
        } else if (getIsVerticalRoad(r, c)) {
          if (getIsVerticalRoad(r - 1, c) || getIsIntersection(r - 1, c))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx,
              y2: cy - cellHeight,
              key: `v-up-${r}-${c}`,
            });
          if (getIsVerticalRoad(r + 1, c) || getIsIntersection(r + 1, c))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx,
              y2: cy + cellHeight,
              key: `v-down-${r}-${c}`,
            });
        } else if (getIsHorizontalRoad(r, c)) {
          if (getIsHorizontalRoad(r, c - 1) || getIsIntersection(r, c - 1))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx - cellWidth,
              y2: cy,
              key: `h-left-${r}-${c}`,
            });
          if (getIsHorizontalRoad(r, c + 1) || getIsIntersection(r, c + 1))
            lines.push({
              x1: cx,
              y1: cy,
              x2: cx + cellWidth,
              y2: cy,
              key: `h-right-${r}-${c}`,
            });
        }
      }
    }
    return lines;
  }, [grid, rows, cols, cellWidth, cellHeight]);

  return (
    <div
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
      className="relative bg-white shadow-sm"
      style={{
        userSelect: "none",
        width: `${TOTAL_GRID_WIDTH_PX}px`,
        height: `${TOTAL_GRID_HEIGHT_PX}px`,
      }}
    >
      {grid.flatMap((row, rowIndex) =>
        row.map((cellData, colIndex) => {
          const cellType = cellData?.type || null;
          let neighborInfo = { up: false, down: false, left: false, right: false };

          if (cellType === "road_intersection") {
            neighborInfo = {
              up: getIsVerticalRoad(rowIndex - 1, colIndex) || getIsIntersection(rowIndex - 1, colIndex),
              down: getIsVerticalRoad(rowIndex + 1, colIndex) || getIsIntersection(rowIndex + 1, colIndex),
              left: getIsHorizontalRoad(rowIndex, colIndex - 1) || getIsIntersection(rowIndex, colIndex - 1),
              right: getIsHorizontalRoad(rowIndex, colIndex + 1) || getIsIntersection(rowIndex, colIndex + 1),
            };
          } else if (cellType === "road_straight_vertical") {
            neighborInfo = {
              up: getIsVerticalRoad(rowIndex - 1, colIndex) || getIsIntersection(rowIndex - 1, colIndex),
              down: getIsVerticalRoad(rowIndex + 1, colIndex) || getIsIntersection(rowIndex + 1, colIndex),
              left: false,
              right: false,
            };
          } else if (cellType === "road_straight_horizontal") {
            neighborInfo = {
              up: false,
              down: false,
              left: getIsHorizontalRoad(rowIndex, colIndex - 1) || getIsIntersection(rowIndex, colIndex - 1),
              right: getIsHorizontalRoad(rowIndex, colIndex + 1) || getIsIntersection(rowIndex, colIndex + 1),
            };
          }

          return (
            <GridCell
              key={`${rowIndex}-${colIndex}`}
              cellData={cellData}
              neighborInfo={neighborInfo}
              row={rowIndex}
              col={colIndex}
              onDrop={onDrop}
              onPaint={onPaint}
              onRightClick={onRightClick}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
            />
          );
        })
      )}
      <svg
        width={TOTAL_GRID_WIDTH_PX}
        height={TOTAL_GRID_HEIGHT_PX}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        {centerLines.map((line) => (
          <line
            {...line}
            stroke="#FDE047"
            strokeWidth="4"
            strokeDasharray="20 15"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
};

const PaletteItem = ({ item, isSelected, onClick }) => {
  const handleDragStart = (e) => e.dataTransfer.setData("itemType", item.type);
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`w-full h-auto aspect-square border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-lg"
          : "border-gray-300 bg-white hover:border-blue-300"
      }`}
    >
      <span className="text-3xl">{item.emoji}</span>
      <span className="text-xs text-gray-600 mt-1">{item.label}</span>
    </div>
  );
};

// --- Save/Load Panel Component ---
const SaveLoadPanel = ({ grid, rows, cols, onLoadLayout }) => {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const fetchLayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/layouts/`);
      if (!response.ok) throw new Error('Failed to fetch layouts');
      const data = await response.json();
      setLayouts(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching layouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async (layoutData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/layouts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(layoutData),
      });
      
      if (!response.ok) throw new Error('Failed to save layout');
      
      const savedLayout = await response.json();
      setLayouts(prev => [savedLayout, ...prev]);
      return savedLayout;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteLayout = async (layoutId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/layouts/${layoutId}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete layout');
      
      setLayouts(prev => prev.filter(layout => layout.id !== layoutId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Please enter a name for your layout');
      return;
    }

    try {
      await saveLayout({
        name: saveName,
        description: saveDescription,
        rows,
        cols,
        grid_data: grid,
      });
      setSaveName('');
      setSaveDescription('');
      setShowSaveForm(false);
      alert('Layout saved successfully!');
    } catch (err) {
      alert('Failed to save layout. Make sure the backend server is running.');
    }
  };

  const handleLoad = (layout) => {
    if (window.confirm(`Load layout "${layout.name}"? This will replace your current grid.`)) {
      onLoadLayout(layout.grid_data, layout.rows, layout.cols);
    }
  };

  const handleDelete = async (layout) => {
    if (window.confirm(`Delete layout "${layout.name}"?`)) {
      try {
        await deleteLayout(layout.id);
        alert('Layout deleted successfully!');
      } catch (err) {
        alert('Failed to delete layout');
      }
    }
  };

  const handleRefresh = () => {
    fetchLayouts();
  };

  useEffect(() => {
    fetchLayouts();
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Save & Load</h3>
        <button
          onClick={handleRefresh}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          title="Refresh layouts"
        >
          🔄
        </button>
      </div>
      
      {/* Save Form */}
      {showSaveForm ? (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <input
            type="text"
            placeholder="Layout Name *"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-sm"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveForm(true)}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-4"
        >
          💾 Save Current Layout
        </button>
      )}

      {/* Load List */}
      <div>
        <h4 className="font-medium mb-2">Saved Layouts</h4>
        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {error && (
          <div className="text-red-500 text-sm mb-2 p-2 bg-red-50 rounded">
            {error} - Make sure backend is running on port 8000
          </div>
        )}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {layouts.length === 0 && !loading && (
            <p className="text-sm text-gray-500 text-center py-4">
              No saved layouts yet
            </p>
          )}
          {layouts.map((layout) => (
            <div key={layout.id} className="flex justify-between items-center p-2 border rounded bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{layout.name}</div>
                <div className="text-xs text-gray-500">
                  {layout.rows}x{layout.cols} • {new Date(layout.created_at).toLocaleDateString()}
                </div>
                {layout.description && (
                  <div className="text-xs text-gray-600 truncate mt-1">
                    {layout.description}
                  </div>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => handleLoad(layout)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                  title="Load layout"
                >
                  📂
                </button>
                <button
                  onClick={() => handleDelete(layout)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  title="Delete layout"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(25);
  const [history, setHistory] = useState([createEmptyGrid(16, 25)]);
  const [step, setStep] = useState(0);
  const grid = history[step];
  const [selectedTool, setSelectedTool] = useState("select");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paletteMode, setPaletteMode] = useState("main");
  const [isPlaying, setIsPlaying] = useState(false);
  const [prePlayStep, setPrePlayStep] = useState(null);

  // Helper to get a cell safely
  const getCell = (g, r, c) => {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return null;
    return g[r][c];
  };

  // --- Simulation Tick Logic ---
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setHistory((prev) => {
        const current = prev[step];
        const newGrid = current.map((row) =>
          row.map((cell) => (cell ? { ...cell } : null))
        );
        const movedCars = new Set();

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = current[r][c];

            if (cell && cell.hasCar && !movedCars.has(`${r},${c}`)) {
              const direction = cell.hasCar;
              let nextR = r;
              let nextC = c;
              let nextDir = direction;

              if (direction === "up") nextR--;
              if (direction === "down") nextR++;
              if (direction === "left") nextC--;
              if (direction === "right") nextC++;

              const targetCell = getCell(current, nextR, nextC);

              let canMove = false;

              if (targetCell && targetCell.type === "traffic_light") {
                // Stop at traffic light
              } else if (
                targetCell &&
                (targetCell.type === "road_straight_vertical" ||
                  targetCell.type === "road_straight_horizontal" ||
                  targetCell.type === "road_intersection") &&
                !targetCell.hasCar
              ) {
                canMove = true;
              } else {
                const possibleTurns = [];
                const checkTurn = (dr, dc, dir) => {
                  const t = getCell(current, r + dr, c + dc);
                  if (
                    t &&
                    (t.type === "road_straight_vertical" ||
                      t.type === "road_straight_horizontal" ||
                      t.type === "road_intersection") &&
                    !t.hasCar
                  ) {
                    possibleTurns.push(dir);
                  }
                };

                if (direction === "up" || direction === "down") {
                  checkTurn(0, -1, "left");
                  checkTurn(0, 1, "right");
                } else {
                  checkTurn(-1, 0, "up");
                  checkTurn(1, 0, "down");
                }

                if (possibleTurns.length > 0) {
                  nextDir = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
                  nextR = r;
                  nextC = c;
                  if (nextDir === "up") nextR--;
                  if (nextDir === "down") nextR++;
                  if (nextDir === "left") nextC--;
                  if (nextDir === "right") nextC++;
                  canMove = true;
                }
              }

              if (canMove) {
                if (newGrid[r][c]) {
                  newGrid[r][c].hasCar = false;
                  if (!newGrid[r][c].type) newGrid[r][c] = null;
                }

                if (!newGrid[nextR][nextC]) {
                  newGrid[nextR][nextC] = {
                    type: "road_straight_horizontal",
                    hasCar: nextDir,
                  };
                } else {
                  newGrid[nextR][nextC].hasCar = nextDir;
                }

                movedCars.add(`${nextR},${nextC}`);
              } else {
                if (newGrid[r][c]) newGrid[r][c].hasCar = nextDir;
              }
            }
          }
        }
        return [...prev.slice(0, step + 1), newGrid];
      });
      setStep((s) => s + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, step, rows, cols]);

  const updateGrid = useCallback((row, col, newItemOrType) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) => r.map((cell) => (cell ? { ...cell } : null)));
      const currentCell = newGrid[row][col] || { type: null, hasCar: false };
      let updatedCell = { ...currentCell };

      if (newItemOrType === null || newItemOrType === "eraser") {
        if (updatedCell.hasCar) {
          updatedCell.hasCar = false;
          if (!updatedCell.type) updatedCell = null;
        } else {
          updatedCell = null;
        }
      } else if (newItemOrType === "car") {
        updatedCell.hasCar = "right";
      } else {
        updatedCell.type = newItemOrType;
      }
      newGrid[row][col] = updatedCell;
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  }, [step]);

  const handleDrop = useCallback(
    (r, c, t) => {
      if (t && t !== "select" && t !== "back" && t !== "road_menu")
        updateGrid(r, c, t);
    },
    [updateGrid]
  );
  
  const handlePaint = useCallback(
    (r, c) => {
      if (
        !selectedTool ||
        ["select", "back", "road_menu"].includes(selectedTool)
      )
        return;
      updateGrid(r, c, selectedTool);
    },
    [selectedTool, updateGrid]
  );
  
  const handleRightClick = useCallback(
    (r, c) => updateGrid(r, c, "eraser"),
    [updateGrid]
  );

  const resetGridDimensions = (newRows, newCols) => {
    if (isNaN(newRows) || newRows <= 0) return;
    setRows(newRows);
    setCols(newCols);
    setHistory((prev) => [
      ...prev.slice(0, step + 1),
      createEmptyGrid(newRows, newCols),
    ]);
    setStep((s) => s + 1);
  };

  const handleLoadLayout = (loadedGrid, loadedRows, loadedCols) => {
    setRows(loadedRows);
    setCols(loadedCols);
    setHistory([loadedGrid]);
    setStep(0);
    setIsPlaying(false);
    setPrePlayStep(null);
  };

  const currentPaletteItems =
    paletteMode === "road" ? ROAD_PALETTE_ITEMS : MAIN_PALETTE_ITEMS;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-80 bg-white shadow-lg p-6 flex flex-col overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">City Builder Pro</h1>
        <p className="text-sm text-gray-600 mb-6">Build and simulate city traffic</p>

        {/* Save/Load Panel */}
        <SaveLoadPanel 
          grid={grid}
          rows={rows}
          cols={cols}
          onLoadLayout={handleLoadLayout}
        />

        {/* History Controls */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">History</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(s => Math.max(0, s-1))}
              disabled={step === 0}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↩ Undo
            </button>
            <button
              onClick={() => setStep(s => Math.min(history.length-1, s+1))}
              disabled={step === history.length-1}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↪ Redo
            </button>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="mb-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-2 tracking-wider">
            Simulation
          </h3>
          <button
            onClick={() => {
              if (!isPlaying) setPrePlayStep(step);
              setIsPlaying(!isPlaying);
            }}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-sm transition-all transform active:scale-95 ${
              isPlaying
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isPlaying ? "⏸ Pause Traffic" : "▶ Start Traffic"}
          </button>
          <button
            onClick={() => {
              if (prePlayStep !== null) setStep(prePlayStep);
            }}
            className="w-full mt-2 py-3 rounded-lg font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-sm transition-all active:scale-95"
            disabled={prePlayStep === null}
          >
            🔄 Restart Traffic
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {isPlaying ? "Cars are moving..." : "Place cars then click Start"}
          </p>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-2">Dimensions</h2>
        <div className="flex gap-2 mb-6">
          <div className="flex-1">
            <label className="text-xs block mb-1">Rows</label>
            <input
              type="number"
              value={rows}
              onChange={(e) =>
                resetGridDimensions(
                  Math.max(1, parseInt(e.target.value)),
                  Math.round(Math.max(1, parseInt(e.target.value)) * RATIO)
                )
              }
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs block mb-1">Cols</label>
            <input
              type="number"
              value={cols}
              onChange={(e) =>
                resetGridDimensions(
                  Math.round(Math.max(1, parseInt(e.target.value)) / RATIO),
                  Math.max(1, parseInt(e.target.value))
                )
              }
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-2">Tools</h2>
        <div className="flex-grow grid grid-cols-2 gap-3 mb-6">
          {currentPaletteItems.map((item) => (
            <PaletteItem
              key={item.type}
              item={item}
              isSelected={selectedTool === item.type}
              onClick={() => {
                if (item.type === "road_menu") {
                  setPaletteMode("road");
                  setSelectedTool("select");
                } else if (item.type === "back") {
                  setPaletteMode("main");
                  setSelectedTool("select");
                } else setSelectedTool(item.type);
              }}
            />
          ))}
        </div>

        <button
          onClick={() => {
            setHistory((prev) => [
              ...prev.slice(0, step + 1),
              createEmptyGrid(rows, cols),
            ]);
            setStep((s) => s + 1);
          }}
          className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
        >
          🗑️ Clear Grid
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center p-4 overflow-auto bg-slate-200">
        <Grid
          grid={grid}
          rows={rows}
          cols={cols}
          onDrop={handleDrop}
          onPaint={handlePaint}
          setIsMouseDown={setIsMouseDown}
          onRightClick={handleRightClick}
        />
      </div>
    </div>
  );
}