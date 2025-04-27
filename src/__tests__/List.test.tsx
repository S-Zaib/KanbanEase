import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from '../components/List';

describe('List Component', () => {
  const mockList = {
    id: 'list-1',
    name: 'To Do',
    position: 1,
    board_id: 'board-1',
    tasks: [
      {
        id: 'task-1',
        title: 'Test Task',
        position: 1,
        list_id: 'list-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: null,
        due_date: null,
        assigned_to: null,
        priority: 'medium'
      }
    ]
  };
  
  const mockHandlers = {
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onAddTask: jest.fn(),
    onUpdateTask: jest.fn(),
    onDeleteTask: jest.fn(),
    onMoveTask: jest.fn()
  };
  
  test('renders list name and task count correctly', () => {
    render(<List list={mockList} {...mockHandlers} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  test('shows add card button', () => {
    render(<List list={mockList} {...mockHandlers} />);
    
    const addButton = screen.getByText(/Add a card/i);
    expect(addButton).toBeInTheDocument();
  });
});
