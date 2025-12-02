/**
 * FILE PURPOSE:
 * Stores global constants, configuration settings, and palette definitions used across the app.
 *
 * CONTENTS:
 * - Grid Dimensions: Defines the pixel size of the game board.
 * - Palette Arrays: Defines the tools available in the sidebar (Main, Roads, Decorations, etc.).
 *
 * DEPENDENCIES:
 * - None.
 */

// --- Grid Configuration ---
export const TOTAL_GRID_WIDTH_PX = 19 * 64; // 1216px
export const TOTAL_GRID_HEIGHT_PX = 12 * 64; // 768px

// --- Palette Definitions ---

export const MAIN_PALETTE_ITEMS = [
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
    type: "random_menu",
    label: "Randomize",
    emoji: "🎲",
    color: "from-violet-500 to-fuchsia-400",
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

export const ROAD_PALETTE_ITEMS = [
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
  // --- MULTI-LANE ROADS ---
  {
    type: "road_multilane_vertical",
    label: "Multi-Lane Vert",
    emoji: "║",
    color: "from-slate-600 to-slate-500",
  },
  {
    type: "road_multilane_horizontal",
    label: "Multi-Lane Horz",
    emoji: "═",
    color: "from-slate-600 to-slate-500",
  },
  // --- DIVIDER ROADS ---
  {
    type: "road_divider_vertical",
    label: "Divider Vert",
    emoji: " ⎸",
    color: "from-yellow-600 to-yellow-500",
  },
  {
    type: "road_divider_horizontal",
    label: "Divider Horz",
    emoji: "―",
    color: "from-yellow-600 to-yellow-500",
  },
];

export const DECORATION_PALETTE_ITEMS = [
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

export const RANDOM_PALETTE_ITEMS = [
  {
    type: "populate_cars",
    label: "Populate Now",
    emoji: "✨",
    color: "from-violet-500 to-indigo-500",
  },
  {
    type: "toggle_autospawn",
    label: "Auto Spawn",
    emoji: "🔄",
    color: "from-fuchsia-500 to-pink-500",
  },
];
