import React, { useState } from "react";

// --- Constants ---
const GRID_ROWS = 12;
const GRID_COLS = 12;

// Define the items available in the palette
const PALETTE_ITEMS = [
  { type: "road", label: "Road", emoji: "🛣️" },
  { type: "car", label: "Car", emoji: "🚗" },
  { type: "building", label: "Building", emoji: "🏢" }, // This line was fixed
  { type: "tree", label: "Tree", emoji: "🌳" },
  { type: "traffic_light", label: "Light", emoji: "🚦" },
  { type: "eraser", label: "Eraser", emoji: "🧼" }, // An "eraser" to clear cells
];

// --- Helper Functions ---

/**
 * Creates a new, empty grid state
 * @returns {Array<Array<string|null>>} A 2D array filled with null
 */
const createEmptyGrid = () =>
  Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));

/**
 * Renders the visual content for a grid cell based on its type
 * @param {string | null} cellType - The type of item in the cell (e.g., 'road', 'car')
 * @returns {JSX.Element | null}
 */
const renderCellContent = (cellType) => {
  const item = PALETTE_ITEMS.find((p) => p.type === cellType);
  if (!item) return null;

  return (
    <span className="text-4xl" role="img" aria-label={item.label}>
      {item.emoji}
    </span>
  );
};

// --- Components ---

// --- DraggableItem Component ---
const DraggableItem = ({ type, label, emoji, selected, onSelect }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClick = () => {
    onSelect(type); // tell the Palette that this item is now selected
  };

  return (
    <div
      draggable="true"
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
const Palette = () => {
  const [selectedType, setSelectedType] = useState(null);

  const handleSelect = (type) => {
    // If clicking the already selected type, unselect it
    selectedType === type ? setSelectedType(null) : setSelectedType(type);

  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {PALETTE_ITEMS.map((item) => (
        <DraggableItem
          key={item.type}
          type={item.type}
          label={item.label}
          emoji={item.emoji}
          selected={item.type === selectedType} // highlight only the selected item
          onSelect={handleSelect} // click updates the selected type
        />
      ))}
    </div>
  );
};


/**
 * A single cell in the main grid
 */
const GridCell = ({ type, row, col, onDrop }) => {
  const handleDragOver = (e) => {
    // This is necessary to allow a drop event
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(e, row, col);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-full h-full border border-green-800 bg-green-200/50 rounded-sm flex items-center justify-center transition-colors hover:bg-green-300/50"
      data-row={row}
      data-col={col}
    >
      {/* Render the emoji/content for the cell type */}
      {renderCellContent(type)}
    </div>
  );
};

/**
 * The main grid component
 */
const Grid = ({ grid, onDrop }) => {
  return (
    <div
      className="grid border-2 border-green-800 bg-green-100 rounded-lg shadow-inner"
      style={{
        gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        width: "calc(100vh - 150px)", // Make it square-ish
        maxWidth: "calc(100vw - 40px)",
        aspectRatio: "1 / 1", // Enforce square shape
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
          />
        ))
      )}
    </div>
  );
};

/**
 * Main App Component
 */
export default function App() {
  // 2D array representing the state of the grid
  const [grid, setGrid] = useState(() => createEmptyGrid());

  /**
   * Handles the drop event on a grid cell
   */
  const handleDropOnGrid = (e, row, col) => {
    // Get the item type from the drag data
    const itemType = e.dataTransfer.getData("text/plain");

    if (!itemType) return;

    // Create a deep copy of the grid state
    const newGrid = grid.map((r) => [...r]);

    // Update the cell with the new item type
    // If it's the 'eraser', set the cell to null
    newGrid[row][col] = itemType === "eraser" ? null : itemType;

    // Set the new grid state
    setGrid(newGrid);
  };

  /**
   * Resets the grid to be empty
   */
  const clearGrid = () => {
    setGrid(createEmptyGrid());
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans text-gray-800">
      {/* --- Palette Sidebar --- */}
      <div className="w-full md:w-64 bg-gray-200 p-4 shadow-lg overflow-y-auto border-r border-gray-300">
        <h1 className="text-2xl font-bold text-center mb-4">Sandbox</h1>
        <Palette />
        <button
          onClick={clearGrid}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors"
        >
          Clear Grid
        </button>
      </div>

      {/* --- Main Grid Area --- */}
      <div className="flex-grow flex items-center justify-center p-4 md:p-8 overflow-auto">
        <Grid grid={grid} onDrop={handleDropOnGrid} />
      </div>
    </div>
  );
}
