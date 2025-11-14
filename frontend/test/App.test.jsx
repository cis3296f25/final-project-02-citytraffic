// src/App.test.jsx
import { test, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

test("renders City Builder title", () => {
  render(<App />);
  const titleElement = screen.getByText(/City Builder/i);
  expect(titleElement).toBeInTheDocument();
});
