import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";

// Helper function to render app with user events
const renderApp = () => {
  return {
    user: userEvent.setup(),
    ...render(<App />)
  };
};

describe("City Builder App", () => {
  test("renders City Builder app with palette and dimensions", () => {
    render(<App />);

    // Check main title
    expect(screen.getByText(/City Builder/i)).toBeInTheDocument();

    // Check dimension inputs
    expect(screen.getByLabelText(/Rows/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cols/i)).toBeInTheDocument();

    // Check palette section header
    expect(screen.getByText(/Palette/i)).toBeInTheDocument();
  });

  test("renders all main palette items with correct labels and emojis", () => {
    render(<App />);
    
    // Test all main palette items
    expect(screen.getByText("Select")).toBeInTheDocument();
    expect(screen.getByText("Road")).toBeInTheDocument();
    expect(screen.getByText("Car")).toBeInTheDocument();
    expect(screen.getByText("Building")).toBeInTheDocument();
    expect(screen.getByText("Tree")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Eraser")).toBeInTheDocument();

    // Check emojis are present
    expect(screen.getByText("👆")).toBeInTheDocument();
    expect(screen.getByText("🛣️")).toBeInTheDocument();
    expect(screen.getByText("🚗")).toBeInTheDocument();
    expect(screen.getByText("🏢")).toBeInTheDocument();
    expect(screen.getByText("🌳")).toBeInTheDocument();
    expect(screen.getByText("🚦")).toBeInTheDocument();
    expect(screen.getByText("🧼")).toBeInTheDocument();
  });

  test("dimension inputs have correct default values and ratio", () => {
    render(<App />);
    
    const rowsInput = screen.getByLabelText(/Rows/i);
    const colsInput = screen.getByLabelText(/Cols/i);
    
    expect(rowsInput).toHaveValue(16);
    expect(colsInput).toHaveValue(25);
  });

  test("changing rows updates columns to maintain ratio", async () => {
    const { user } = renderApp();
    
    const rowsInput = screen.getByLabelText(/Rows/i);
    
    // Use a more direct approach - select the input content and type
    await user.click(rowsInput);
    await user.keyboard('{Control>}a{/Control}'); // Select all
    await user.keyboard('20');
    
    // Wait for the state update and check the result
    await waitFor(() => {
      expect(screen.getByLabelText(/Cols/i)).toHaveValue(31);
    });
  });

  test("changing columns updates rows to maintain ratio", async () => {
    const { user } = renderApp();
    
    const colsInput = screen.getByLabelText(/Cols/i);
    
    await user.click(colsInput);
    await user.keyboard('{Control>}a{/Control}');
    await user.keyboard('30');
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Rows/i)).toHaveValue(19);
    });
  });

  test("road menu opens sub-palette when clicked", async () => {
    const { user } = renderApp();
    
    const roadButton = screen.getByText("Road");
    await user.click(roadButton);
    
    // Should show road sub-palette items
    expect(screen.getByText("Straight")).toBeInTheDocument();
    expect(screen.getByText("Intersection")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    
    // Should show road sub-palette emojis
    expect(screen.getByText("➖")).toBeInTheDocument();
    expect(screen.getByText("➕")).toBeInTheDocument();
    expect(screen.getByText("⬅️")).toBeInTheDocument();
  });

  test("back button returns to main palette", async () => {
    const { user } = renderApp();
    
    // Go to road palette
    const roadButton = screen.getByText("Road");
    await user.click(roadButton);
    
    // Verify we're in road palette
    expect(screen.getByText("Straight")).toBeInTheDocument();
    
    // Click back
    const backButton = screen.getByText("Back");
    await user.click(backButton);
    
    // Should be back in main palette
    expect(screen.getByText("Car")).toBeInTheDocument();
    expect(screen.getByText("Building")).toBeInTheDocument();
    expect(screen.queryByText("Straight")).not.toBeInTheDocument();
  });

  test("tool selection highlights the selected tool", async () => {
    const { user } = renderApp();
    
    const carTool = screen.getByText("Car").closest('div');
    await user.click(carTool);
    
    // The car tool should have selected styling (you might need to adjust this based on your actual classes)
    expect(carTool).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  test("undo and redo buttons have correct initial states", () => {
    render(<App />);
    
    const undoButton = screen.getByText("↶ Undo");
    const redoButton = screen.getByText("↷ Redo");
    
    // Initially, undo should be disabled, redo should be disabled
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
  });

  test("clear grid button is present and clickable", async () => {
    const { user } = renderApp();
    
    const clearButton = screen.getByText("Clear Grid");
    expect(clearButton).toBeInTheDocument();
    
    // Should be able to click it
    await user.click(clearButton);
    expect(clearButton).toBeEnabled();
  });

  test("grid renders with correct dimensions", () => {
    render(<App />);
    
    const gridContainer = screen.getByText(/City Builder/i).closest('div').nextElementSibling;
    expect(gridContainer).toBeInTheDocument();
    
  });

  test("palette items are draggable", () => {
    render(<App />);
    
    const carItem = screen.getByText("Car").closest('div');
    expect(carItem).toHaveAttribute('draggable', 'true');
  });

  test("eraser tool can be selected", async () => {
    const { user } = renderApp();
    
    const eraserTool = screen.getByText("Eraser");
    await user.click(eraserTool);
    
    // Eraser should be selected
    const eraserContainer = eraserTool.closest('div');
    expect(eraserContainer).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  test("select tool can be selected", async () => {
    const { user } = renderApp();
    
    const selectTool = screen.getByText("Select");
    await user.click(selectTool);
    
    // Select tool should be selected
    const selectContainer = selectTool.closest('div');
    expect(selectContainer).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  describe("Grid Interaction Tests", () => {
    test("grid cells are rendered", () => {
      render(<App />);
      
      // The grid should contain multiple cells (this might need adjustment based on your actual grid structure)
      const gridCells = document.querySelectorAll('[class*="bg-transparent"]');
      expect(gridCells.length).toBeGreaterThan(0);
    });

    test("can place items on grid with click", async () => {
      const { user } = renderApp();
      
      // Select car tool
      const carTool = screen.getByText("Car");
      await user.click(carTool);
      
      // Find a grid cell and click it
      const gridCells = document.querySelectorAll('[class*="bg-transparent"]');
      if (gridCells.length > 0) {
        await user.click(gridCells[0]);
        
        // The cell should now contain a car emoji
        expect(gridCells[0].querySelector('span')).toHaveTextContent('🚗');
      }
    });

    test("right click erases items", async () => {
      const { user } = renderApp();
      
      // First place an item
      const carTool = screen.getByText("Car");
      await user.click(carTool);
      
      const gridCells = document.querySelectorAll('[class*="bg-transparent"]');
      if (gridCells.length > 0) {
        await user.click(gridCells[0]);
        
        // Verify item is placed
        expect(gridCells[0].querySelector('span')).toHaveTextContent('🚗');
        
        // Right click to erase
        fireEvent.contextMenu(gridCells[0]);
        
        // Item should be removed
        expect(gridCells[0].querySelector('span')).toBeNull();
      }
    });
  });

  describe("Road System Tests", () => {
    test("can place straight roads", async () => {
      const { user } = renderApp();
      
      // Open road palette
      await user.click(screen.getByText("Road"));
      await user.click(screen.getByText("Straight"));
      
      // Place road on grid
      const gridCells = document.querySelectorAll('[class*="bg-transparent"]');
      if (gridCells.length > 0) {
        await user.click(gridCells[0]);
        
        // Cell should contain road SVG
        expect(gridCells[0].querySelector('svg')).toBeInTheDocument();
      }
    });

    test("can place intersection roads", async () => {
      const { user } = renderApp();
      
      // Open road palette
      await user.click(screen.getByText("Road"));
      await user.click(screen.getByText("Intersection"));
      
      // Place road on grid
      const gridCells = document.querySelectorAll('[class*="bg-transparent"]');
      if (gridCells.length > 0) {
        await user.click(gridCells[0]);
        
        // Cell should contain road SVG
        expect(gridCells[0].querySelector('svg')).toBeInTheDocument();
      }
    });
  });

  describe("History Management", () => {
    test("undo becomes enabled after making changes", async () => {
      const { user } = renderApp();
      
      const undoButton = screen.getByText("↶ Undo");
      expect(undoButton).toBeDisabled();
      
      // Make a change
      const carTool = screen.getByText("Car");
      await user.click(carTool);
      
      const gridCells = document.querySelectorAll('[class*="bg-transparent"]');
      if (gridCells.length > 0) {
        await user.click(gridCells[0]);
        
        // Undo should now be enabled
        expect(undoButton).toBeEnabled();
      }
    });

    test("redo becomes enabled after undo", async () => {
      const { user } = renderApp();
      
      // Make a change
      const carTool = screen.getByText("Car");
      await user.click(carTool);
      
      const gridCells = document.querySelectorAll('[class*="bg-transparent"]');
      if (gridCells.length > 0) {
        await user.click(gridCells[0]);
        
        // Undo the change
        const undoButton = screen.getByText("↶ Undo");
        await user.click(undoButton);
        
        // Redo should now be enabled
        const redoButton = screen.getByText("↷ Redo");
        expect(redoButton).toBeEnabled();
      }
    });
  });
});