/**
 * FILE PURPOSE:
 * Renders a single tool or item card in the sidebar palette.
 */

import React from "react";

const PaletteItem = ({ item, isSelected, onClick, theme = "dark" }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("itemType", item.type);
  };

  const isDark = theme === "dark";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`relative group aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 border ${
        isSelected
          ? isDark
            ? "bg-slate-700 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 border-transparent"
            : "bg-blue-50 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 border-transparent"
          : isDark
          ? "bg-slate-800 hover:bg-slate-700 border-slate-700"
          : "bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
      }`}
    >
      <div
        className={`absolute inset-2 rounded-xl opacity-20 bg-gradient-to-br ${item.color}`}
      ></div>
      <span className="text-3xl z-10 drop-shadow-sm filter">{item.emoji}</span>
      <span
        className={`text-[10px] font-medium mt-2 z-10 uppercase tracking-wide transition-colors ${
          isSelected
            ? isDark
              ? "text-white"
              : "text-blue-700"
            : isDark
            ? "text-slate-400 group-hover:text-slate-200"
            : "text-slate-500 group-hover:text-slate-700"
        }`}
      >
        {item.label}
      </span>
    </div>
  );
};

export default PaletteItem;
