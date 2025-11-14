import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  //
  // GitHub Pages base path
  //
  // Replace this with your repo name
  base: "/final-project-02-citytraffic/",

  //
  // Vitest configuration for testing + coverage
  //
  test: {
    environment: "jsdom",       // Use a DOM-like environment
    globals: true,              // Enable global test/expect functions
    setupFiles: "./frontend/test/setupTests.js", // Setup file for jest-dom, etc.
    coverage: {
      provider: "v8",           // Fast built-in coverage
      reporter: ["text", "html"], // Text in terminal + HTML report
      reportsDirectory: "coverage" // Output folder for coverage report
    }
  }
});