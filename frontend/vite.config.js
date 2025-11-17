import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // GitHub Pages base path
  base: process.env.NODE_ENV === 'production' 
    ? "/final-project-02-citytraffic/" 
    : "/",

  // Development server configuration
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    port: 5173,
    host: true, // Listen on all addresses
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  // Preview configuration (for testing the build locally)
  preview: {
    port: 4173,
    host: true,
  },

  // Vitest configuration for testing + coverage
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