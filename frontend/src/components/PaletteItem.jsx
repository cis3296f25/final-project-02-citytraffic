/**
 * FILE PURPOSE:
 * Renders a single tool or item card in the sidebar palette.
 *
 * CONTENTS:
 * - PaletteItem: A draggable, clickable card that displays an emoji, a label, and handles selection state.
 *
 * PROPS:
 * - item: Object containing { type, label, emoji, color }.
 * - isSelected: Boolean to toggle the active styling (blue ring).
 * - onClick: Function to handle tool selection.
 *
 * DEPENDENCIES:
 * - None (Pure presentation component).
 */

import React from "react";

const PaletteItem = ({ item, isSelected, onClick }) => {
  // Enables Drag-and-Drop functionality for the grid
  const handleDragStart = (e) => {
    e.dataTransfer.setData("itemType", item.type);
  };

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
      {/* Background Gradient Glow */}
      <div
        className={`absolute inset-2 rounded-xl opacity-20 bg-gradient-to-br ${item.color}`}
      ></div>

      {/* Emoji Icon */}
      <span className="text-3xl z-10 drop-shadow-sm filter">{item.emoji}</span>

      {/* Label Text */}
      <span className="text-[10px] font-medium text-slate-400 mt-2 z-10 uppercase tracking-wide group-hover:text-slate-200 transition-colors">
        {item.label}
      </span>
    </div>
  );
};

export default PaletteItem;
