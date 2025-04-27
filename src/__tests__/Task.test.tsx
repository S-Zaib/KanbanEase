import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Task from '../components/Task';

// Instead of mocking, we'll create a real-world test
describe('Task Component', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    list_id: '1',
    position: 1,
    description: null,
    due_date: null,
    assigned_to: null,
    priority: 'medium'
  };
  
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders task title correctly', () => {
    render(
      <Task 
        task={mockTask} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  test('enforces title character limit when editing', () => {
    render(
      <Task 
        task={mockTask} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete}
      />
    );
    
    // Click on task to edit
    const taskElement = screen.getByText('Test Task');
    userEvent.click(taskElement);
    
    // Find the title input and try to set a value over 50 chars
    const titleInput = screen.getByDisplayValue('Test Task');
    fireEvent.change(titleInput, { 
      target: { 
        value: 'A'.repeat(51) 
      } 
    });
    
    // Title input should be limited to 50 chars
    expect(titleInput.value.length).toBeLessThanOrEqual(50);
  });
  
  test('shows the priority badge correctly', () => {
    render(
      <Task 
        task={{...mockTask, priority: 'high'}} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete}
      />
    );
    
    const priorityBadge = screen.getByTitle(/high priority/i);
    expect(priorityBadge).toBeInTheDocument();
  });
});
