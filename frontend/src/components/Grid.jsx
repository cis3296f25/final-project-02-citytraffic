/**
 * FILE PURPOSE:
 * Renders the interactive game grid and individual cells.
 *
 * CONTENTS:
 * - Grid: The container component. It calculates cell dimensions based on the total pixels defined in constants.
 * It also handles the "neighbor logic" to determine if a road should connect to adjacent cells.
 * - GridCell: The individual square component. Handles drag-and-drop events, clicks (painting), and context menus (right-click).
 *
 * DEPENDENCIES:
 * - renderCellContent (from utils/renderHelpers): Handles the inner SVG graphics.
 * - Constants: TOTAL_GRID_WIDTH_PX, TOTAL_GRID_HEIGHT_PX.
 *
 * NEW COMPONENTS YOU CAN ADD HERE:
 * - GridOverlay: If you want to show a grid overlay (toggleable lines) on top of the map.
 * - HoverHighlighter: A separate component to handle the hover state visuals if they get too complex for CSS.
 */

import React from "react";
import { renderCellContent } from "../utils/renderHelpers";
import { TOTAL_GRID_WIDTH_PX, TOTAL_GRID_HEIGHT_PX } from "../constants";

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
}) => {
  // CRITICAL FIX: Guard clause to prevent crash if grid is undefined
  if (!grid) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading Grid...
      </div>
    );
  }

  const cellWidth = TOTAL_GRID_WIDTH_PX / cols;
  const cellHeight = TOTAL_GRID_HEIGHT_PX / rows;

  // --- Neighbor Detection Helpers ---
  // These helpers determine if a neighbor is a specific type of road to auto-connect textures.

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
