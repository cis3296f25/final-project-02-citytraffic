import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";

// --- MOCKS ---

// 1. Mock Firebase Auth
// We define the mock function *outside* so we can control it in tests
const mockOnAuthStateChanged = vi.fn();

vi.mock("./firebase", () => ({
  auth: {},
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (auth, callback) =>
    mockOnAuthStateChanged(auth, callback),
}));

// 2. Mock Child Components
vi.mock("./components/Grid", () => ({
  Grid: ({ onPaint, onRightClick }) => (
    <div
      data-testid="mock-grid"
      onClick={() => onPaint(0, 0)}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick(0, 0);
      }}
    >
      Mock Grid
    </div>
  ),
}));

vi.mock("./components/PaletteItem", () => ({
  default: (props) => (
    <button
      data-testid={`palette-item-${props.item.type}`}
      onClick={props.onClick}
    >
      {props.item.label}
    </button>
  ),
}));

vi.mock("./components/LoginScreen", () => ({
  default: () => <div data-testid="login-screen">Login Screen</div>,
}));

vi.mock("./components/Modals", () => ({
  UserProfileModal: ({ onClose }) => (
    <div data-testid="user-profile-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
  SaveLoadModal: ({ mode, onClose }) => (
    <div data-testid={`save-load-modal-${mode}`}>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// 3. Mock Constants
vi.mock("./constants", () => ({
  MAIN_PALETTE_ITEMS: [
    { type: "select", label: "Select" },
    { type: "road_menu", label: "Roads" },
  ],
  ROAD_PALETTE_ITEMS: [{ type: "road_straight", label: "Straight" }],
  DECORATION_PALETTE_ITEMS: [],
  RANDOM_PALETTE_ITEMS: [],
  THEMES: {
    dark: { bgApp: "bg-dark", textMain: "text-white" },
    light: { bgApp: "bg-light", textMain: "text-black" },
  },
}));

// --- TESTS ---

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: Simulate Auth LOADING state (callback never fires immediately)
    // The test logic will manually fire it
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Return unsubscribe function
      return vi.fn();
    });
  });

  test("renders loading state initially", () => {
    render(<App />);
    expect(screen.getByText(/Loading Authentication/i)).toBeInTheDocument();
  });

  test("renders LoginScreen when user is null", async () => {
    let capturedCallback;

    // Setup the mock to capture the callback
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      capturedCallback = callback;
      return vi.fn();
    });

    render(<App />);

    // Simulate auth check finishing with no user
    act(() => {
      if (capturedCallback) capturedCallback(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    });
  });

  test("renders Main App when user is authenticated", async () => {
    let capturedCallback;
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      capturedCallback = callback;
      return vi.fn();
    });

    render(<App />);

    // Simulate auth check finishing WITH a user
    act(() => {
      if (capturedCallback)
        capturedCallback({ uid: "123", email: "test@example.com" });
    });

    await waitFor(() => {
      expect(screen.getByText(/City/i)).toBeInTheDocument();
      expect(screen.getByTestId("mock-grid")).toBeInTheDocument();
    });
  });

  // --- INTEGRATION TESTS (Authenticated) ---
  describe("Authenticated Interactions", () => {
    // Helper to render app in authenticated state
    const renderAuthenticatedApp = async () => {
      let capturedCallback;
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        capturedCallback = callback;
        return vi.fn();
      });

      render(<App />);

      act(() => {
        if (capturedCallback)
          capturedCallback({ uid: "123", email: "test@example.com" });
      });

      await waitFor(() => screen.getByTestId("mock-grid"));
    };

    test("toggles sidebar on menu click", async () => {
      await renderAuthenticatedApp();
      const closeBtn = screen.getByTitle("Close Menu");
      fireEvent.click(closeBtn);
      expect(screen.getByTitle("Close Menu")).toBeInTheDocument();
    });

    test("changes tools when palette item is clicked", async () => {
      await renderAuthenticatedApp();
      const roadBtn = screen.getByTestId("palette-item-road_menu");
      fireEvent.click(roadBtn);
      expect(
        screen.getByTestId("palette-item-road_straight")
      ).toBeInTheDocument();
    });

    test("updates grid when clicking on grid cells", async () => {
      await renderAuthenticatedApp();
      const grid = screen.getByTestId("mock-grid");
      fireEvent.click(grid);
      expect(grid).toBeInTheDocument();
    });

    test("toggles Play/Pause state", async () => {
      await renderAuthenticatedApp();
      const startBtn = screen.getByText(/Start/i);
      fireEvent.click(startBtn);
      expect(screen.getByText(/Pause/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/Pause/i));
      expect(screen.getByText(/Start/i)).toBeInTheDocument();
    });

    test("opens Save modal", async () => {
      await renderAuthenticatedApp();
      const saveBtn = screen.getByTitle("Save Layout");
      fireEvent.click(saveBtn);
      expect(screen.getByTestId("save-load-modal-save")).toBeInTheDocument();
    });

    test("opens Load modal", async () => {
      await renderAuthenticatedApp();
      const loadBtn = screen.getByTitle("Load Layout");
      fireEvent.click(loadBtn);
      expect(screen.getByTestId("save-load-modal-load")).toBeInTheDocument();
    });

    test("opens User Profile modal", async () => {
      await renderAuthenticatedApp();
      const profileBtn = screen.getByTitle("User Settings");
      fireEvent.click(profileBtn);
      expect(screen.getByTestId("user-profile-modal")).toBeInTheDocument();
    });

    test("undo/redo buttons exist and are interactive", async () => {
      await renderAuthenticatedApp();
      const undoBtn = screen.getByTitle("Undo");
      const redoBtn = screen.getByTitle("Redo");
      expect(undoBtn).toBeInTheDocument();
      expect(redoBtn).toBeInTheDocument();
      expect(undoBtn).toBeDisabled();
      expect(redoBtn).toBeDisabled();
    });
  });
});
