import React, { useState, useEffect, useCallback } from "react";

// --- Constants ---
const TOTAL_GRID_WIDTH_PX = 19 * 64; // 1216px
const TOTAL_GRID_HEIGHT_PX = 12 * 64; // 768px

// The desired ratio: cols / rows = 1.5625 (or 25 / 16)
const RATIO = 1.5625;

// --- NEW: Main palette ---
const MAIN_PALETTE_ITEMS = [
  { type: "select", label: "Select", emoji: "👆" },
  { type: "road_menu", label: "Road", emoji: "🛣️" }, // --- MODIFIED: type is "road_menu"
  { type: "car", label: "Car", emoji: "🚗" },
  { type: "building", label: "Building", emoji: "🏢" },
  { type: "tree", label: "Tree", emoji: "🌳" },
  { type: "traffic_light", label: "Light", emoji: "🚦" },
  { type: "eraser", label: "Eraser", emoji: "🧼" },
];

// --- NEW: Road sub-palette ---
const ROAD_PALETTE_ITEMS = [
  { type: "road_straight", label: "Straight", emoji: "➖" },
  { type: "road_intersection", label: "Intersection", emoji: "➕" },
  { type: "back", label: "Back", emoji: "⬅️" },
];

// --- Helper Functions ---
const createEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array(cols).fill(null));

/**
 * Renders the content for a specific grid cell.
 */
const renderCellContent = (cellType, neighborInfo) => {
  // ---
  // 1. Handle all non-road items (render emoji)
  // ---
  // --- MODIFIED: Check for both road types ---
  if (cellType !== "road_intersection" && cellType !== "road_straight") {
    // --- MODIFIED: Search both palettes for the emoji ---
    const item =
      MAIN_PALETTE_ITEMS.find((p) => p.type === cellType) ||
      ROAD_PALETTE_ITEMS.find((p) => p.type === cellType);
    if (!item) return null;
    return (
      <span className="text-3xl" role="img" aria-label={item.label}>
        {item.emoji}
      </span>
    );
  }

  // ---
  // 2. Handle 'road' items (render SVG)
  // ---
  const hasRoad = neighborInfo;
  const strokeColor = "#4A5568"; // gray-700
  const strokeWidth = 80;
  const center = 50;
  const paths = [];

  // For readability
  const isUp = hasRoad.up;
  const isDown = hasRoad.down;
  const isLeft = hasRoad.left;
  const isRight = hasRoad.right;
  const neighborCount = isUp + isDown + isLeft + isRight;

  // --- NEW LOGIC FOR CURVES ---
  // (This logic will now only apply to "road_intersection"
  // because "road_straight" neighborInfo will never have a turn)

  // Case 1: 90-degree turns (and only 2 connections)
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

  // Case 2: Straights, T's, 4-ways, dead-ends
  // (This logic runs if a turn was not already added)
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

  // Case 3: No connections (dot)
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
    >
      {paths}
    </svg>
  );
};

// --- Grid Cell Component ---
const GridCell = React.memo(
  ({
    cellType,
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
      e.preventDefault(); // Allows dropping
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
        {cellType && renderCellContent(cellType, neighborInfo)}
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

  // --- NEW: Helper functions to check for specific road types ---
  const getIsIntersection = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return grid[r][c] === "road_intersection";
  };
  const getIsStraight = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return grid[r][c] === "road_straight";
  };
  const getIsAnyRoad = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return grid[r][c] === "road_intersection" || grid[r][c] === "road_straight";
  };
  // --- END NEW ---

  // --- NEW: Logic to find centerlines between cells ---
  const centerLines = [];
  const centerLineColor = "#FDE047"; // yellow-300
  const centerLineWidth = 4;
  const centerLineDash = "20 15";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // --- MODIFIED: Check for any road type ---
      if (!getIsAnyRoad(r, c)) continue;

      const cx = (c + 0.5) * cellWidth; // Center x of current cell
      const cy = (r + 0.5) * cellHeight; // Center y of current cell

      // Check RIGHT neighbor (for a HORIZONTAL line)
      // --- MODIFIED: Use getIsAnyRoad ---
      if (getIsAnyRoad(r, c + 1)) {
        centerLines.push({
          x1: cx,
          y1: cy,
          x2: (c + 1.5) * cellWidth, // Center x of RIGHT cell
          y2: cy,
          key: `h-${r}-${c}-right`,
        });
      }
      // Check BOTTOM neighbor (for a VERTICAL line)
      // --- MODIFIED: Use getIsAnyRoad ---
      if (getIsAnyRoad(r + 1, c)) {
        centerLines.push({
          x1: cx,
          y1: cy,
          x2: cx,
          y2: (r + 1.5) * cellHeight, // Center y of BOTTOM cell
          key: `v-${r}-${c}-down`,
        });
      }
      // By only checking right and down, we avoid drawing duplicate lines
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
      {/* 1. Render all the GridCells (with gray road bases) */}
      {grid.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const cellType = cell;
          let neighborInfo = null;

          // --- MODIFIED: New neighbor logic for different road types ---
          if (cellType === "road_intersection") {
            // Intersection roads connect to ANY adjacent road
            neighborInfo = {
              up: getIsAnyRoad(rowIndex - 1, colIndex),
              down: getIsAnyRoad(rowIndex + 1, colIndex),
              left: getIsAnyRoad(rowIndex, colIndex - 1),
              right: getIsAnyRoad(rowIndex, colIndex + 1),
            };
          } else if (cellType === "road_straight") {
            // Straight roads are more complex.
            // First, check if we are part of an existing straight line.
            const hasStraightH =
              getIsStraight(rowIndex, colIndex - 1) ||
              getIsStraight(rowIndex, colIndex + 1);
            const hasStraightV =
              getIsStraight(rowIndex - 1, colIndex) ||
              getIsStraight(rowIndex + 1, colIndex);

            if (hasStraightV) {
              // This cell is part of a VERTICAL straight road.
              // Only connect up/down (to ANY road).
              neighborInfo = {
                up: getIsAnyRoad(rowIndex - 1, colIndex),
                down: getIsAnyRoad(rowIndex + 1, colIndex),
                left: false,
                right: false,
              };
            } else if (hasStraightH) {
              // This cell is part of a HORIZONTAL straight road.
              // Only connect left/right (to ANY road).
              neighborInfo = {
                up: false,
                down: false,
                left: getIsAnyRoad(rowIndex, colIndex - 1),
                right: getIsAnyRoad(rowIndex, colIndex + 1),
              };
            } else {
              // This is an "orphan" straight road cell (or only next to intersections).
              // We'll default to a vertical line if possible, then horizontal, then a dot.
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
                // It's a dot
                neighborInfo = {
                  up: false,
                  down: false,
                  left: false,
                  right: false,
                };
              }
            }
          }
          // --- END MODIFIED ---

          return (
            <GridCell
              key={`${rowIndex}-${colIndex}`}
              cellType={cellType}
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

      {/* 2. Render the centerline overlay */}
      <svg
        width={TOTAL_GRID_WIDTH_PX}
        height={TOTAL_GRID_HEIGHT_PX}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none", // Allows clicks to pass through
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
      className={`w-full h-auto aspect-square border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
        isSelected
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

  // --- NEW: State to manage which palette is shown ---
  const [paletteMode, setPaletteMode] = useState("main");

  // Effect to reset the grid when dimensions change
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

  // Wrap updateGrid in useCallback
  const updateGrid = useCallback(
    (row, col, value) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((r) => [...r]);
        if (newGrid[row] && newGrid[row][col] !== undefined) {
          newGrid[row][col] = value;
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

  // Wrap event handlers in useCallback
  const handleDrop = useCallback(
    (row, col, itemType) => {
      // --- MODIFIED: Check for non-paintable types ---
      if (itemType === "eraser") {
        updateGrid(row, col, null);
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
      // --- MODIFIED: Check for non-paintable types ---
      if (
        !selectedTool ||
        selectedTool === "select" ||
        selectedTool === "back" ||
        selectedTool === "road_menu"
      ) {
        return;
      }

      if (selectedTool === "eraser") {
        updateGrid(row, col, null);
      } else {
        updateGrid(row, col, selectedTool);
      }
    },
    [selectedTool, updateGrid]
  );

  const handleRightClick = useCallback(
    (row, col) => {
      updateGrid(row, col, null);
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

  // Handlers for dimension inputs
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

  // --- NEW: Handle clicks on palette items ---
  const handlePaletteClick = (type) => {
    if (type === "road_menu") {
      setPaletteMode("road");
      setSelectedTool("select"); // Deselect any active tool
    } else if (type === "back") {
      setPaletteMode("main");
      setSelectedTool("select");
    } else {
      setSelectedTool(type);
    }
  };

  // --- NEW: Determine which palette to show ---
  const currentPaletteItems =
    paletteMode === "road" ? ROAD_PALETTE_ITEMS : MAIN_PALETTE_ITEMS;

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Left Sidebar: Palette */}
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

        <h2 className="text-lg font-semibold text-gray-700 mb-2">Palette</h2>
        <div className="flex-grow grid grid-cols-2 gap-3">
          {/* --- MODIFIED: Use currentPaletteItems and handlePaletteClick --- */}
          {currentPaletteItems.map((item) => (
            <PaletteItem
              key={item.type}
              item={item}
              isSelected={selectedTool === item.type}
              onClick={() => handlePaletteClick(item.type)}
            />
          ))}
        </div>

        {/* Undo/Redo Buttons */}
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

        {/* Clear Button */}
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
