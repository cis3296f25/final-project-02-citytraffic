/**
 * FILE PURPOSE:
 * Contains the overlay modal components for the application.
 */

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  signOut,
  verifyBeforeUpdateEmail,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { UserIcon, XIcon, SaveIcon, LoadIcon, TrashIcon } from "./Icons";

// --- User Profile Modal (With Settings) ---
export const UserProfileModal = ({
  user,
  onClose,
  theme = "dark",
  setTheme,
  gridMultiplier = 1,
  onResizeGrid,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: null });

  // Reset inputs when switching tabs
  useEffect(() => {
    setStatus({ type: null, message: null });
    setNewEmail("");
    setCurrentPassword("");
  }, [activeTab]);

  // Helper for conditional classes
  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-slate-900" : "bg-white";
  const borderClass = isDark ? "border-slate-700" : "border-slate-200";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const textDimClass = isDark ? "text-slate-400" : "text-slate-500";
  const inputBgClass = isDark ? "bg-slate-950" : "bg-slate-50";

  // ... (Keep Handlers) ...
  const handleUpdateEmail = async (e) => {
    /* ... */
  };
  const handlePasswordReset = async () => {
    /* ... */
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className={`border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300 ${bgClass} ${borderClass}`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex justify-between items-center ${
            isDark
              ? "border-slate-800 bg-slate-800/50"
              : "border-slate-100 bg-slate-50"
          }`}
        >
          <h2
            className={`text-lg font-bold flex items-center gap-2 ${textClass}`}
          >
            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-500">
              <UserIcon />
            </div>
            Settings & Account
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <XIcon />
          </button>
        </div>

        {/* Tabs - FIXED INACTIVE STATE */}
        <div
          className={`flex border-b ${
            isDark ? "border-slate-800" : "border-slate-100"
          }`}
        >
          {["profile", "settings", "security"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative capitalize ${
                activeTab === tab
                  ? "text-blue-500 bg-blue-500/5"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar min-h-[300px]">
          {status.message && (
            <div
              className={`mb-6 p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                status.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              <span>{status.type === "success" ? "✅" : "⚠️"}</span>
              {status.message}
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fadeIn">
              <div
                className={`flex items-center gap-4 p-4 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {user.email ? user.email[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <div className={`font-bold truncate text-sm ${textClass}`}>
                    {user.email}
                  </div>
                  <div
                    className={`text-[10px] font-mono truncate max-w-[200px] mt-0.5 ${textDimClass}`}
                  >
                    ID: {user.uid}
                  </div>
                </div>
              </div>

              <div
                className={`p-5 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded text-lg ${
                      isDark ? "bg-slate-950" : "bg-slate-100"
                    }`}
                  >
                    📧
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${textClass}`}>
                      Update Email
                    </h3>
                    <p className={`text-[10px] ${textDimClass}`}>
                      Confirmation required.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleUpdateEmail} className="space-y-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New Email Address"
                    className={`w-full border rounded-lg p-2.5 text-sm placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none ${inputBgClass} ${borderClass} ${textClass}`}
                  />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className={`w-full border rounded-lg p-2.5 text-sm placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none ${inputBgClass} ${borderClass} ${textClass}`}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-lg shadow-blue-500/20"
                  >
                    {isLoading ? "Sending..." : "Send Verification Link"}
                  </button>
                </form>
              </div>

              <div
                className={`pt-2 border-t ${
                  isDark ? "border-slate-800" : "border-slate-200"
                }`}
              >
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fadeIn">
              <div
                className={`p-5 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`p-2 rounded text-lg ${
                      isDark ? "bg-slate-950" : "bg-slate-100"
                    }`}
                  >
                    🎨
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${textClass}`}>
                      Visual Theme
                    </h3>
                    <p className={`text-[10px] ${textDimClass}`}>
                      Toggle between light and dark mode.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex gap-2 p-1 rounded-lg ${
                    isDark ? "bg-slate-950" : "bg-slate-100"
                  }`}
                >
                  <button
                    onClick={() => setTheme && setTheme("light")}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                      theme === "light"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-500"
                    }`}
                  >
                    ☀️ Light
                  </button>
                  <button
                    onClick={() => setTheme && setTheme("dark")}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                      theme === "dark"
                        ? "bg-slate-700 text-blue-400 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>

              <div
                className={`p-5 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`p-2 rounded text-lg ${
                      isDark ? "bg-slate-950" : "bg-slate-100"
                    }`}
                  >
                    🏗️
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${textClass}`}>
                      Grid Size
                    </h3>
                    <p className={`text-[10px] ${textDimClass}`}>
                      Change the number of tiles (Resolution).
                      <br />
                      <span className="text-orange-500">
                        Note: Reducing size crops the grid.
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono ${textDimClass}`}>
                    Small
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.25"
                    value={gridMultiplier}
                    onChange={(e) =>
                      onResizeGrid && onResizeGrid(parseFloat(e.target.value))
                    }
                    className={`flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-blue-500 ${
                      isDark ? "bg-slate-600" : "bg-slate-300"
                    }`}
                  />
                  <span className={`text-xs font-mono ${textDimClass}`}>
                    Large
                  </span>
                </div>
                <div
                  className={`text-center mt-2 text-xs font-mono font-bold ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {Math.round(16 * gridMultiplier)} x{" "}
                  {Math.round(25 * gridMultiplier)} Tiles
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-fadeIn">
              <div
                className={`p-5 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded text-lg ${
                      isDark ? "bg-slate-950" : "bg-slate-100"
                    }`}
                  >
                    🔒
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${textClass}`}>
                      Reset Password
                    </h3>
                    <p className={`text-[10px] mt-1 ${textDimClass}`}>
                      Link sent to {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                  className={`mt-4 w-full py-2 border rounded-lg font-medium text-xs transition-all ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {isLoading ? "Sending..." : "Send Password Reset Email"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SaveLoadModal (Kept for completeness) ---
export const SaveLoadModal = ({
  mode,
  onClose,
  grid,
  rows,
  cols,
  onLoadLayout,
  currentLayoutId,
  setCurrentLayoutId,
  user,
  theme = "dark",
}) => {
  const [saveName, setSaveName] = useState("");
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (mode === "load") fetchLayouts();
  }, [mode]);

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-slate-900" : "bg-white";
  const borderClass = isDark ? "border-slate-700" : "border-slate-200";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const textDimClass = isDark ? "text-slate-400" : "text-slate-500";
  const inputBgClass = isDark ? "bg-slate-800" : "bg-slate-50";

  const fetchLayouts = async () => {
    setLoading(true);
    try {
      const userLayoutsRef = collection(db, "users", user.uid, "layouts");
      const querySnapshot = await getDocs(userLayoutsRef);
      setLayouts(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (e) {
      console.error(e);
      setMessage("Error connecting to Firebase.");
    }
    setLoading(false);
  };

  const handleSaveNew = async () => {
    if (!saveName.trim()) return;
    try {
      const userLayoutsRef = collection(db, "users", user.uid, "layouts");
      await addDoc(userLayoutsRef, {
        name: saveName,
        rows,
        cols,
        grid_data: JSON.stringify(grid),
        created_at: new Date().toISOString(),
      });
      onClose();
      alert("Saved as new layout!");
    } catch (e) {
      console.error(e);
      setMessage("Error saving to Firebase.");
    }
  };

  const handleOverwrite = async () => {
    if (!currentLayoutId) return;
    try {
      const layoutRef = doc(db, "users", user.uid, "layouts", currentLayoutId);
      await updateDoc(layoutRef, {
        rows,
        cols,
        grid_data: JSON.stringify(grid),
        updated_at: new Date().toISOString(),
      });
      onClose();
      alert("Layout overwritten successfully!");
    } catch (e) {
      console.error(e);
      setMessage("Overwrite failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this layout?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "layouts", id));
      setLayouts((prev) => prev.filter((l) => l.id !== id));
      if (id === currentLayoutId) setCurrentLayoutId(null);
    } catch (e) {
      console.error(e);
      setMessage("Delete failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className={`border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] transition-colors duration-300 ${bgClass} ${borderClass}`}
      >
        <div
          className={`p-4 border-b flex justify-between items-center ${
            isDark
              ? "border-slate-800 bg-slate-800/50"
              : "border-slate-100 bg-slate-50"
          }`}
        >
          <h2
            className={`text-lg font-bold flex items-center gap-2 ${textClass}`}
          >
            {mode === "save" ? (
              <>
                <SaveIcon /> Save Layout
              </>
            ) : (
              <>
                <LoadIcon /> Load Layout
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors ${
              isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <XIcon />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {message && (
            <div className="mb-4 p-2 bg-red-900/30 border border-red-500/30 text-red-300 rounded text-sm text-center">
              {message}
            </div>
          )}
          {mode === "save" ? (
            <div className="space-y-6">
              {currentLayoutId && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="text-xs font-bold text-emerald-500 uppercase mb-2">
                    Current Layout Loaded
                  </div>
                  <button
                    onClick={handleOverwrite}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2"
                  >
                    <SaveIcon /> Overwrite Save
                  </button>
                </div>
              )}
              {currentLayoutId && (
                <div
                  className={`flex items-center gap-2 text-xs uppercase font-bold ${textDimClass}`}
                >
                  <div
                    className={`h-px flex-1 ${
                      isDark ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  ></div>
                  OR
                  <div
                    className={`h-px flex-1 ${
                      isDark ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  ></div>
                </div>
              )}
              <div>
                <label
                  className={`block text-xs font-bold uppercase mb-1 ${textDimClass}`}
                >
                  {currentLayoutId ? "Save as New Layout" : "Layout Name"}
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My New City"
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none mb-3 ${inputBgClass} ${borderClass} ${textClass}`}
                  autoFocus={!currentLayoutId}
                />
                <button
                  onClick={handleSaveNew}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  {currentLayoutId ? "Save Copy" : "Save Layout"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <div className={`text-center py-4 ${textDimClass}`}>
                  Loading...
                </div>
              ) : layouts.length === 0 ? (
                <div className={`text-center py-4 ${textDimClass}`}>
                  No saved layouts found.
                </div>
              ) : (
                layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={`group flex justify-between items-center p-3 rounded-lg border transition-all ${
                      currentLayoutId === layout.id
                        ? "bg-blue-500/10 border-blue-500/50"
                        : isDark
                        ? "bg-slate-800 border-slate-700 hover:border-blue-500/50 hover:bg-slate-750"
                        : "bg-white border-slate-200 hover:border-blue-500/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`font-bold truncate ${textClass}`}>
                        {layout.name}
                        {currentLayoutId === layout.id && (
                          <span className="ml-2 text-[10px] text-blue-500 uppercase tracking-wider">
                            (Active)
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] ${textDimClass}`}>
                        {layout.created_at
                          ? new Date(layout.created_at).toLocaleDateString()
                          : "Unknown Date"}{" "}
                        • {layout.rows}x{layout.cols}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          onLoadLayout(
                            layout.grid_data,
                            layout.rows,
                            layout.cols,
                            layout.id
                          );
                          onClose();
                        }}
                        className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded transition-colors"
                        title="Load"
                      >
                        <LoadIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(layout.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded transition-colors"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
