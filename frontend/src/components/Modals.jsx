/**
 * FILE PURPOSE:
 * Contains the overlay modal components for the application.
 *
 * CONTENTS:
 * - UserProfileModal: Handles user account management (Email update, Password reset, Logout).
 * - SaveLoadModal: Handles CRUD operations for city layouts using Firebase Firestore.
 *
 * DEPENDENCIES:
 * - Firebase Firestore (for saving/loading grids)
 * - Firebase Auth (for user management)
 * - ./Icons (for UI elements)
 */

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Adjust path if firebase.js is elsewhere
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

// --- User Profile Modal (With Logout) ---
export const UserProfileModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: null });

  useEffect(() => {
    setStatus({ type: null, message: null });
    setNewEmail("");
    setCurrentPassword("");
  }, [activeTab]);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: null });
    setIsLoading(true);

    if (!newEmail || !currentPassword) {
      setStatus({ type: "error", message: "Email and password required." });
      setIsLoading(false);
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await verifyBeforeUpdateEmail(user, newEmail);

      setStatus({
        type: "success",
        message: `Verification sent to ${newEmail}. Check your inbox!`,
      });
      setNewEmail("");
      setCurrentPassword("");
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        message: "Failed to update. Check password.",
      });
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async () => {
    setStatus({ type: null, message: null });
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setStatus({
        type: "success",
        message: `Reset link sent to ${user.email}`,
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Failed to send email." });
    }
    setIsLoading(false);
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
              <UserIcon />
            </div>
            Account Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "profile"
                ? "text-blue-400 bg-slate-800/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            Profile
            {activeTab === "profile" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "security"
                ? "text-blue-400 bg-slate-800/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            Security
            {activeTab === "security" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar min-h-[300px]">
          {status.message && (
            <div
              className={`mb-6 p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                status.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              <span>{status.type === "success" ? "✅" : "⚠️"}</span>
              {status.message}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {user.email ? user.email[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold truncate text-sm">
                    {user.email}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] mt-0.5">
                    ID: {user.uid}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-950 rounded text-lg">📧</div>
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      Update Email
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Confirmation sent to new address.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleUpdateEmail} className="space-y-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New Email Address"
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Verify Current Password"
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-lg shadow-blue-900/20"
                  >
                    {isLoading ? "Sending..." : "Send Verification Link"}
                  </button>
                </form>
              </div>

              {/* LOGOUT BUTTON */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-950 rounded text-lg">🔒</div>
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      Reset Password
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Link sent to {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                  className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded-lg font-medium text-xs transition-all"
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

// --- Save/Load Modal (Nested Subcollection Version) ---
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
}) => {
  const [saveName, setSaveName] = useState("");
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (mode === "load") fetchLayouts();
  }, [mode]);

  // FETCH (GET) - From User Subcollection
  const fetchLayouts = async () => {
    setLoading(true);
    try {
      // PATH: users -> UID -> layouts
      const userLayoutsRef = collection(db, "users", user.uid, "layouts");
      const querySnapshot = await getDocs(userLayoutsRef);

      const loadedLayouts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLayouts(loadedLayouts);
    } catch (e) {
      console.error(e);
      setMessage("Error connecting to Firebase.");
    }
    setLoading(false);
  };

  // SAVE AS NEW (POST) - To User Subcollection
  const handleSaveNew = async () => {
    if (!saveName.trim()) return;

    const serializedGrid = JSON.stringify(grid);

    try {
      // PATH: users -> UID -> layouts
      const userLayoutsRef = collection(db, "users", user.uid, "layouts");

      const docRef = await addDoc(userLayoutsRef, {
        name: saveName,
        description: "",
        rows,
        cols,
        grid_data: serializedGrid,
        created_at: new Date().toISOString(),
      });

      setCurrentLayoutId(docRef.id);
      onClose();
      alert("Saved as new layout!");
    } catch (e) {
      console.error("Firebase Error Details:", e);
      setMessage("Error saving to Firebase.");
    }
  };

  // OVERWRITE (PUT) - Specific Doc in User Subcollection
  const handleOverwrite = async () => {
    if (!currentLayoutId) return;

    const serializedGrid = JSON.stringify(grid);

    try {
      // PATH: users -> UID -> layouts -> LayoutID
      const layoutRef = doc(db, "users", user.uid, "layouts", currentLayoutId);

      await updateDoc(layoutRef, {
        rows,
        cols,
        grid_data: serializedGrid,
        updated_at: new Date().toISOString(),
      });

      onClose();
      alert("Layout overwritten successfully!");
    } catch (e) {
      console.error(e);
      setMessage("Overwrite failed.");
    }
  };

  // DELETE (DELETE) - Specific Doc in User Subcollection
  const handleDelete = async (id) => {
    if (!confirm("Delete this layout?")) return;
    try {
      // PATH: users -> UID -> layouts -> LayoutID
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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
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
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {message && (
            <div className="mb-4 p-2 bg-red-900/30 border border-red-500/30 text-red-300 rounded text-sm text-center">
              {message}
            </div>
          )}

          {mode === "save" ? (
            <div className="space-y-6">
              {/* Option 1: Overwrite */}
              {currentLayoutId && (
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                  <div className="text-xs font-bold text-emerald-400 uppercase mb-2">
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
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold">
                  <div className="h-px bg-slate-700 flex-1"></div>
                  OR
                  <div className="h-px bg-slate-700 flex-1"></div>
                </div>
              )}

              {/* Option 2: Save As New */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  {currentLayoutId ? "Save as New Layout" : "Layout Name"}
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My New City"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                  autoFocus={!currentLayoutId}
                />
                <button
                  onClick={handleSaveNew}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                  {currentLayoutId ? "Save Copy" : "Save Layout"}
                </button>
              </div>
            </div>
          ) : (
            // LOAD MODE
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-slate-500 py-4">
                  Loading...
                </div>
              ) : layouts.length === 0 ? (
                <div className="text-center text-slate-500 py-4">
                  No saved layouts found.
                </div>
              ) : (
                layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={`group flex justify-between items-center p-3 rounded-lg border transition-all ${
                      currentLayoutId === layout.id
                        ? "bg-blue-900/20 border-blue-500/50"
                        : "bg-slate-800 border-slate-700 hover:border-blue-500/50 hover:bg-slate-750"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 truncate">
                        {layout.name}
                        {currentLayoutId === layout.id && (
                          <span className="ml-2 text-[10px] text-blue-400 uppercase tracking-wider">
                            (Active)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
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
                        className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors"
                        title="Load"
                      >
                        <LoadIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(layout.id)}
                        className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors"
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
