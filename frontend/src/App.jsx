import React, { useState, useEffect, useCallback, useMemo } from "react";

// --- Constants ---
const TOTAL_GRID_WIDTH_PX = 19 * 64;
const TOTAL_GRID_HEIGHT_PX = 12 * 64;
const API_BASE_URL = "http://localhost:8000/api";

// --- Icons ---
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);
const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const UndoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);
const RedoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const SaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);
const LoadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

// --- Palettes ---
const MAIN_PALETTE_ITEMS = [
  {
    type: "select",
    label: "Select",
    emoji: "👆",
    color: "from-blue-500 to-cyan-400",
  },
  {
    type: "road_menu",
    label: "Roads",
    emoji: "🛣️",
    color: "from-slate-500 to-slate-400",
  },
  {
    type: "car",
    label: "Car",
    emoji: "🚗",
    color: "from-red-500 to-orange-400",
  },
  {
    type: "building",
    label: "Building",
    emoji: "🏢",
    color: "from-indigo-500 to-purple-500",
  },
  {
    type: "tree",
    label: "Tree",
    emoji: "🌳",
    color: "from-green-500 to-emerald-400",
  },
  {
    type: "traffic_light",
    label: "Signal",
    emoji: "🚦",
    color: "from-yellow-400 to-orange-500",
  },
  {
    type: "eraser",
    label: "Clear",
    emoji: "🧼",
    color: "from-pink-500 to-rose-400",
  },
];

const ROAD_PALETTE_ITEMS = [
  {
    type: "road_straight_vertical",
    label: "Vertical",
    emoji: "⬆️",
    color: "from-gray-500 to-gray-400",
  },
  {
    type: "road_straight_horizontal",
    label: "Horizontal",
    emoji: "➡️",
    color: "from-gray-500 to-gray-400",
  },
  {
    type: "road_intersection",
    label: "Intersect",
    emoji: "➕",
    color: "from-gray-600 to-gray-500",
  },
  {
    type: "back",
    label: "Back",
    emoji: "↩️",
    color: "from-slate-600 to-slate-500",
  },
];

// --- Helper Functions ---
const createEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array(cols).fill(null));

// --- Renderers ---
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

const renderTrafficLight = (lightState) => {
  const colors = {
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
    off: "#374151",
  };
  const currentState = lightState || "green";

  return (
    <g transform="translate(25, 10)">
      <rect
        x="0"
        y="0"
        width="50"
        height="80"
        rx="10"
        fill="#1f2937"
        stroke="#4b5563"
        strokeWidth="2"
      />
      <circle
        cx="25"
        cy="20"
        r="8"
        fill={currentState === "red" ? colors.red : colors.off}
      />
      <circle
        cx="25"
        cy="40"
        r="8"
        fill={currentState === "yellow" ? colors.yellow : colors.off}
      />
      <circle
        cx="25"
        cy="60"
        r="8"
        fill={currentState === "green" ? colors.green : colors.off}
      />
    </g>
  );
};

const renderCellContent = (cellData, neighborInfo) => {
  const cellType = cellData?.type;
  const carDirection = cellData?.hasCar;
  const content = [];

  if (cellType) {
    if (cellType === "traffic_light") {
      content.push(
        <React.Fragment key="light">
          {renderTrafficLight(cellData.state)}
        </React.Fragment>
      );
    } else if (!cellType.startsWith("road_")) {
      const item =
        MAIN_PALETTE_ITEMS.find((p) => p.type === cellType) ||
        ROAD_PALETTE_ITEMS.find((p) => p.type === cellType);
      if (item) {
        content.push(
          <foreignObject key="base" x="0" y="0" width="100" height="100">
            <div className="w-full h-full flex items-center justify-center text-4xl drop-shadow-md">
              {item.emoji}
            </div>
          </foreignObject>
        );
      }
    } else {
      const strokeColor = "#334155";
      const strokeWidth = 80;
      const center = 50;
      if (cellType === "road_intersection") {
        const { up, down, left, right } = neighborInfo;
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
            />
          );
        if (!(up || down || left || right))
          content.push(
            <circle
              key="dot"
              cx={center}
              cy={center}
              r={strokeWidth / 2}
              fill={strokeColor}
            />
          );
        else
          content.push(
            <rect
              key="center"
              x={center - strokeWidth / 2}
              y={center - strokeWidth / 2}
              width={strokeWidth}
              height={strokeWidth}
              fill={strokeColor}
            />
          );
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
          />
        );
      }
    }
  }

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

// --- Grid Cell ---
const GridCell = React.memo(
  ({
    cellData,
    row,
    col,
    onDrop,
    onPaint,
    cellWidth,
    cellHeight,
    neighborInfo,
    isSelected,
  }) => {
    const handleDrop = (e) => {
      e.preventDefault();
      onDrop(row, col, e.dataTransfer.getData("itemType"));
    };
    const handleMouseDown = (e) => {
      if (e.button === 0) onPaint(row, col);
    };
    const handleMouseEnter = (e) => {
      if (e.buttons === 1) onPaint(row, col);
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
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
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onContextMenu={handleContextMenu}
        className={`flex items-center justify-center cursor-pointer transition-colors duration-75 ${
          isSelected
            ? "ring-2 ring-yellow-400 bg-white/10 z-10"
            : "hover:bg-white/5"
        }`}
      >
        {renderCellContent(cellData, neighborInfo)}
      </div>
    );
  }
);

// --- Grid ---
const Grid = ({
  grid,
  rows,
  cols,
  onDrop,
  onPaint,
  setIsMouseDown,
  onRightClick,
  selectedCell,
}) => {
  const cellWidth = TOTAL_GRID_WIDTH_PX / cols;
  const cellHeight = TOTAL_GRID_HEIGHT_PX / rows;

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
    getIsVerticalRoad(r, c) ||
    getIsHorizontalRoad(r, c) ||
    getIsIntersection(r, c);

  const centerLines = useMemo(() => {
    const lines = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!getIsAnyRoad(r, c)) continue;
        const cx = (c + 0.5) * cellWidth;
        const cy = (r + 0.5) * cellHeight;
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
              x2: cx - cellWidth,
              y2: cy,
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
      className="relative bg-slate-100/50 shadow-2xl rounded-sm overflow-hidden"
      style={{
        userSelect: "none",
        width: `${TOTAL_GRID_WIDTH_PX}px`,
        height: `${TOTAL_GRID_HEIGHT_PX}px`,
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: `${cellWidth}px ${cellHeight}px`,
      }}
    >
      {grid.flatMap((row, rowIndex) =>
        row.map((cellData, colIndex) => {
          const cellType = cellData?.type || null;
          let neighborInfo = {
            up: false,
            down: false,
            left: false,
            right: false,
          };
          if (cellType === "road_intersection") {
            neighborInfo = {
              up:
                getIsVerticalRoad(rowIndex - 1, colIndex) ||
                getIsIntersection(rowIndex - 1, colIndex),
              down:
                getIsVerticalRoad(rowIndex + 1, colIndex) ||
                getIsIntersection(rowIndex + 1, colIndex),
              left:
                getIsHorizontalRoad(rowIndex, colIndex - 1) ||
                getIsIntersection(rowIndex, colIndex - 1),
              right:
                getIsHorizontalRoad(rowIndex, colIndex + 1) ||
                getIsIntersection(rowIndex, colIndex + 1),
            };
          } else if (cellType === "road_straight_vertical") {
            neighborInfo = {
              up:
                getIsVerticalRoad(rowIndex - 1, colIndex) ||
                getIsIntersection(rowIndex - 1, colIndex),
              down:
                getIsVerticalRoad(rowIndex + 1, colIndex) ||
                getIsIntersection(rowIndex + 1, colIndex),
              left: false,
              right: false,
            };
          } else if (cellType === "road_straight_horizontal") {
            neighborInfo = {
              up: false,
              down: false,
              left:
                getIsHorizontalRoad(rowIndex, colIndex - 1) ||
                getIsIntersection(rowIndex, colIndex - 1),
              right:
                getIsHorizontalRoad(rowIndex, colIndex + 1) ||
                getIsIntersection(rowIndex, colIndex + 1),
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
              isSelected={
                selectedCell &&
                selectedCell.row === rowIndex &&
                selectedCell.col === colIndex
              }
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
            strokeWidth="2"
            strokeDasharray="10 10"
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
      className={`relative group aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
        isSelected
          ? "bg-slate-700 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20"
          : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
      }`}
    >
      <div
        className={`absolute inset-2 rounded-xl opacity-20 bg-gradient-to-br ${item.color}`}
      ></div>
      <span className="text-3xl z-10 drop-shadow-sm filter">{item.emoji}</span>
      <span className="text-[10px] font-medium text-slate-400 mt-2 z-10 uppercase tracking-wide group-hover:text-slate-200 transition-colors">
        {item.label}
      </span>
    </div>
  );
};

// --- Save/Load Modal ---
const SaveLoadModal = ({ mode, onClose, grid, rows, cols, onLoadLayout }) => {
  const [saveName, setSaveName] = useState("");
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (mode === "load") fetchLayouts();
  }, [mode]);

  const fetchLayouts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/layouts/`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];
        setLayouts(results);
      } else {
        setMessage("Failed to fetch layouts. Is backend running?");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error connecting to server.");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/layouts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName,
          description: "",
          rows,
          cols,
          grid_data: grid,
        }),
      });
      if (response.ok) {
        onClose();
        alert("Saved successfully!");
      } else setMessage("Save failed.");
    } catch (e) {
      setMessage("Error saving.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this layout?")) return;
    try {
      await fetch(`${API_BASE_URL}/layouts/${id}/`, { method: "DELETE" });
      setLayouts((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setMessage("Delete failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {mode === "save" ? (
              <>
                <SaveIcon /> Save Layout
              </>
            ) : (
              <>
                <LoadIcon /> Load Layout
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {message && (
            <div className="mb-4 p-2 bg-red-900/30 border border-red-500/30 text-red-300 rounded text-sm text-center">
              {message}
            </div>
          )}

          {mode === "save" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Layout Name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My Awesome City"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
              >
                Save Layout
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-slate-500 py-4">
                  Loading...
                </div>
              ) : layouts.length === 0 ? (
                <div className="text-center text-slate-500 py-4">
                  No saved layouts found.
                </div>
              ) : (
                layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="group flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-slate-750 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 truncate">
                        {layout.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(layout.created_at).toLocaleDateString()} •{" "}
                        {layout.rows}x{layout.cols}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          onLoadLayout(
                            layout.grid_data,
                            layout.rows,
                            layout.cols
                          );
                          onClose();
                        }}
                        className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors"
                        title="Load"
                      >
                        <LoadIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(layout.id)}
                        className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'save' | 'load' | null

  const getCell = (g, r, c) => {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return null;
    return g[r][c];
  };

  // --- Simulation Tick ---
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
            let cell = newGrid[r][c];
            if (!cell) continue;

            // 1. Update Traffic Light Logic
            if (cell.type === "traffic_light") {
              if (!cell.config) cell.config = { green: 10, yellow: 4, red: 10 };
              if (!cell.state) cell.state = "green";
              if (cell.timer === undefined) cell.timer = 0;

              cell.timer += 1;
              const limit = cell.config[cell.state];

              if (cell.timer >= limit) {
                cell.timer = 0;
                if (cell.state === "green") cell.state = "yellow";
                else if (cell.state === "yellow") cell.state = "red";
                else if (cell.state === "red") cell.state = "green";
              }
            }

            // 2. Car Logic
            if (cell.hasCar && !movedCars.has(`${r},${c}`)) {
              const direction = cell.hasCar;
              let nextR = r,
                nextC = c,
                nextDir = direction;
              if (direction === "up") nextR--;
              if (direction === "down") nextR++;
              if (direction === "left") nextC--;
              if (direction === "right") nextC++;

              const targetCell = getCell(newGrid, nextR, nextC);
              let canMove = false;

              if (targetCell && targetCell.type === "traffic_light") {
                const lightState = targetCell.state || "green";
                if (lightState === "green") canMove = true;
                else canMove = false;
              } else if (
                targetCell &&
                targetCell.type.startsWith("road") &&
                !targetCell.hasCar
              ) {
                canMove = true;
              } else {
                const possibleTurns = [];
                const checkTurn = (dr, dc, dir) => {
                  const t = getCell(newGrid, r + dr, c + dc);
                  if (t && t.type.startsWith("road") && !t.hasCar)
                    possibleTurns.push(dir);
                };
                if (direction === "up" || direction === "down") {
                  checkTurn(0, -1, "left");
                  checkTurn(0, 1, "right");
                } else {
                  checkTurn(-1, 0, "up");
                  checkTurn(1, 0, "down");
                }
                if (possibleTurns.length > 0) {
                  nextDir =
                    possibleTurns[
                      Math.floor(Math.random() * possibleTurns.length)
                    ];
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
                cell.hasCar = false;
                if (!cell.type) newGrid[r][c] = null;
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
                cell.hasCar = nextDir;
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

  const updateGrid = useCallback(
    (row, col, newItemOrType) => {
      setHistory((prev) => {
        const current = prev[step];
        const newGrid = current.map((r) =>
          r.map((cell) => (cell ? { ...cell } : null))
        );
        let updatedCell = newGrid[row][col] || { type: null, hasCar: false };

        if (selectedTool === "select") return prev;

        if (newItemOrType === "eraser") {
          updatedCell = null;
        } else if (newItemOrType === "car") {
          updatedCell.hasCar = "right";
        } else {
          updatedCell.type = newItemOrType;
          if (newItemOrType === "traffic_light") {
            updatedCell.state = "green";
            updatedCell.timer = 0;
            updatedCell.config = { green: 10, yellow: 4, red: 10 };
          }
        }
        newGrid[row][col] = updatedCell;
        return [...prev.slice(0, step + 1), newGrid];
      });
      setStep((s) => s + 1);
    },
    [step, selectedTool]
  );

  const updateTrafficLightConfig = (row, col, key, value) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      if (newGrid[row][col] && newGrid[row][col].type === "traffic_light") {
        newGrid[row][col].config = {
          ...newGrid[row][col].config,
          [key]: parseInt(value),
        };
        if (!newGrid[row][col].config)
          newGrid[row][col].config = {
            green: 10,
            yellow: 4,
            red: 10,
            [key]: parseInt(value),
          };
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
  const selectedCellData = selectedCell
    ? grid[selectedCell.row] && grid[selectedCell.row][selectedCell.col]
    : null;

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
      {/* --- Modal Overlay --- */}
      {activeModal && (
        <SaveLoadModal
          mode={activeModal}
          onClose={() => setActiveModal(null)}
          grid={grid}
          rows={rows}
          cols={cols}
          onLoadLayout={handleLoadLayout}
        />
      )}

      {/* Sidebar Toggle */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`p-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 hover:bg-slate-700 transition-all ${
            isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
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

      {/* Sidebar - FIXED LAYOUT: Now using flex-shrink-0 and width animation */}
      <div
        className={`flex-shrink-0 h-full bg-slate-900/95 backdrop-blur-md shadow-2xl z-40 overflow-hidden transition-[width] duration-300 ease-in-out border-r border-slate-800 flex flex-col ${
          isSidebarOpen ? "w-80" : "w-0 border-none"
        }`}
      >
        {/* Inner Container: Fixed width to prevent content squishing during animation */}
        <div className="w-80 h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg shadow-lg shadow-blue-500/30">
                🏗️
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                CityBuilder<span className="text-blue-400 font-light">Pro</span>
              </h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <XIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Properties Panel */}
            {selectedCell &&
            selectedCellData &&
            selectedCellData.type === "traffic_light" ? (
              <div className="mb-6 p-4 bg-slate-800 rounded-xl border-l-4 border-blue-500 shadow-md animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    🚦 Signal Config
                  </h2>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    Position: {selectedCell.row}, {selectedCell.col}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-green-400 block mb-1">
                        Green
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={selectedCellData.config?.green || 10}
                        onChange={(e) =>
                          updateTrafficLightConfig(
                            selectedCell.row,
                            selectedCell.col,
                            "green",
                            e.target.value
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-xs text-center text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-yellow-400 block mb-1">
                        Yellow
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={selectedCellData.config?.yellow || 4}
                        onChange={(e) =>
                          updateTrafficLightConfig(
                            selectedCell.row,
                            selectedCell.col,
                            "yellow",
                            e.target.value
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-xs text-center text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-red-400 block mb-1">
                        Red
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={selectedCellData.config?.red || 10}
                        onChange={(e) =>
                          updateTrafficLightConfig(
                            selectedCell.row,
                            selectedCell.col,
                            "red",
                            e.target.value
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-xs text-center text-white"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      Current State:
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        selectedCellData.state === "green"
                          ? "bg-green-900 text-green-400"
                          : selectedCellData.state === "yellow"
                          ? "bg-yellow-900 text-yellow-400"
                          : "bg-red-900 text-red-400"
                      }`}
                    >
                      {(selectedCellData.state || "GREEN").toUpperCase()} (
                      {selectedCellData.timer || 0})
                    </span>
                  </div>
                </div>
              </div>
            ) : selectedCell ? (
              <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-500 uppercase">
                    Selected Cell
                  </h2>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {selectedCellData ? (
                    <>
                      Type:{" "}
                      <span className="text-blue-400 font-mono">
                        {selectedCellData.type}
                      </span>
                      {selectedCellData.hasCar && (
                        <div className="mt-1 text-xs text-orange-400">
                          Contains Car
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-500 italic">Empty Cell</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 border border-dashed border-slate-700 rounded-xl text-center">
                <p className="text-xs text-slate-500">
                  Select a Traffic Light with{" "}
                  <span className="text-lg">👆</span> to edit its timing.
                </p>
              </div>
            )}

            {/* Tools Palette */}
            <div className="mb-8">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                Tools & Objects
              </h2>
              <div className="grid grid-cols-3 gap-3">
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
                      } else {
                        setSelectedTool(item.type);
                      }
                      if (item.type !== "select") setSelectedCell(null);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stage - FLEX GROW: Automatically fills remaining space */}
      <div className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col min-w-0">
        {/* Floating Controls Toolbar - Bottom Right */}
        <div className="absolute bottom-8 right-8 z-50 flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-30"
            title="Undo"
          >
            <UndoIcon />
          </button>
          <button
            onClick={() => setStep((s) => Math.min(history.length - 1, s + 1))}
            disabled={step === history.length - 1}
            className="p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-30"
            title="Redo"
          >
            <RedoIcon />
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1"></div>

          <button
            onClick={() => setActiveModal("save")}
            className="p-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-xl transition-colors"
            title="Save Layout"
          >
            <SaveIcon />
          </button>
          <button
            onClick={() => setActiveModal("load")}
            className="p-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-colors"
            title="Load Layout"
          >
            <LoadIcon />
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1"></div>

          <button
            onClick={() => {
              if (confirm("Clear entire grid? This cannot be undone.")) {
                setHistory((prev) => [...prev, createEmptyGrid(rows, cols)]);
                setStep((s) => s + 1);
              }
            }}
            className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-colors"
            title="Clear Grid"
          >
            <TrashIcon />
          </button>
        </div>

        {/* Top Controls */}
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="flex items-center gap-4 px-6 py-3 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 shadow-2xl pointer-events-auto">
            <div className="hidden md:block mr-4 pr-4 border-r border-slate-700 text-xs text-slate-400">
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
              className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-600"
              disabled={prePlayStep === null}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <Grid
            grid={grid}
            rows={rows}
            cols={cols}
            onDrop={(r, c, t) => updateGrid(r, c, t)}
            onPaint={(r, c) => handleCellAction(r, c)}
            setIsMouseDown={setIsMouseDown}
            onRightClick={(r, c) => updateGrid(r, c, "eraser")}
            selectedCell={selectedCell}
          />
        </div>
      </div>
    </div>
  );
}
