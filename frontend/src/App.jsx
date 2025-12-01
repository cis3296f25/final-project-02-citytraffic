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
// X Icon
const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
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
const BackArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
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
    type: "decoration_menu",
    label: "Decor",
    emoji: "🌳",
    color: "from-green-500 to-emerald-400",
  },
  {
    type: "car",
    label: "Car",
    emoji: "🚗",
    color: "from-red-500 to-orange-400",
  },
  {
    type: "traffic_light",
    label: "Signal",
    emoji: "🚦",
    color: "from-yellow-400 to-orange-500",
  },
  {
    type: "eraser",
    label: "Eraser",
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
  // --- NEW MULTI-LANE ROADS ---
  {
    type: "road_multilane_vertical",
    label: "2-Lane Vert",
    emoji: "║",
    color: "from-slate-600 to-slate-500",
  },
  {
    type: "road_multilane_horizontal",
    label: "2-Lane Horz",
    emoji: "═",
    color: "from-slate-600 to-slate-500",
  },
];

const DECORATION_PALETTE_ITEMS = [
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

const renderDirectionArrow = (direction) => {
  let content = null;
  let rot = 0;

  // Straight Arrows
  if (
    direction === "up" ||
    direction === "down" ||
    direction === "left" ||
    direction === "right"
  ) {
    if (direction === "right") rot = 90;
    else if (direction === "down") rot = 180;
    else if (direction === "left") rot = 270;
    content = (
      <>
        <path d="M0 -15 L10 5 L-10 5 Z" fill="white" />
        <rect x="-4" y="5" width="8" height="15" fill="white" />
      </>
    );
  }
  // Curved Arrows (L-Shapes)
  else if (direction && direction.startsWith("turn_")) {
    const parts = direction.split("_"); // [turn, entry, exit]
    const entry = parts[1];
    const exit = parts[2];

    let pathD = "";
    let headD = "";

    // Drawing paths relative to center (0,0) with translate(50,50)
    // Standard "Up-Right" turn (from bottom to right)
    if (entry === "up" && exit === "right") {
      pathD = "M 0 35 Q 0 0 35 0";
      headD = "M 35 0 L 25 -5 L 25 5 Z";
      rot = 0;
    } else if (entry === "left" && exit === "up") {
      pathD = "M -35 0 Q 0 0 0 -35";
      headD = "M 0 -35 L -5 -25 L 5 -25 Z";
      rot = 0;
    } else if (entry === "down" && exit === "left") {
      pathD = "M 0 -35 Q 0 0 -35 0";
      headD = "M -35 0 L -25 -5 L -25 5 Z";
      rot = 0;
    } else if (entry === "right" && exit === "down") {
      pathD = "M 35 0 Q 0 0 0 35";
      headD = "M 0 35 L -5 25 L 5 25 Z";
      rot = 0;
    } else if (entry === "up" && exit === "left") {
      pathD = "M 0 35 Q 0 0 -35 0";
      headD = "M -35 0 L -25 -5 L -25 5 Z";
      rot = 0;
    } else if (entry === "left" && exit === "down") {
      pathD = "M -35 0 Q 0 0 0 35";
      headD = "M 0 35 L -5 25 L 5 25 Z";
      rot = 0;
    } else if (entry === "down" && exit === "right") {
      pathD = "M 0 -35 Q 0 0 35 0";
      headD = "M 35 0 L 25 -5 L 25 5 Z";
      rot = 0;
    } else if (entry === "right" && exit === "up") {
      pathD = "M 35 0 Q 0 0 0 -35";
      headD = "M 0 -35 L -5 -25 L 5 -25 Z";
      rot = 0;
    }

    content = (
      <>
        <path
          d={pathD}
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d={headD} fill="white" />
      </>
    );
  }

  return (
    <g
      transform={`translate(50,50) rotate(${rot})`}
      opacity="0.9"
      style={{ pointerEvents: "none" }}
    >
      {content}
    </g>
  );
};

const renderCellContent = (cellData, neighborInfo) => {
  const cellType = cellData?.type;
  const carDirection = cellData?.hasCar;
  const flowDirection = cellData?.flowDirection;
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
        ROAD_PALETTE_ITEMS.find((p) => p.type === cellType) ||
        DECORATION_PALETTE_ITEMS.find((p) => p.type === cellType);
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

      // --- MULTI-LANE RENDERING ---
      if (cellType === "road_multilane_vertical") {
        const isRightLane = cellData.lanePosition === 1; // 0 = Left (Primary), 1 = Right (Secondary)

        // Background Road (Gray)
        content.push(
          <line
            key="bg-road"
            x1={center}
            y1={-1}
            x2={center}
            y2={101}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );

        // Thicker Dotted White Line
        // If Primary (Left): Draw on Right Edge (x=100)
        // If Secondary (Right): Draw on Left Edge (x=0)
        const lineX = isRightLane ? 0 : 100;

        content.push(
          <line
            key="dashed-line"
            x1={lineX}
            y1={0}
            x2={lineX}
            y2={100}
            stroke="white"
            strokeWidth="6"
            strokeDasharray="12,12"
          />
        );
      } else if (cellType === "road_multilane_horizontal") {
        const isBottomLane = cellData.lanePosition === 1; // 0 = Top (Primary), 1 = Bottom (Secondary)

        // Background Road
        content.push(
          <line
            key="bg-road"
            x1={-1}
            y1={center}
            x2={101}
            y2={center}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );

        // Thicker Dotted White Line
        // If Primary (Top): Draw on Bottom Edge (y=100)
        // If Secondary (Bottom): Draw on Top Edge (y=0)
        const lineY = isBottomLane ? 0 : 100;

        content.push(
          <line
            key="dashed-line"
            x1={0}
            y1={lineY}
            x2={100}
            y2={lineY}
            stroke="white"
            strokeWidth="6"
            strokeDasharray="12,12"
          />
        );
      }
      // --- STANDARD ROADS ---
      else if (cellType === "road_intersection") {
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

      if (flowDirection) {
        content.push(
          <React.Fragment key="flow">
            {renderDirectionArrow(flowDirection)}
          </React.Fragment>
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
    onRightClick,
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
    (grid[r][c].type === "road_straight_vertical" ||
      grid[r][c].type === "road_multilane_vertical");

  const getIsHorizontalRoad = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r][c] &&
    (grid[r][c].type === "road_straight_horizontal" ||
      grid[r][c].type === "road_multilane_horizontal");

  const getIsIntersection = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r][c] &&
    grid[r][c].type === "road_intersection";

  // Note: We deliberately do NOT draw center lines here anymore as requested previously.

  return (
    <div
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
      className="relative bg-slate-100/50 shadow-2xl rounded-sm overflow-hidden flex-shrink-0"
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

          // Enhanced neighbor checks to support both standard and multilane roads connecting
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
          }

          // Standard road checks
          else if (cellType && cellType.includes("vertical")) {
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
          } else if (cellType && cellType.includes("horizontal")) {
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
    </div>
  );
};

// --- Palette Item ---
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
const SaveLoadModal = ({
  mode,
  onClose,
  grid,
  rows,
  cols,
  onLoadLayout,
  currentLayoutId,
  setCurrentLayoutId,
}) => {
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

  const handleSaveNew = async () => {
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
        const data = await response.json();
        setCurrentLayoutId(data.id);
        onClose();
        alert("Saved as new layout!");
      } else setMessage("Save failed.");
    } catch (e) {
      setMessage("Error saving.");
    }
  };

  const handleOverwrite = async () => {
    if (!currentLayoutId) return;
    try {
      const getResponse = await fetch(
        `${API_BASE_URL}/layouts/${currentLayoutId}/`
      );
      if (!getResponse.ok) {
        setMessage("Could not verify original layout.");
        return;
      }
      const originalLayout = await getResponse.json();

      const response = await fetch(
        `${API_BASE_URL}/layouts/${currentLayoutId}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: originalLayout.name,
            description: originalLayout.description || "",
            rows,
            cols,
            grid_data: grid,
          }),
        }
      );

      if (response.ok) {
        onClose();
        alert("Layout overwritten successfully!");
      } else {
        setMessage("Overwrite failed.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error overwriting.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this layout?")) return;
    try {
      await fetch(`${API_BASE_URL}/layouts/${id}/`, { method: "DELETE" });
      setLayouts((prev) => prev.filter((l) => l.id !== id));
      if (id === currentLayoutId) setCurrentLayoutId(null);
    } catch (e) {
      setMessage("Delete failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
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

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {message && (
            <div className="mb-4 p-2 bg-red-900/30 border border-red-500/30 text-red-300 rounded text-sm text-center">
              {message}
            </div>
          )}

          {mode === "save" ? (
            <div className="space-y-6">
              {currentLayoutId && (
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                  <div className="text-xs font-bold text-emerald-400 uppercase mb-2">
                    Current Layout Loaded
                  </div>
                  <button
                    onClick={handleOverwrite}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2"
                  >
                    <SaveIcon /> Overwrite Save
                  </button>
                </div>
              )}

              {currentLayoutId && (
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold">
                  <div className="h-px bg-slate-700 flex-1"></div>
                  OR
                  <div className="h-px bg-slate-700 flex-1"></div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {currentLayoutId ? "Save as New Layout" : "Layout Name"}
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My New City"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                  autoFocus={!currentLayoutId}
                />
                <button
                  onClick={handleSaveNew}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                  {currentLayoutId ? "Save Copy" : "Save Layout"}
                </button>
              </div>
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
                    className={`group flex justify-between items-center p-3 rounded-lg border transition-all ${
                      currentLayoutId === layout.id
                        ? "bg-blue-900/20 border-blue-500/50"
                        : "bg-slate-800 border-slate-700 hover:border-blue-500/50 hover:bg-slate-750"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 truncate">
                        {layout.name}
                        {currentLayoutId === layout.id && (
                          <span className="ml-2 text-[10px] text-blue-400 uppercase tracking-wider">
                            (Active)
                          </span>
                        )}
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
                            layout.cols,
                            layout.id
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
  const [currentLayoutId, setCurrentLayoutId] = useState(null);

  const [activeModal, setActiveModal] = useState(null);

  const getCell = (g, r, c) => {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return null;
    return g[r][c];
  };

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

            if (cell.hasCar && !movedCars.has(`${r},${c}`)) {
              const direction = cell.hasCar;
              let canMove = false;
              let nextR = r,
                nextC = c,
                nextDir = direction;

              let isBlockedByLight = false;
              const adjOffsets = [
                { dr: -1, dc: 0 },
                { dr: 1, dc: 0 },
                { dr: 0, dc: -1 },
                { dr: 0, dc: 1 },
              ];

              for (const offset of adjOffsets) {
                const neighbor = getCell(newGrid, r + offset.dr, c + offset.dc);
                if (neighbor && neighbor.type === "traffic_light") {
                  const state = neighbor.state || "green";
                  if (state === "yellow" || state === "red") {
                    isBlockedByLight = true;
                  }
                }
              }

              if (!isBlockedByLight) {
                if (direction === "up") nextR--;
                if (direction === "down") nextR++;
                if (direction === "left") nextC--;
                if (direction === "right") nextC++;

                const targetCell = getCell(newGrid, nextR, nextC);
                let tryToTurn = false;

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

                if (
                  cell.flowDirection &&
                  cell.flowDirection.startsWith("turn_")
                ) {
                  const parts = cell.flowDirection.split("_");
                  const exit = parts[2];
                  nextDir = exit;
                  nextR = r;
                  nextC = c;
                  if (nextDir === "up") nextR--;
                  if (nextDir === "down") nextR++;
                  if (nextDir === "left") nextC--;
                  if (nextDir === "right") nextC++;

                  if (
                    isTargetCompatible(getCell(newGrid, nextR, nextC), nextDir)
                  ) {
                    canMove = true;
                  }
                } else if (targetCell && targetCell.type.startsWith("road")) {
                  if (isTargetCompatible(targetCell, nextDir)) {
                    canMove = true;
                  } else {
                    tryToTurn = true;
                  }
                } else {
                  tryToTurn = true;
                }

                if (!canMove && tryToTurn) {
                  const possibleTurns = [];
                  const currentFlow = cell.flowDirection;

                  const checkTurn = (dir) => {
                    if (currentFlow && currentFlow !== dir) return;
                    let dr = 0,
                      dc = 0;
                    if (dir === "up") dr = -1;
                    if (dir === "down") dr = 1;
                    if (dir === "left") dc = -1;
                    if (dir === "right") dc = 1;
                    const t = getCell(newGrid, r + dr, c + dc);
                    if (isTargetCompatible(t, dir)) possibleTurns.push(dir);
                  };

                  if (direction === "up" || direction === "down") {
                    checkTurn("left");
                    checkTurn("right");
                  } else {
                    checkTurn("up");
                    checkTurn("down");
                  }

                  if (possibleTurns.length > 0) {
                    const config = cell.carConfig || {};
                    const bias = config.turnBias || "none";
                    let chosenDir = null;

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
                      if (
                        preferredDir &&
                        possibleTurns.includes(preferredDir)
                      ) {
                        chosenDir = preferredDir;
                      }
                    }

                    if (!chosenDir) {
                      chosenDir =
                        possibleTurns[
                          Math.floor(Math.random() * possibleTurns.length)
                        ];
                    }

                    nextDir = chosenDir;
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
                  const movingConfig = cell.carConfig;

                  if (cell.type) {
                    newGrid[r][c] = {
                      ...cell,
                      hasCar: false,
                      carConfig: undefined,
                    };
                  } else {
                    newGrid[r][c] = null;
                  }

                  if (newGrid[nextR] && newGrid[nextR][nextC] !== undefined) {
                    const target = newGrid[nextR][nextC];
                    if (!target) {
                      newGrid[nextR][nextC] = {
                        type: "road_straight_horizontal",
                        hasCar: nextDir,
                        carConfig: movingConfig,
                      };
                    } else {
                      newGrid[nextR][nextC] = {
                        ...target,
                        hasCar: nextDir,
                        carConfig: movingConfig,
                      };
                    }
                    movedCars.add(`${nextR},${nextC}`);
                  }
                } else {
                  newGrid[r][c] = { ...cell, hasCar: nextDir };
                }
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
      if (isPlaying) setIsPlaying(false);

      setHistory((prev) => {
        const current = prev[step];
        const newGrid = current.map((r) =>
          r.map((cell) => (cell ? { ...cell } : null))
        );

        let updatedCell = newGrid[row][col] || { type: null, hasCar: false };

        if (selectedTool === "select") return prev;

        if (newItemOrType === "eraser") {
          if (updatedCell.hasCar) {
            updatedCell.hasCar = false;
            updatedCell.carConfig = undefined;
            if (newGrid[row][col]) {
              newGrid[row][col] = updatedCell;
            }
          } else {
            updatedCell = null;
            newGrid[row][col] = null;
          }
        } else if (newItemOrType === "car") {
          updatedCell.hasCar = "right";
          updatedCell.carConfig = { speed: 1, turnBias: "none" };
          newGrid[row][col] = updatedCell;
        }

        // --- AUTO-PLACEMENT LOGIC FOR MULTI-LANE ---
        else if (newItemOrType === "road_multilane_vertical") {
          updatedCell.type = newItemOrType;
          updatedCell.laneCount = 2;
          updatedCell.lanePosition = 0; // Primary (Left)
          newGrid[row][col] = updatedCell;

          // Automatically place a vertical road to the RIGHT
          if (col + 1 < cols) {
            const rightCell = newGrid[row][col + 1] || {
              type: null,
              hasCar: false,
            };
            if (!rightCell.type) {
              // Only if empty
              // FIX: Make the neighbor also a multilane road, but secondary
              rightCell.type = "road_multilane_vertical";
              rightCell.lanePosition = 1; // Secondary (Right)
              newGrid[row][col + 1] = rightCell;
            }
          }
        } else if (newItemOrType === "road_multilane_horizontal") {
          updatedCell.type = newItemOrType;
          updatedCell.laneCount = 2;
          updatedCell.lanePosition = 0; // Primary (Top)
          newGrid[row][col] = updatedCell;

          // Automatically place a horizontal road BELOW
          if (row + 1 < rows) {
            const bottomCell = newGrid[row + 1][col] || {
              type: null,
              hasCar: false,
            };
            if (!bottomCell.type) {
              // Only if empty
              // FIX: Make the neighbor also a multilane road, but secondary
              bottomCell.type = "road_multilane_horizontal";
              bottomCell.lanePosition = 1; // Secondary (Bottom)
              newGrid[row + 1][col] = bottomCell;
            }
          }
        }
        // --- STANDARD PLACEMENT ---
        else {
          updatedCell.type = newItemOrType;
          if (newItemOrType === "traffic_light") {
            updatedCell.state = "green";
            updatedCell.timer = 0;
            updatedCell.config = { green: 10, yellow: 4, red: 10 };
          }
          newGrid[row][col] = updatedCell;
        }

        return [...prev.slice(0, step + 1), newGrid];
      });
      setStep((s) => s + 1);
    },
    [step, selectedTool, isPlaying, rows, cols]
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

  const updateRoadFlow = (row, col, direction) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      if (newGrid[row][col] && newGrid[row][col].type.startsWith("road")) {
        newGrid[row][col].flowDirection = direction;
      }
      return [...prev.slice(0, step + 1), newGrid];
    });
    setStep((s) => s + 1);
  };

  // NEW: Update Lane Count setting
  const updateLaneCount = (row, col, delta) => {
    setHistory((prev) => {
      const current = prev[step];
      const newGrid = current.map((r) =>
        r.map((cell) => (cell ? { ...cell } : null))
      );
      if (newGrid[row][col] && newGrid[row][col].type.includes("multilane")) {
        const currentLanes = newGrid[row][col].laneCount || 2;
        const newLanes = Math.max(2, Math.min(6, currentLanes + delta)); // Min 2, Max 6
        newGrid[row][col].laneCount = newLanes;

        // NOTE: Actual grid expansion logic (adding more adjacent tiles) would ideally happen here,
        // but for this MVP we are just storing the setting. The user requested 2 lanes for now.
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
          if (currentCell.type === "road_intersection") {
            currentCell.flowDirection = null;

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

          if (r !== row || c !== col) {
            const cellType = currentCell.type;
            let newFlow = currDir;

            if (
              cellType.includes("horizontal") && // Covers both straight and multilane
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
              cellType.includes("vertical") && // Covers both straight and multilane
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
            } else {
              currentCell.flowDirection = null;
            }
          }

          let dr = 0,
            dc = 0;
          if (nextPropDir === "up") dr = -1;
          if (nextPropDir === "down") dr = 1;
          if (nextPropDir === "left") dc = -1;
          if (nextPropDir === "right") dc = 1;

          if (dr !== 0 || dc !== 0) {
            const nr = r + dr,
              nc = c + dc;
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              newGrid[nr][nc] &&
              newGrid[nr][nc].type.startsWith("road")
            ) {
              queue.push([nr, nc, nextPropDir]);
            }
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
    setRows(loadedRows);
    setCols(loadedCols);
    setHistory([loadedGrid]);
    setStep(0);
    setIsPlaying(false);
    setPrePlayStep(null);
    setCurrentLayoutId(id);
  };

  let currentPaletteItems = MAIN_PALETTE_ITEMS;
  if (paletteMode === "road") currentPaletteItems = ROAD_PALETTE_ITEMS;
  if (paletteMode === "decoration")
    currentPaletteItems = DECORATION_PALETTE_ITEMS;

  const selectedCellData = selectedCell
    ? grid[selectedCell.row] && grid[selectedCell.row][selectedCell.col]
    : null;

  return (
    <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
      {/* --- Modal Overlay --- */}
      {activeModal && (
        <SaveLoadModal
          mode={activeModal}
          onClose={() => setActiveModal(null)}
          grid={grid}
          rows={rows}
          cols={cols}
          onLoadLayout={handleLoadLayout}
          currentLayoutId={currentLayoutId}
          setCurrentLayoutId={setCurrentLayoutId}
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

      {/* Sidebar - NARROWER WIDTH (w-64) */}
      <div
        className={`flex-shrink-0 h-full bg-slate-900/95 backdrop-blur-md shadow-2xl z-40 overflow-hidden transition-[width] duration-300 ease-in-out border-r border-slate-800 flex flex-col ${
          isSidebarOpen ? "w-64" : "w-0 border-none"
        }`}
      >
        <div className="w-64 h-full flex flex-col">
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
              className="w-8 h-8 p-0 flex items-center justify-center bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white rounded-full transition-all shadow-md ml-2 -mr-2 z-50"
            >
              <XIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Properties Panel: Multi-Lane Road Settings (NEW) */}
            {selectedCell &&
              selectedCellData &&
              selectedCellData.type &&
              selectedCellData.type.includes("multilane") && (
                <div className="mb-6 p-4 bg-slate-800 rounded-xl border-l-4 border-slate-400 shadow-md animate-fadeIn">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      🛣️ Road Config
                    </h2>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">Lanes:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateLaneCount(
                            selectedCell.row,
                            selectedCell.col,
                            -1
                          )
                        }
                        className="w-6 h-6 bg-slate-700 rounded text-white hover:bg-slate-600"
                      >
                        -
                      </button>
                      <span className="font-bold text-white">
                        {selectedCellData.laneCount || 2}
                      </span>
                      <button
                        onClick={() =>
                          updateLaneCount(selectedCell.row, selectedCell.col, 1)
                        }
                        className="w-6 h-6 bg-slate-700 rounded text-white hover:bg-slate-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Properties Panel: Traffic Light */}
            {selectedCell &&
              selectedCellData &&
              selectedCellData.type === "traffic_light" && (
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
              )}

            {/* Properties Panel: Car Settings */}
            {selectedCell && selectedCellData && selectedCellData.hasCar && (
              <div className="mb-6 p-4 bg-slate-800 rounded-xl border-l-4 border-orange-500 shadow-md animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    🚗 Car Settings
                  </h2>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Speed Control */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
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
                      className="w-full accent-orange-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Turn Bias */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-2">
                      Turn Priority
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() =>
                          updateCarConfig(
                            selectedCell.row,
                            selectedCell.col,
                            "turnBias",
                            "left"
                          )
                        }
                        className={`p-2 rounded text-xs border ${
                          selectedCellData.carConfig?.turnBias === "left"
                            ? "bg-orange-600 border-orange-400 text-white"
                            : "bg-slate-700 border-slate-600 text-slate-400"
                        }`}
                      >
                        ⬅ Left
                      </button>
                      <button
                        onClick={() =>
                          updateCarConfig(
                            selectedCell.row,
                            selectedCell.col,
                            "turnBias",
                            "none"
                          )
                        }
                        className={`p-2 rounded text-xs border ${
                          !selectedCellData.carConfig?.turnBias ||
                          selectedCellData.carConfig?.turnBias === "none"
                            ? "bg-orange-600 border-orange-400 text-white"
                            : "bg-slate-700 border-slate-600 text-slate-400"
                        }`}
                      >
                        None
                      </button>
                      <button
                        onClick={() =>
                          updateCarConfig(
                            selectedCell.row,
                            selectedCell.col,
                            "turnBias",
                            "right"
                          )
                        }
                        className={`p-2 rounded text-xs border ${
                          selectedCellData.carConfig?.turnBias === "right"
                            ? "bg-orange-600 border-orange-400 text-white"
                            : "bg-slate-700 border-slate-600 text-slate-400"
                        }`}
                      >
                        Right ➡
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Panel: Road Flow Control */}
            {selectedCell &&
              selectedCellData &&
              selectedCellData.type && // Added Null Check
              selectedCellData.type.startsWith("road") && (
                <div className="mb-6 p-4 bg-slate-800 rounded-xl border-l-4 border-emerald-500 shadow-md animate-fadeIn">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      🛣️ Traffic Flow
                    </h2>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-3">
                    {/* Straight Flows */}
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
                            ? "bg-emerald-600"
                            : "bg-slate-700"
                        }`}
                      >
                        Any
                      </button>
                      <button
                        onClick={() =>
                          updateRoadFlow(
                            selectedCell.row,
                            selectedCell.col,
                            "up"
                          )
                        }
                        className={`p-1 rounded text-lg border ${
                          selectedCellData.flowDirection === "up"
                            ? "bg-emerald-600"
                            : "bg-slate-700"
                        }`}
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() =>
                          updateRoadFlow(
                            selectedCell.row,
                            selectedCell.col,
                            "down"
                          )
                        }
                        className={`p-1 rounded text-lg border ${
                          selectedCellData.flowDirection === "down"
                            ? "bg-emerald-600"
                            : "bg-slate-700"
                        }`}
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() =>
                          updateRoadFlow(
                            selectedCell.row,
                            selectedCell.col,
                            "left"
                          )
                        }
                        className={`p-1 rounded text-lg border ${
                          selectedCellData.flowDirection === "left"
                            ? "bg-emerald-600"
                            : "bg-slate-700"
                        }`}
                      >
                        ⬅️
                      </button>
                      <button
                        onClick={() =>
                          updateRoadFlow(
                            selectedCell.row,
                            selectedCell.col,
                            "right"
                          )
                        }
                        className={`p-1 rounded text-lg border ${
                          selectedCellData.flowDirection === "right"
                            ? "bg-emerald-600"
                            : "bg-slate-700"
                        }`}
                      >
                        ➡️
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-700 mt-2">
                      <button
                        onClick={() =>
                          floodFillFlow(
                            selectedCell.row,
                            selectedCell.col,
                            selectedCellData.flowDirection
                          )
                        }
                        className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 rounded transition-colors"
                      >
                        Apply to Connected
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Standard Selected Cell Info (Fallback) */}
            {selectedCell &&
              selectedCellData &&
              selectedCellData.type && // Added null check
              !selectedCellData.type.startsWith("road") &&
              selectedCellData.type !== "traffic_light" && (
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
                    Type:{" "}
                    <span className="text-blue-400 font-mono">
                      {selectedCellData.type}
                    </span>
                    {selectedCellData.hasCar && (
                      <div className="mt-1 text-xs text-orange-400">
                        Contains Car
                      </div>
                    )}
                  </div>
                </div>
              )}

            {!selectedCell && (
              <div className="mb-6 p-4 border border-dashed border-slate-700 rounded-xl text-center">
                <p className="text-xs text-slate-500">
                  Select a Road or Signal with{" "}
                  <span className="text-lg">👆</span> to edit.
                </p>
              </div>
            )}

            {/* Tools Palette - 2 COLUMNS */}
            <div className="mb-8">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                Tools & Objects
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {currentPaletteItems.map((item) => (
                  <PaletteItem
                    key={item.type}
                    item={item}
                    isSelected={selectedTool === item.type}
                    onClick={() => {
                      if (item.type === "road_menu") {
                        setPaletteMode("road");
                        setSelectedTool("select");
                      } else if (item.type === "decoration_menu") {
                        setPaletteMode("decoration");
                        setSelectedTool("select");
                      }
                      // Removed old "back" logic here since it's now in footer
                      else {
                        setSelectedTool(item.type);
                      }
                      if (item.type !== "select") setSelectedCell(null);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* FIXED FOOTER for Back Button */}
          {paletteMode !== "main" && (
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <button
                onClick={() => {
                  setPaletteMode("main");
                  setSelectedTool("select");
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <BackArrowIcon />
                <span className="text-sm font-medium">Back to Menu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Stage */}
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
                setIsPlaying(false);
                setHistory((prev) => [
                  ...prev.slice(0, step + 1),
                  createEmptyGrid(rows, cols),
                ]);
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
