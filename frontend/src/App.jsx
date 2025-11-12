import React, { useState, useEffect, useCallback } from "react";

// --- Constants ---
const TOTAL_GRID_WIDTH_PX = 19 * 64; // 1216px
const TOTAL_GRID_HEIGHT_PX = 12 * 64; // 768px
const RATIO = 1.5625;

// --- Main palette ---
const MAIN_PALETTE_ITEMS = [
  { type: "select", label: "Select", emoji: "👆" },
  { type: "road_menu", label: "Road", emoji: "🛣️" },
  { type: "car", label: "Car", emoji: "🚗" },
  { type: "building", label: "Building", emoji: "🏢" },
  { type: "tree", label: "Tree", emoji: "🌳" },
  { type: "traffic_light", label: "Light", emoji: "🚦" },
  { type: "eraser", label: "Eraser", emoji: "🧼" },
];

// --- Road sub-palette ---
const ROAD_PALETTE_ITEMS = [
  { type: "road_straight", label: "Straight", emoji: "➖" },
  { type: "road_intersection", label: "Intersection", emoji: "➕" },
  { type: "back", label: "Back", emoji: "⬅️" },
];

// --- Helper Functions ---
// Each cell is now { road: null, decoration: null }
const createEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ road: null, decoration: null }))
  );

// --- Render cell content ---
const renderCellContent = (cell, neighborInfo) => {
  const roadType = cell.road;
  const decorationType = cell.decoration;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Render road layer first */}
      {roadType && renderRoadSVG(roadType, neighborInfo)}
      {/* Render decoration layer on top, if any */}
      {decorationType && renderDecoration(decorationType)}
    </div>
  );
};

// --- Road SVG helper ---
const renderRoadSVG = (roadType, neighborInfo) => {
  // ---- All your existing SVG logic ----
  const strokeColor = "#4A5568";
  const strokeWidth = 80;
  const center = 50;
  const paths = [];

  if (!neighborInfo) return null;

  const isUp = neighborInfo.up;
  const isDown = neighborInfo.down;
  const isLeft = neighborInfo.left;
  const isRight = neighborInfo.right;
  const neighborCount = isUp + isDown + isLeft + isRight;

  // Intersection logic
  if (roadType === "road_intersection") {
    if (neighborCount === 2) {
      if (isUp && isRight) {
        paths.push(
          <polyline
            key="ur"
            points="101,50 50,50 50,-1"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        );
      } else if (isUp && isLeft) {
        paths.push(
          <polyline
            key="ul"
            points="-1,50 50,50 50,-1"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        );
      } else if (isDown && isRight) {
        paths.push(
          <polyline
            key="dr"
            points="101,50 50,50 50,101"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        );
      } else if (isDown && isLeft) {
        paths.push(
          <polyline
            key="dl"
            points="-1,50 50,50 50,101"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        );
      }
    }
    if (paths.length === 0) {
      if (isUp) {
        paths.push(
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
      }
      if (isDown) {
        paths.push(
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
      }
      if (isLeft) {
        paths.push(
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
      }
      if (isRight) {
        paths.push(
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
      }
    }
    if (neighborCount === 0) {
      paths.push(
        <circle
          key="dot"
          cx={center}
          cy={center}
          r={strokeWidth / 2}
          fill={strokeColor}
        />
      );
    }
    return (
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
      >
        {paths}
      </svg>
    );
  }

  // Straight road logic
  if (roadType === "road_straight") {
    // Use only up/down OR left/right, or a dot if isolated
    if (neighborInfo.up || neighborInfo.down) {
      paths.push(
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
      paths.push(
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
    } else if (neighborInfo.left || neighborInfo.right) {
      paths.push(
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
      paths.push(
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
    } else {
      paths.push(
        <circle
          key="dot"
          cx={center}
          cy={center}
          r={strokeWidth / 2}
          fill={strokeColor}
        />
      );
    }
    return (
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
      >
        {paths}
      </svg>
    );
  }
  return null;
};

const renderDecoration = (type) => {
  const item =
    MAIN_PALETTE_ITEMS.find((p) => p.type === type) ||
    ROAD_PALETTE_ITEMS.find((p) => p.type === type);
  if (!item) return null;
  return (
    <span
      className="text-3xl"
      role="img"
      aria-label={item.label}
      style={{
        position: "absolute",
        zIndex: 2, // On top of roads
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {item.emoji}
    </span>
  );
};

// --- Grid Cell Component ---
const GridCell = React.memo(
  ({
    cell,
    row,
    col,
    onDrop,
    onPaint,
    onRightClick,
    cellWidth,
    cellHeight,
    neighborInfo,
  }) => {
    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const droppedType = e.dataTransfer.getData("itemType");
      onDrop(row, col, droppedType);
    };

    const handleMouseEnter = (e) => {
      if (e.buttons === 1) {
        onPaint(row, col);
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        onPaint(row, col);
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      onRightClick(row, col);
    };

    const cellStyle = {
      position: "absolute",
      left: `${col * cellWidth}px`,
      top: `${row * cellHeight}px`,
      width: `${cellWidth}px`,
      height: `${cellHeight}px`,
    };

    return (
      <div
        style={cellStyle}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onContextMenu={handleContextMenu}
        className="bg-transparent flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
      >
        {renderCellContent(cell, neighborInfo)}
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
  isMouseDown,
  setIsMouseDown,
  onRightClick,
}) => {
  const cellWidth = TOTAL_GRID_WIDTH_PX / cols;
  const cellHeight = TOTAL_GRID_HEIGHT_PX / rows;

  // Check road types
  const getIsIntersection = (r, c) =>
    grid[r] &&
    grid[r][c] &&
    grid[r][c].road === "road_intersection";
  const getIsStraight = (r, c) =>
    grid[r] &&
    grid[r][c] &&
    grid[r][c].road === "road_straight";
  const getIsAnyRoad = (r, c) =>
    grid[r] &&
    grid[r][c] &&
    (grid[r][c].road === "road_intersection" ||
      grid[r][c].road === "road_straight");

  // centerlines (unchanged)
  const centerLines = [];
  const centerLineColor = "#FDE047";
  const centerLineWidth = 4;
  const centerLineDash = "20 15";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!getIsAnyRoad(r, c)) continue;

      const cx = (c + 0.5) * cellWidth;
      const cy = (r + 0.5) * cellHeight;

      if (getIsAnyRoad(r, c + 1)) {
        centerLines.push({
          x1: cx,
          y1: cy,
          x2: (c + 1.5) * cellWidth,
          y2: cy,
          key: `h-${r}-${c}-right`,
        });
      }
      if (getIsAnyRoad(r + 1, c)) {
        centerLines.push({
          x1: cx,
          y1: cy,
          x2: cx,
          y2: (r + 1.5) * cellHeight,
          key: `v-${r}-${c}-down`,
        });
      }
    }
  }

  return (
    <div
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
      className="relative bg-white"
      style={{
        userSelect: "none",
        width: `${TOTAL_GRID_WIDTH_PX}px`,
        height: `${TOTAL_GRID_HEIGHT_PX}px`,
      }}
    >
      {/* GridCells */}
      {grid.flatMap((rowCells, rowIndex) =>
        rowCells.map((cell, colIndex) => {
          let neighborInfo = null;

          if (cell.road === "road_intersection") {
            neighborInfo = {
              up: getIsAnyRoad(rowIndex - 1, colIndex),
              down: getIsAnyRoad(rowIndex + 1, colIndex),
              left: getIsAnyRoad(rowIndex, colIndex - 1),
              right: getIsAnyRoad(rowIndex, colIndex + 1),
            };
          } else if (cell.road === "road_straight") {
            const hasStraightH =
              getIsStraight(rowIndex, colIndex - 1) ||
              getIsStraight(rowIndex, colIndex + 1);
            const hasStraightV =
              getIsStraight(rowIndex - 1, colIndex) ||
              getIsStraight(rowIndex + 1, colIndex);

            if (hasStraightV) {
              neighborInfo = {
                up: getIsAnyRoad(rowIndex - 1, colIndex),
                down: getIsAnyRoad(rowIndex + 1, colIndex),
                left: false,
                right: false,
              };
            } else if (hasStraightH) {
              neighborInfo = {
                up: false,
                down: false,
                left: getIsAnyRoad(rowIndex, colIndex - 1),
                right: getIsAnyRoad(rowIndex, colIndex + 1),
              };
            } else {
              const n_up = getIsAnyRoad(rowIndex - 1, colIndex);
              const n_down = getIsAnyRoad(rowIndex + 1, colIndex);
              const n_left = getIsAnyRoad(rowIndex, colIndex - 1);
              const n_right = getIsAnyRoad(rowIndex, colIndex + 1);

              if (n_up || n_down) {
                neighborInfo = {
                  up: n_up,
                  down: n_down,
                  left: false,
                  right: false,
                };
              } else if (n_left || n_right) {
                neighborInfo = {
                  up: false,
                  down: false,
                  left: n_left,
                  right: n_right,
                };
              } else {
                neighborInfo = {
                  up: false,
                  down: false,
                  left: false,
                  right: false,
                };
              }
            }
          }

          return (
            <GridCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
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

      {/* Centerline overlay */}
      <svg
        width={TOTAL_GRID_WIDTH_PX}
        height={TOTAL_GRID_HEIGHT_PX}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {centerLines.map((line) => (
          <line
            {...line}
            stroke={centerLineColor}
            strokeWidth={centerLineWidth}
            strokeDasharray={centerLineDash}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
};

// --- Palette Item Component ---
const PaletteItem = ({ item, isSelected, onClick }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("itemType", item.type);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`w-full h-auto aspect-square border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${isSelected
          ? "border-blue-500 bg-blue-50 shadow-lg"
          : "border-gray-300 bg-white hover:border-blue-300"
        }`}
    >
      <span className="text-3xl" role="img" aria-label={item.label}>
        {item.emoji}
      </span>
      <span className="text-xs text-gray-600 mt-1">{item.label}</span>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(25);

  const [grid, setGrid] = useState(() => createEmptyGrid(rows, cols));
  const [selectedTool, setSelectedTool] = useState("select");
  const [isMouseDown, setIsMouseDown] = useState(false);

  const [history, setHistory] = useState(() => [createEmptyGrid(rows, cols)]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // State for palette switching
  const [paletteMode, setPaletteMode] = useState("main");

  // Reset grid when dimensions change
  useEffect(() => {
    const numRows = Number(rows);
    const numCols = Number(cols);

    if (numRows > 0 && numCols > 0) {
      const newGrid = createEmptyGrid(numRows, numCols);
      setGrid(newGrid);
      setHistory([newGrid]);
      setHistoryIndex(0);
    }
  }, [rows, cols]);

  // --- Layered grid logic for stackable items ---
  const updateGrid = useCallback(
    (row, col, value) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((r) => r.map((cell) => ({ ...cell })));

        if (["road_straight", "road_intersection"].includes(value)) {
          newGrid[row][col].road = value;
        } else if (
          ["car", "traffic_light", "building", "tree"].includes(value)
        ) {
          newGrid[row][col].decoration = value;
        } else if (value === "eraser") {
          newGrid[row][col] = { road: null, decoration: null };
        }

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newGrid);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        return newGrid;
      });
    },
    [history, historyIndex]
  );

  // Event handlers
  const handleDrop = useCallback(
    (row, col, itemType) => {
      if (itemType === "eraser") {
        updateGrid(row, col, "eraser");
      } else if (
        itemType &&
        itemType !== "select" &&
        itemType !== "back" &&
        itemType !== "road_menu"
      ) {
        updateGrid(row, col, itemType);
      }
    },
    [updateGrid]
  );

  const handlePaint = useCallback(
    (row, col) => {
      if (
        !selectedTool ||
        selectedTool === "select" ||
        selectedTool === "back" ||
        selectedTool === "road_menu"
      ) {
        return;
      }
      if (selectedTool === "eraser") {
        updateGrid(row, col, "eraser");
      } else {
        updateGrid(row, col, selectedTool);
      }
    },
    [selectedTool, updateGrid]
  );

  const handleRightClick = useCallback(
    (row, col) => {
      updateGrid(row, col, "eraser");
    },
    [updateGrid]
  );

  const handleClearGrid = () => {
    const emptyGrid = createEmptyGrid(rows, cols);
    setGrid(emptyGrid);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(emptyGrid);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGrid(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGrid(history[historyIndex + 1]);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Dimension input handlers
  const handleRowsChange = (e) => {
    const newRows = Math.max(1, parseInt(e.target.value, 10));
    if (!isNaN(newRows)) {
      const newCols = Math.round(newRows * RATIO);
      setRows(newRows);
      setCols(newCols);
    }
  };

  const handleColsChange = (e) => {
    const newCols = Math.max(1, parseInt(e.target.value, 10));
    if (!isNaN(newCols)) {
      const newRows = Math.round(newCols / RATIO);
      setRows(newRows);
      setCols(newCols);
    }
  };

  // Palette change handler
  const handlePaletteClick = (type) => {
    if (type === "road_menu") {
      setPaletteMode("road");
      setSelectedTool("select");
    } else if (type === "back") {
      setPaletteMode("main");
      setSelectedTool("select");
    } else {
      setSelectedTool(type);
    }
  };

  const currentPaletteItems =
    paletteMode === "road" ? ROAD_PALETTE_ITEMS : MAIN_PALETTE_ITEMS;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">City Builder</h1>

        {/* Dimension Inputs */}
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Dimensions</h2>
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label htmlFor="rows" className="text-sm font-medium text-gray-600">
              Rows
            </label>
            <input
              type="number"
              id="rows"
              value={rows}
              onChange={handleRowsChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="cols" className="text-sm font-medium text-gray-600">
              Cols
            </label>
            <input
              type="number"
              id="cols"
              value={cols}
              onChange={handleColsChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
            />
          </div>
        </div>

        {/* Palette */}
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Palette</h2>
        <div className="flex-grow grid grid-cols-2 gap-3">
          {currentPaletteItems.map((item) => (
            <PaletteItem
              key={item.type}
              item={item}
              isSelected={selectedTool === item.type}
              onClick={() => handlePaletteClick(item.type)}
            />
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↷ Redo
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={handleClearGrid}
          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors"
        >
          Clear Grid
        </button>
      </div>

      {/* Grid */}
      <div className="flex-grow flex items-center justify-center p-4 md:p-8 overflow-auto">
        <Grid
          grid={grid}
          rows={rows}
          cols={cols}
          onDrop={handleDrop}
          onPaint={handlePaint}
          isMouseDown={isMouseDown}
          setIsMouseDown={setIsMouseDown}
          onRightClick={handleRightClick}
        />
      </div>
    </div>
  );
}
