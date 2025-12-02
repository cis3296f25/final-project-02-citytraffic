/**
 * FILE: src/constants.js
 */

// --- Grid Configuration ---
export const BASE_GRID_WIDTH_PX = 19 * 64; // 1216px
export const BASE_GRID_HEIGHT_PX = 12 * 64; // 768px
export const ASPECT_RATIO = BASE_GRID_WIDTH_PX / BASE_GRID_HEIGHT_PX;

// --- EXPORT ALIASES (Required to fix your error) ---
export const TOTAL_GRID_WIDTH_PX = BASE_GRID_WIDTH_PX;
export const TOTAL_GRID_HEIGHT_PX = BASE_GRID_HEIGHT_PX;

// --- Theme Configuration ---
export const THEMES = {
  dark: {
    bgApp: "bg-slate-950",
    textMain: "text-slate-200",
    textDim: "text-slate-400",
    panelBg: "bg-slate-900",
    panelBorder: "border-slate-800",
    gridBg: "bg-slate-100/50",
    gridPattern: "radial-gradient(#cbd5e1 1px, transparent 1px)",
    sidebarBg: "bg-slate-900/95",
  },
  light: {
    bgApp: "bg-slate-100",
    textMain: "text-slate-800",
    textDim: "text-slate-500",
    panelBg: "bg-white",
    panelBorder: "border-slate-200",
    gridBg: "bg-white/80",
    gridPattern: "radial-gradient(#94a3b8 1px, transparent 1px)",
    sidebarBg: "bg-white/95",
  },
};

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
    emoji: "⎸",
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
