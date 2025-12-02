/**
 * FILE PURPOSE:
 * Helper functions to render complex SVG graphics for the grid cells.
 *
 * CONTENTS:
 * - renderCar: Draws the car and rotates it based on direction.
 * - renderTrafficLight: Draws the signal box and active lights.
 * - renderDirectionArrow: Draws straight and curved (turn) arrows for traffic flow.
 * - renderCellContent: The main orchestrator that determines what SVG to draw based on cell type.
 *
 * DEPENDENCIES:
 * - React
 * - Palette Constants (to look up emojis for simple items)
 */

import React from "react";
import {
  MAIN_PALETTE_ITEMS,
  ROAD_PALETTE_ITEMS,
  DECORATION_PALETTE_ITEMS,
} from "../constants";

// --- 1. Car Renderer ---
export const renderCar = (direction) => {
  let rotation = 0;
  if (direction === "right") rotation = 90;
  if (direction === "down") rotation = 180;
  if (direction === "left") rotation = 270;

  return (
    <g transform={`translate(50,50) rotate(${rotation}) translate(-25,-30)`}>
      {/* Shadow */}
      <rect x="2" y="4" width="50" height="60" rx="8" fill="rgba(0,0,0,0.2)" />
      {/* Wheels */}
      <rect x="-4" y="8" width="8" height="12" rx="2" fill="#333" />
      <rect x="46" y="8" width="8" height="12" rx="2" fill="#333" />
      <rect x="-4" y="40" width="8" height="12" rx="2" fill="#333" />
      <rect x="46" y="40" width="8" height="12" rx="2" fill="#333" />
      {/* Body */}
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
      {/* Windshields */}
      <rect x="5" y="8" width="40" height="10" rx="2" fill="#93C5FD" />
      <rect x="5" y="42" width="40" height="8" rx="2" fill="#93C5FD" />
      {/* Roof Highlight */}
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

// --- 2. Traffic Light Renderer ---
export const renderTrafficLight = (lightState) => {
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

// --- 3. Flow Direction Arrow Renderer ---
export const renderDirectionArrow = (direction) => {
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
  // Curved Arrows (L-Shapes for Turns)
  else if (direction && direction.startsWith("turn_")) {
    const parts = direction.split("_"); // [turn, entry, exit]
    const entry = parts[1];
    const exit = parts[2];

    let pathD = "";
    let headD = "";

    // Drawing paths relative to center (0,0) with translate(50,50) applied later
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

// --- 4. Main Cell Content Renderer ---
export const renderCellContent = (cellData, neighborInfo) => {
  const cellType = cellData?.type;
  const carDirection = cellData?.hasCar;
  const flowDirection = cellData?.flowDirection;
  const content = [];

  if (cellType) {
    // 4a. Traffic Light
    if (cellType === "traffic_light") {
      content.push(
        <React.Fragment key="light">
          {renderTrafficLight(cellData.state)}
        </React.Fragment>
      );
    }
    // 4b. Simple Emoji Items (Buildings, Trees, etc.)
    else if (!cellType.startsWith("road_")) {
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
    }
    // 4c. Complex Roads (Dividers, Multi-lanes, Intersections)
    else {
      const strokeColor = "#334155";
      const strokeWidth = 80;
      const center = 50;

      // --- DIVIDER ROADS ---
      if (cellType === "road_divider_vertical") {
        const pos = cellData.lanePosition || 0; // 0=Left, 1=Right

        // Background Road
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

        // Solid Yellow Line Logic
        const lineX = pos === 0 ? 100 : 0;
        content.push(
          <line
            key="divider-line"
            x1={lineX}
            y1={0}
            x2={lineX}
            y2={100}
            stroke="#FACC15" // Yellow-400
            strokeWidth="6"
          />
        );
      } else if (cellType === "road_divider_horizontal") {
        const pos = cellData.lanePosition || 0; // 0=Top, 1=Bottom

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

        // Solid Yellow Line Logic
        const lineY = pos === 0 ? 100 : 0;
        content.push(
          <line
            key="divider-line"
            x1={0}
            y1={lineY}
            x2={100}
            y2={lineY}
            stroke="#FACC15" // Yellow-400
            strokeWidth="6"
          />
        );
      }

      // --- MULTI-LANE ROADS (N-Lanes) ---
      else if (cellType === "road_multilane_vertical") {
        const pos = cellData.lanePosition || 0;
        const count = cellData.laneCount || 2;

        // Background
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

        // Left Dotted Line
        if (pos > 0) {
          content.push(
            <line
              key="dashed-line-left"
              x1={0}
              y1={0}
              x2={0}
              y2={100}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
        }

        // Right Dotted Line
        if (pos < count - 1) {
          content.push(
            <line
              key="dashed-line-right"
              x1={100}
              y1={0}
              x2={100}
              y2={100}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
        }
      } else if (cellType === "road_multilane_horizontal") {
        const pos = cellData.lanePosition || 0;
        const count = cellData.laneCount || 2;

        // Background
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

        // Top Dotted Line
        if (pos > 0) {
          content.push(
            <line
              key="dashed-line-top"
              x1={0}
              y1={0}
              x2={100}
              y2={0}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
        }

        // Bottom Dotted Line
        if (pos < count - 1) {
          content.push(
            <line
              key="dashed-line-bottom"
              x1={0}
              y1={100}
              x2={100}
              y2={100}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
        }
      }
      // --- INTERSECTIONS ---
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
      }
      // --- STRAIGHT ROADS ---
      else if (cellType === "road_straight_vertical") {
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

      // Draw Flow Arrow if present
      if (flowDirection) {
        content.push(
          <React.Fragment key="flow">
            {renderDirectionArrow(flowDirection)}
          </React.Fragment>
        );
      }
    }
  }

  // 5. Draw Car on top if present
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
