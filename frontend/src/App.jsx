import React, { useState, useEffect, useCallback } from "react";
import { cityApi } from './cityApi';

// --- Constants ---
const TOTAL_GRID_WIDTH_PX = 19 * 64;
const TOTAL_GRID_HEIGHT_PX = 12 * 64;
const RATIO = 1.5625;

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
  { type: "road_straight", label: "Straight", emoji: "➖" },
  { type: "road_intersection", label: "Intersection", emoji: "➕" },
  { type: "back", label: "Back", emoji: "⬅️" },
];

// --- Helper Functions ---
const createEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array(cols).fill(null));

// --- GridCell Component ---
const GridCell = React.memo(({
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
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedType = e.dataTransfer.getData("itemType");
    onDrop(row, col, droppedType);
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

  const renderCellContent = (cellType, neighborInfo) => {
    if (cellType !== "road_intersection" && cellType !== "road_straight") {
      const item = MAIN_PALETTE_ITEMS.find((p) => p.type === cellType) ||
                  ROAD_PALETTE_ITEMS.find((p) => p.type === cellType);
      if (!item) return null;
      return (
        <span className="text-3xl" role="img" aria-label={item.label}>
          {item.emoji}
        </span>
      );
    }

    const hasRoad = neighborInfo;
    const strokeColor = "#4A5568";
    const strokeWidth = 80;
    const center = 50;
    const paths = [];

    const isUp = hasRoad.up;
    const isDown = hasRoad.down;
    const isLeft = hasRoad.left;
    const isRight = hasRoad.right;
    const neighborCount = isUp + isDown + isLeft + isRight;

    if (neighborCount === 2) {
      if (isUp && isRight) {
        paths.push(<polyline key="ur" points="101,50 50,50 50,-1" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" fill="none" />);
      } else if (isUp && isLeft) {
        paths.push(<polyline key="ul" points="-1,50 50,50 50,-1" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" fill="none" />);
      } else if (isDown && isRight) {
        paths.push(<polyline key="dr" points="101,50 50,50 50,101" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" fill="none" />);
      } else if (isDown && isLeft) {
        paths.push(<polyline key="dl" points="-1,50 50,50 50,101" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" fill="none" />);
      }
    }

    if (paths.length === 0) {
      if (isUp) paths.push(<line key="up" x1={center} y1={center} x2={center} y2={-1} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />);
      if (isDown) paths.push(<line key="down" x1={center} y1={center} x2={center} y2={101} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />);
      if (isLeft) paths.push(<line key="left" x1={center} y1={center} x2={-1} y2={center} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />);
      if (isRight) paths.push(<line key="right" x1={center} y1={center} x2={101} y2={center} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />);
    }

    if (neighborCount === 0) {
      paths.push(<circle key="dot" cx={center} cy={center} r={strokeWidth / 2} fill={strokeColor} />);
    }

    return (
      <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {paths}
      </svg>
    );
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
});

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

  const getIsAnyRoad = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return grid[r][c] === "road_intersection" || grid[r][c] === "road_straight";
  };

  const getIsStraight = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return grid[r][c] === "road_straight";
  };

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
        centerLines.push({ x1: cx, y1: cy, x2: (c + 1.5) * cellWidth, y2: cy, key: `h-${r}-${c}-right` });
      }
      if (getIsAnyRoad(r + 1, c)) {
        centerLines.push({ x1: cx, y1: cy, x2: cx, y2: (r + 1.5) * cellHeight, key: `v-${r}-${c}-down` });
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
      {grid.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const cellType = cell;
          let neighborInfo = null;

          if (cellType === "road_intersection") {
            neighborInfo = {
              up: getIsAnyRoad(rowIndex - 1, colIndex),
              down: getIsAnyRoad(rowIndex + 1, colIndex),
              left: getIsAnyRoad(rowIndex, colIndex - 1),
              right: getIsAnyRoad(rowIndex, colIndex + 1),
            };
          } else if (cellType === "road_straight") {
            const hasStraightH = getIsStraight(rowIndex, colIndex - 1) || getIsStraight(rowIndex, colIndex + 1);
            const hasStraightV = getIsStraight(rowIndex - 1, colIndex) || getIsStraight(rowIndex + 1, colIndex);

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
                neighborInfo = { up: n_up, down: n_down, left: false, right: false };
              } else if (n_left || n_right) {
                neighborInfo = { up: false, down: false, left: n_left, right: n_right };
              } else {
                neighborInfo = { up: false, down: false, left: false, right: false };
              }
            }
          }

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

      <svg width={TOTAL_GRID_WIDTH_PX} height={TOTAL_GRID_HEIGHT_PX} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        {centerLines.map((line) => (
          <line {...line} stroke={centerLineColor} strokeWidth={centerLineWidth} strokeDasharray={centerLineDash} strokeLinecap="round" />
        ))}
      </svg>
    </div>
  );
};

// --- PaletteItem Component ---
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
        isSelected ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-300 bg-white hover:border-blue-300"
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
  const [paletteMode, setPaletteMode] = useState("main");
  
  // NEW: Save/Load State
  const [savedCities, setSavedCities] = useState([]);
  const [currentCityId, setCurrentCityId] = useState(null);
  const [cityTitle, setCityTitle] = useState('My City');
  const [isSaving, setIsSaving] = useState(false);

  // Load saved cities when component mounts
  useEffect(() => {
    loadSavedCities();
  }, []);

  // NEW: Save/Load Functions
  const loadSavedCities = async () => {
    try {
      const cities = await cityApi.getCities();
      setSavedCities(cities);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const saveCurrentCity = async () => {
    try {
      setIsSaving(true);
      const cityData = {
        title: cityTitle,
        grid_data: grid,
        rows: rows,
        cols: cols,
        selected_tool: selectedTool
      };

      let savedCity;
      if (currentCityId) {
        savedCity = await cityApi.updateCity(currentCityId, cityData);
      } else {
        savedCity = await cityApi.saveCity(cityData);
        setCurrentCityId(savedCity.id);
      }

      await loadSavedCities();
      alert('City saved successfully!');
    } catch (error) {
      console.error('Failed to save city:', error);
      alert('Failed to save city');
    } finally {
      setIsSaving(false);
    }
  };

  const loadCity = async (city) => {
    try {
      setGrid(city.grid_data);
      setRows(city.rows);
      setCols(city.cols);
      setSelectedTool(city.selected_tool);
      setCityTitle(city.title);
      setCurrentCityId(city.id);
      
      const newHistory = [city.grid_data];
      setHistory(newHistory);
      setHistoryIndex(0);
    } catch (error) {
      console.error('Failed to load city:', error);
      alert('Failed to load city');
    }
  };

  const createNewCity = () => {
    const emptyGrid = createEmptyGrid(rows, cols);
    setGrid(emptyGrid);
    setCurrentCityId(null);
    setCityTitle('My City');
    setSelectedTool('select');
    const newHistory = [emptyGrid];
    setHistory(newHistory);
    setHistoryIndex(0);
  };

  const updateGrid = useCallback((row, col, value) => {
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
  }, [history, historyIndex]);

  const handleDrop = useCallback((row, col, itemType) => {
    if (itemType === "eraser") {
      updateGrid(row, col, null);
    } else if (itemType && itemType !== "select" && itemType !== "back" && itemType !== "road_menu") {
      updateGrid(row, col, itemType);
    }
  }, [updateGrid]);

  const handlePaint = useCallback((row, col) => {
    if (!selectedTool || selectedTool === "select" || selectedTool === "back" || selectedTool === "road_menu") {
      return;
    }
    if (selectedTool === "eraser") {
      updateGrid(row, col, null);
    } else {
      updateGrid(row, col, selectedTool);
    }
  }, [selectedTool, updateGrid]);

  const handleRightClick = useCallback((row, col) => {
    updateGrid(row, col, null);
  }, [updateGrid]);

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

  const resetGridDimensions = (newRows, newCols) => {
    if (isNaN(newRows) || isNaN(newCols) || newRows <= 0 || newCols <= 0) return;
    const newGrid = createEmptyGrid(newRows, newCols);
    setRows(newRows);
    setCols(newCols);
    setGrid(newGrid);
    setHistory([newGrid]);
    setHistoryIndex(0);
  };

  const handleRowsChange = (e) => {
    const newRows = Math.max(1, parseInt(e.target.value, 10));
    if (!isNaN(newRows)) {
      const newCols = Math.round(newRows * RATIO);
      resetGridDimensions(newRows, newCols);
    }
  };

  const handleColsChange = (e) => {
    const newCols = Math.max(1, parseInt(e.target.value, 10));
    if (!isNaN(newCols)) {
      const newRows = Math.round(newCols / RATIO);
      resetGridDimensions(newRows, newCols);
    }
  };

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

  const currentPaletteItems = paletteMode === "road" ? ROAD_PALETTE_ITEMS : MAIN_PALETTE_ITEMS;

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
          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors mb-6"
        >
          Clear Grid
        </button>

        {/* NEW: Save & Load Section */}
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Save & Load</h2>
          
          {/* City Title Input */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-600">City Name</label>
            <input
              type="text"
              value={cityTitle}
              onChange={(e) => setCityTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              placeholder="Enter city name"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={saveCurrentCity}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
          >
            {isSaving ? 'Saving...' : currentCityId ? 'Update City' : 'Save City'}
          </button>

          {/* New City Button */}
          <button
            onClick={createNewCity}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors mb-4"
          >
            New City
          </button>

          {/* Saved Cities List */}
          <h3 className="text-md font-semibold text-gray-700 mb-2">Saved Cities</h3>
          <div className="max-h-40 overflow-y-auto">
            {savedCities.map((city) => (
              <div
                key={city.id}
                onClick={() => loadCity(city)}
                className={`p-2 mb-1 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentCityId === city.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="font-medium text-sm">{city.title}</div>
                <div className="text-xs text-gray-500">
                  {city.rows}x{city.cols} • {new Date(city.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {savedCities.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                No saved cities yet
              </div>
            )}
          </div>
        </div>
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