import React, { useState, useEffect } from "react";

// --- Constants ---
const GRID_ROWS = 12;
const GRID_COLS = 12;

// Define the items available in the palette
const PALETTE_ITEMS = [
  { type: "road", label: "Road", emoji: "🛣️" },
  { type: "car", label: "Car", emoji: "🚗" },
  { type: "building", label: "Building", emoji: "🏢" },
  { type: "tree", label: "Tree", emoji: "🌳" },
  { type: "traffic_light", label: "Light", emoji: "🚦" },
  { type: "eraser", label: "Eraser", emoji: "🧼" },
];

// --- Helper Functions ---
const createEmptyGrid = () =>
  Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));

const renderCellContent = (cellType) => {
  const item = PALETTE_ITEMS.find((p) => p.type === cellType);
  if (!item) return null;
  return (
    <span className="text-4xl" role="img" aria-label={item.label}>
      {item.emoji}
    </span>
  );
};

// --- Draggable Item Component ---
const DraggableItem = ({ type, label, emoji, selected, onSelect }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClick = () => onSelect(type);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`flex flex-col items-center justify-center p-3 m-1 border-2 border-gray-300 rounded-lg shadow-sm cursor-grab transition-colors
        ${selected ? "translate-y-1 bg-gray-200" : "bg-white"} 
        hover:bg-gray-100
      `}
    >
      <span className="text-4xl" role="img" aria-label={label}>
        {emoji}
      </span>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
  );
};

// --- Palette Component ---
const Palette = ({ selectedType, setSelectedType }) => {
  const handleSelect = (type) =>
    selectedType === type ? setSelectedType(null) : setSelectedType(type);

  return (
    <div className="grid grid-cols-2 gap-2">
      {PALETTE_ITEMS.map((item) => (
        <DraggableItem
          key={item.type}
          type={item.type}
          label={item.label}
          emoji={item.emoji}
          selected={item.type === selectedType}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};

// --- Grid Cell Component ---
const GridCell = ({ type, row, col, onDrop, onPaint, isMouseDown, setIsMouseDown }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(e, row, col);
  };

  const handleMouseDown = () => {
    setIsMouseDown(true);
    onPaint(row, col); // <--- paint immediately on first click
  };

  const handleMouseEnter = () => {
    if (isMouseDown) {
      onPaint(row, col);
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onClick={() => onPaint(row, col)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-full h-full border border-green-800 bg-green-200/50 rounded-sm flex items-center justify-center transition-colors hover:bg-green-300/50"
    >
      {renderCellContent(type)}
    </div>
  );
};


// --- Grid Component ---
const Grid = ({ grid, onDrop, onPaint, isMouseDown, setIsMouseDown }) => {
  return (
    <div
      className="grid border-2 border-green-800 bg-green-100 rounded-lg shadow-inner"
      style={{
        gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        width: "calc(100vh - 150px)",
        maxWidth: "calc(100vw - 40px)",
        aspectRatio: "1 / 1",
        userSelect: "none", // prevent text selection
      }}
    >
      {grid.map((row, rowIndex) =>
        row.map((cellType, colIndex) => (
          <GridCell
            key={`${rowIndex}-${colIndex}`}
            type={cellType}
            row={rowIndex}
            col={colIndex}
            onDrop={onDrop}
            onPaint={onPaint}
            isMouseDown={isMouseDown}
            setIsMouseDown={setIsMouseDown}
          />
        ))
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [selectedType, setSelectedType] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Stop painting on mouse up
  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Paint on click or drag
  const handlePaint = (row, col) => {
    if (!selectedType) return;
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = selectedType === "eraser" ? null : selectedType;
    setGrid(newGrid);
  };

  // Handle drag-drop from palette
  const handleDrop = (e, row, col) => {
    const itemType = e.dataTransfer.getData("text/plain");
    if (!itemType) return;
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = itemType === "eraser" ? null : itemType;
    setGrid(newGrid);
  };

  const clearGrid = () => setGrid(createEmptyGrid());

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans text-gray-800">
      {/* Palette */}
      <div className="w-full md:w-64 bg-gray-200 p-4 shadow-lg overflow-y-auto border-r border-gray-300">
        <h1 className="text-2xl font-bold text-center mb-4">Sandbox</h1>
        <Palette selectedType={selectedType} setSelectedType={setSelectedType} />
        <button
          onClick={clearGrid}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors"
        >
          Clear Grid
        </button>
      </div>

      {/* Grid */}
      <div className="flex-grow flex items-center justify-center p-4 md:p-8 overflow-auto">
        <Grid
          grid={grid}
          onDrop={handleDrop}
          onPaint={handlePaint}
          isMouseDown={isMouseDown}
          setIsMouseDown={setIsMouseDown}
        />
      </div>
    </div>
  );
}
