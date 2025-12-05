/**
 * FILE PURPOSE:
 * Handles the initial authentication UI for the application.
 *
 * CONTENTS:
 * - LoginScreen: A form that toggles between "Sign In" and "Sign Up" modes.
 *
 * DEPENDENCIES:
 * - Firebase Auth (signInWithEmailAndPassword, createUserWithEmailAndPassword)
 * - ../firebase (The initialized auth instance)
 *
 * POTENTIAL NEW FEATURES:
 * - Google/GitHub Sign-In buttons.
 * - "Forgot Password" link (currently only available inside the app profile settings).
 */

import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase"; // Adjust path if your firebase.js is elsewhere

const LoginScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Auth listener in App.jsx will detect the change and unmount this screen
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Authentication failed. Try again.");
      }
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 items-center justify-center font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl mx-auto flex items-center justify-center text-4xl shadow-lg shadow-blue-500/20 mb-6">
          🏗️
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          CityBuilder<span className="text-blue-400 font-light">Pro</span>
        </h1>
        <p className="text-slate-400 mb-8">
          {isRegistering
            ? "Create an account to save cities."
            : "Sign in to load your layouts."}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 mt-2"
          >
            {isRegistering ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-400 text-sm">
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isRegistering ? "Log In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
