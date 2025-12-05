/**
 * FILE PURPOSE:
 * Helper functions to render complex SVG graphics for the grid cells.
 */

import React from "react";
import {
  MAIN_PALETTE_ITEMS,
  ROAD_PALETTE_ITEMS,
  DECORATION_PALETTE_ITEMS,
} from "../constants";

// ... (renderCar, renderTree, renderBuilding, renderDirectionArrow remain unchanged) ...
export const renderCar = (direction) => {
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

export const renderTrafficLight = (lightState) => {
  const colors = {
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
    off: "#374151",
  };
  const currentState = lightState || "green";

  return (
    <g transform="translate(55, 20) scale(0.35)">
      <line x1="25" y1="0" x2="25" y2="-15" stroke="#374151" strokeWidth="6" />
      <rect
        x="0"
        y="0"
        width="50"
        height="130"
        rx="10"
        fill="#1f2937"
        stroke="#4b5563"
        strokeWidth="4"
        className="shadow-sm"
      />
      <circle
        cx="25"
        cy="25"
        r="15"
        fill={currentState === "red" ? colors.red : colors.off}
      />
      <circle
        cx="25"
        cy="65"
        r="15"
        fill={currentState === "yellow" ? colors.yellow : colors.off}
      />
      <circle
        cx="25"
        cy="105"
        r="15"
        fill={currentState === "green" ? colors.green : colors.off}
      />
    </g>
  );
};

// --- 3. Stop Line Renderer (UPDATED) ---
const renderStopLine = (side) => {
  let coords = { x1: 10, y1: 90, x2: 90, y2: 90 }; // Default

  // Orientation Logic:
  // - Top/Bottom side = Horizontal Line
  // - Left/Right side = Vertical Line

  if (side === "top") {
    coords = { x1: 10, y1: 10, x2: 90, y2: 10 };
  } else if (side === "bottom") {
    coords = { x1: 10, y1: 90, x2: 90, y2: 90 };
  } else if (side === "left") {
    coords = { x1: 10, y1: 10, x2: 10, y2: 90 };
  } else if (side === "right") {
    coords = { x1: 90, y1: 10, x2: 90, y2: 90 };
  }

  return (
    <g>
      <line
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke="white"
        strokeWidth="6"
        opacity="0.6"
        strokeDasharray="10,5"
      />
    </g>
  );
};

const renderTree = () => {
  return (
    <g transform="translate(50, 85)">
      <ellipse cx="0" cy="0" rx="25" ry="10" fill="rgba(0,0,0,0.2)" />
      <rect x="-6" y="-30" width="12" height="30" fill="#78350f" />
      <g transform="translate(0, -35)">
        <circle cx="0" cy="0" r="25" fill="#15803d" />
        <circle cx="-12" cy="-10" r="20" fill="#16a34a" />
        <circle cx="12" cy="-10" r="20" fill="#16a34a" />
        <circle cx="0" cy="-25" r="18" fill="#22c55e" />
      </g>
    </g>
  );
};

const renderBuilding = () => {
  return (
    <g>
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="4"
        fill="rgba(0,0,0,0.2)"
      />
      <rect
        x="10"
        y="5"
        width="80"
        height="85"
        rx="4"
        fill="#64748b"
        stroke="#334155"
        strokeWidth="3"
      />
      <rect x="15" y="10" width="70" height="70" fill="#f1f5f9" />
      <rect x="20" y="15" width="25" height="25" fill="#93c5fd" />
      <rect x="55" y="15" width="25" height="25" fill="#93c5fd" />
      <rect x="20" y="50" width="25" height="25" fill="#93c5fd" />
      <rect x="55" y="50" width="25" height="25" fill="#93c5fd" />
    </g>
  );
};

export const renderDirectionArrow = (direction) => {
  let content = null;
  let rot = 0;

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
  } else if (direction && direction.startsWith("turn_")) {
    const parts = direction.split("_");
    const entry = parts[1];
    const exit = parts[2];

    let pathD = "";
    let headD = "";

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

// --- 7. Main Cell Content Renderer ---
export const renderCellContent = (cellData, neighborInfo) => {
  const cellType = cellData?.type;
  const carDirection = cellData?.hasCar;
  const flowDirection = cellData?.flowDirection;
  const stopMarker = cellData?.stopMarker;
  const content = [];

  if (cellType) {
    if (cellType === "tree") {
      content.push(<React.Fragment key="tree">{renderTree()}</React.Fragment>);
    } else if (cellType === "building") {
      content.push(
        <React.Fragment key="building">{renderBuilding()}</React.Fragment>
      );
    } else if (!cellType.startsWith("road_") && cellType !== "traffic_light") {
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
    } else if (cellType.startsWith("road_") || cellType === "traffic_light") {
      const strokeColor = "#334155";
      const strokeWidth = 80;
      const center = 50;

      const effectiveType =
        cellType === "traffic_light" ? "road_intersection" : cellType;

      if (effectiveType === "road_divider_vertical") {
        const pos = cellData.lanePosition || 0;
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
        const lineX = pos === 0 ? 100 : 0;
        content.push(
          <line
            key="divider-line"
            x1={lineX}
            y1={0}
            x2={lineX}
            y2={100}
            stroke="#FACC15"
            strokeWidth="6"
          />
        );
      } else if (effectiveType === "road_divider_horizontal") {
        const pos = cellData.lanePosition || 0;
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
        const lineY = pos === 0 ? 100 : 0;
        content.push(
          <line
            key="divider-line"
            x1={0}
            y1={lineY}
            x2={100}
            y2={lineY}
            stroke="#FACC15"
            strokeWidth="6"
          />
        );
      } else if (effectiveType === "road_multilane_vertical") {
        const pos = cellData.lanePosition || 0;
        const count = cellData.laneCount || 2;
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
        if (pos > 0)
          content.push(
            <line
              key="dl1"
              x1={0}
              y1={0}
              x2={0}
              y2={100}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
        if (pos < count - 1)
          content.push(
            <line
              key="dl2"
              x1={100}
              y1={0}
              x2={100}
              y2={100}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
      } else if (effectiveType === "road_multilane_horizontal") {
        const pos = cellData.lanePosition || 0;
        const count = cellData.laneCount || 2;
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
        if (pos > 0)
          content.push(
            <line
              key="dt1"
              x1={0}
              y1={0}
              x2={100}
              y2={0}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
        if (pos < count - 1)
          content.push(
            <line
              key="dt2"
              x1={0}
              y1={100}
              x2={100}
              y2={100}
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12,12"
            />
          );
      } else if (effectiveType === "road_intersection") {
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

        // Plaza Corner Filling
        if (up && right)
          content.push(
            <rect
              key="corn-tr"
              x={50}
              y={0}
              width={50}
              height={50}
              fill={strokeColor}
            />
          );
        if (right && down)
          content.push(
            <rect
              key="corn-br"
              x={50}
              y={50}
              width={50}
              height={50}
              fill={strokeColor}
            />
          );
        if (down && left)
          content.push(
            <rect
              key="corn-bl"
              x={0}
              y={50}
              width={50}
              height={50}
              fill={strokeColor}
            />
          );
        if (left && up)
          content.push(
            <rect
              key="corn-tl"
              x={0}
              y={0}
              width={50}
              height={50}
              fill={strokeColor}
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
      } else if (effectiveType === "road_straight_vertical") {
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
      } else if (effectiveType === "road_straight_horizontal") {
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

  // 7. Render TRAFFIC LIGHT OVERLAY
  if (cellData?.hasTrafficLight || cellData?.type === "traffic_light") {
    content.push(
      <React.Fragment key="traffic_light_overlay">
        {renderTrafficLight(cellData.lightState || cellData.state)}
      </React.Fragment>
    );
  }

  // 8. Render STOP MARKER (Subtle)
  if (stopMarker) {
    content.push(
      <React.Fragment key="stop_marker">
        {renderStopLine(stopMarker.side)}
      </React.Fragment>
    );
  }

  // 9. Draw Car
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
