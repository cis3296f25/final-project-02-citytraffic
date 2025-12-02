/**
 * FILE PURPOSE:
 * Renders the interactive game grid and individual cells.
 *
 * CONTENTS:
 * - Grid: The container component. It handles the "neighbor logic" to connect roads and applies the visual theme (background/dots).
 * - GridCell: The individual square component. Handles drag-and-drop, clicks, and context menus.
 *
 * DEPENDENCIES:
 * - renderCellContent (SVG Logic)
 * - Constants (Dimensions and Themes)
 */

import React from "react";
import { renderCellContent } from "../utils/renderHelpers";
import {
  TOTAL_GRID_WIDTH_PX,
  TOTAL_GRID_HEIGHT_PX,
  THEMES,
} from "../constants";

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

// --- Main Grid Component ---
export const Grid = ({
  grid,
  rows,
  cols,
  onDrop,
  onPaint,
  setIsMouseDown,
  onRightClick,
  selectedCell,
  theme = "dark", // Default theme
}) => {
  // Guard clause to prevent crash if grid is undefined
  if (!grid) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading Grid...
      </div>
    );
  }

  const cellWidth = TOTAL_GRID_WIDTH_PX / cols;
  const cellHeight = TOTAL_GRID_HEIGHT_PX / rows;

  // Determine styles based on theme
  const currentTheme = THEMES?.[theme] || THEMES.dark;
  const gridBgClass = currentTheme.gridBg || "bg-slate-100/50";
  const gridPattern =
    currentTheme.gridPattern || "radial-gradient(#cbd5e1 1px, transparent 1px)";

  // --- Neighbor Detection Helpers ---
  const getIsVerticalRoad = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r] &&
    grid[r][c] &&
    (grid[r][c].type === "road_straight_vertical" ||
      grid[r][c].type === "road_multilane_vertical" ||
      grid[r][c].type === "road_divider_vertical");

  const getIsHorizontalRoad = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r] &&
    grid[r][c] &&
    (grid[r][c].type === "road_straight_horizontal" ||
      grid[r][c].type === "road_multilane_horizontal" ||
      grid[r][c].type === "road_divider_horizontal");

  const getIsIntersection = (r, c) =>
    r >= 0 &&
    r < rows &&
    c >= 0 &&
    c < cols &&
    grid[r] &&
    grid[r][c] &&
    grid[r][c].type === "road_intersection";

  return (
    <div
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
      className={`relative shadow-2xl rounded-sm overflow-hidden flex-shrink-0 transition-colors duration-300 ${gridBgClass}`}
      style={{
        userSelect: "none",
        width: `${TOTAL_GRID_WIDTH_PX}px`,
        height: `${TOTAL_GRID_HEIGHT_PX}px`,
        backgroundImage: gridPattern,
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

          // Enhanced neighbor checks for intersections
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
          // Vertical Roads
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
          }
          // Horizontal Roads
          else if (cellType && cellType.includes("horizontal")) {
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
