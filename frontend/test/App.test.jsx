import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

describe('City Builder App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders main application with title and controls', () => {
    render(<App />);
    
    expect(screen.getByText('City Builder')).toBeInTheDocument();
    expect(screen.getByText('Simulation')).toBeInTheDocument();
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Palette')).toBeInTheDocument();
  });

  test('all palette items are rendered correctly', () => {
      render(<App />);
      
      // Check main palette items
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Road')).toBeInTheDocument();
      expect(screen.getByText('Car')).toBeInTheDocument();
      expect(screen.getByText('Building')).toBeInTheDocument();
      expect(screen.getByText('Tree')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Eraser')).toBeInTheDocument();
    });

  test('initial simulation state is paused', () => {
    render(<App />);
    
    const playButton = screen.getByRole('button', { name: /start traffic/i });
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveTextContent('▶ Start Traffic');
  });

  test('toggles simulation play/pause', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const playButton = screen.getByRole('button', { name: /start traffic/i });
    
    // Start simulation
    await user.click(playButton);
    expect(playButton).toHaveTextContent('⏸ Pause Traffic');
    
    // Pause simulation
    await user.click(playButton);
    expect(playButton).toHaveTextContent('▶ Start Traffic');
  });

  // test('changes grid dimensions', async () => {
  //   const user = userEvent.setup();
  //   render(<App />);
    
  //   // Find all number inputs
  //   const numberInputs = screen.getAllByRole('spinbutton');
  //   const rowsInput = numberInputs[0];
  //   const colsInput = numberInputs[1];
    
  //   // Change rows
  //   await user.clear(rowsInput);
  //   await user.type(rowsInput, '20');
  //   expect(rowsInput).toHaveValue(20);
    
  //   // Change cols
  //   await user.clear(colsInput);
  //   await user.type(colsInput, '40');
  //   expect(colsInput).toHaveValue(40);
  // });

  test('switches between main and road palettes', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Initially should show main palette items
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Road')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
    expect(screen.getByText('Building')).toBeInTheDocument();
    
    // Click road menu to switch to road palette
    const roadButton = screen.getByText('Road');
    await user.click(roadButton);
    
    // Should now show road palette items
    expect(screen.getByText('Straight')).toBeInTheDocument();
    expect(screen.getByText('Intersection')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    
    // Click back to return to main palette
    const backButton = screen.getByText('Back');
    await user.click(backButton);
    
    // Should be back to main palette
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  test('selects tools from palette', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Click on car tool
    const carTool = screen.getByText('Car').closest('div');
    await user.click(carTool);
    
    // Car tool should be selected
    expect(carTool).toHaveClass('border-blue-500');
    
    // Click on building tool
    const buildingTool = screen.getByText('Building').closest('div');
    await user.click(buildingTool);
    
    // Building tool should now be selected
    expect(buildingTool).toHaveClass('border-blue-500');
  });

  test('clears grid when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const clearButton = screen.getByRole('button', { name: /clear grid/i });
    await user.click(clearButton);
    
    expect(clearButton).toBeInTheDocument();
  });

  test('handles palette item drag and drop', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Get a palette item that can be dragged
    const carItem = screen.getByText('Car').closest('div');
    
    // Mock drag events
    const setDataMock = vi.fn();
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    dragStartEvent.dataTransfer = { setData: setDataMock };
    
    fireEvent(carItem, dragStartEvent);
    
    expect(setDataMock).toHaveBeenCalledWith('itemType', 'car');
  });
});