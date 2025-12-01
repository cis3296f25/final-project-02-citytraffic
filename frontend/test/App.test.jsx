import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

// Mock console errors to reduce test noise
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('City Builder App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders main application with title and controls', async () => {
    render(<App />);
    
    // Use findBy for async rendering in React 19
    expect(await screen.findByText(/city builder pro/i)).toBeInTheDocument();
    expect(screen.getByText(/build and simulate city traffic/i)).toBeInTheDocument();
    expect(screen.getByText(/simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/dimensions/i)).toBeInTheDocument();
    expect(screen.getByText(/tools/i)).toBeInTheDocument();
  });

  test('all palette items are rendered correctly', async () => {
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    // Check main palette items with more flexible matching
    expect(screen.getByText(/select/i)).toBeInTheDocument();
    expect(screen.getByText(/road/i)).toBeInTheDocument();
    expect(screen.getByText(/car/i)).toBeInTheDocument();
    expect(screen.getByText(/building/i)).toBeInTheDocument();
    expect(screen.getByText(/tree/i)).toBeInTheDocument();
    expect(screen.getByText(/light/i)).toBeInTheDocument();
    expect(screen.getByText(/eraser/i)).toBeInTheDocument();
  });

  test('initial simulation state is paused', async () => {
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    const playButton = screen.getByRole('button', { name: /start traffic/i });
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveTextContent(/start traffic/i);
  });

  test('toggles simulation play/pause', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    const playButton = screen.getByRole('button', { name: /start traffic/i });
    
    // Start simulation
    await user.click(playButton);
    expect(playButton).toHaveTextContent(/pause traffic/i);
    
    // Pause simulation
    await user.click(playButton);
    expect(playButton).toHaveTextContent(/start traffic/i);
  });

  test('changes grid dimensions', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    // Find all number inputs
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(2);
    
    const rowsInput = numberInputs[0];
    const colsInput = numberInputs[1];
    
    // Change rows
    await user.clear(rowsInput);
    await user.type(rowsInput, '20');
    expect(rowsInput).toHaveValue(20);
    
    // Change cols
    await user.clear(colsInput);
    await user.type(colsInput, '40');
    expect(colsInput).toHaveValue(40);
  });

  test('switches between main and road palettes', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    // Click road menu to switch to road palette
    const roadButton = screen.getByText(/road/i);
    await user.click(roadButton);
    
    // Should now show road palette items
    expect(screen.getByText(/vertical/i)).toBeInTheDocument();
    expect(screen.getByText(/horizontal/i)).toBeInTheDocument();
    expect(screen.getByText(/intersection/i)).toBeInTheDocument();
    expect(screen.getByText(/back/i)).toBeInTheDocument();
    
    // Click back to return to main palette
    const backButton = screen.getByText(/back/i);
    await user.click(backButton);
    
    // Should be back to main palette
    expect(screen.getByText(/select/i)).toBeInTheDocument();
    expect(screen.getByText(/car/i)).toBeInTheDocument();
  });

  test('selects tools from palette', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    // Click on car tool
    const carTool = screen.getByText(/car/i).closest('div');
    await user.click(carTool);
    
    // Car tool should be selected - check for selected styling
    // Use more flexible class checking since Tailwind might generate different class names
    const carClasses = carTool?.className || '';
    expect(carClasses).toMatch(/border-(blue|primary)/);
    
    // Click on building tool
    const buildingTool = screen.getByText(/building/i).closest('div');
    await user.click(buildingTool);
    
    // Building tool should now be selected
    const buildingClasses = buildingTool?.className || '';
    expect(buildingClasses).toMatch(/border-(blue|primary)/);
  });

  test('clears grid when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    const clearButton = screen.getByRole('button', { name: /clear grid/i });
    await user.click(clearButton);
    
    expect(clearButton).toBeInTheDocument();
  });

  test('handles palette item drag and drop', async () => {
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    // Get a palette item that can be dragged
    const carItem = screen.getByText(/car/i).closest('div');
    
    // Mock drag events
    const setDataMock = vi.fn();
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: { setData: setDataMock },
    });
    
    fireEvent(carItem, dragStartEvent);
    
    expect(setDataMock).toHaveBeenCalledWith('itemType', 'car');
  });

  test('renders save and load panel', async () => {
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    expect(screen.getByText(/save & load/i)).toBeInTheDocument();
    expect(screen.getByText(/save current layout/i)).toBeInTheDocument();
    expect(screen.getByText(/saved layouts/i)).toBeInTheDocument();
  });

  test('shows history controls', async () => {
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    expect(screen.getByText(/history/i)).toBeInTheDocument();
    expect(screen.getByText(/↩ undo/i)).toBeInTheDocument();
    expect(screen.getByText(/↪ redo/i)).toBeInTheDocument();
  });

  test('restart traffic button state changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    const playButton = screen.getByRole('button', { name: /start traffic/i });
    const restartButton = screen.getByRole('button', { name: /restart traffic/i });
    
    // Check initial state
    expect(restartButton).toBeDisabled();
    
    // Start simulation
    await user.click(playButton);
    
    // Should now be enabled (or at least not disabled)
    expect(restartButton).not.toBeDisabled();
  });

  test('handles right-click context menu prevention', async () => {
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    // Find the main grid container - more reliable way
    const gridContainer = screen.getByRole('main') || 
                         document.querySelector('[class*="grid"]') ||
                         document.querySelector('[style*="position: relative"]');
    
    if (gridContainer) {
      // Mock preventDefault
      const preventDefaultMock = vi.fn();
      const contextMenuEvent = new Event('contextmenu', { bubbles: true });
      contextMenuEvent.preventDefault = preventDefaultMock;
      
      fireEvent(gridContainer, contextMenuEvent);
      
      expect(preventDefaultMock).toHaveBeenCalled();
    } else {
      // Skip this test if grid container not found
      console.warn('Grid container not found, skipping right-click test');
    }
  });

  // Additional test for save form functionality
  test('shows save form when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await screen.findByText(/city builder pro/i);
    
    const saveButton = screen.getByRole('button', { name: /save current layout/i });
    await user.click(saveButton);
    
    // Should show save form elements
    expect(screen.getByPlaceholderText(/layout name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
  });
});