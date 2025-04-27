import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Board from '../components/Board';

describe('Board Component', () => {
  const mockBoard = {
    id: 'board-1',
    name: 'Project Board',
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lists: [
      {
        id: 'list-1',
        name: 'To Do',
        position: 1,
        board_id: 'board-1',
        tasks: []
      }
    ]
  };
  
  test('renders board name correctly', () => {
    render(<Board board={mockBoard} />);
    
    expect(screen.getByText('Project Board')).toBeInTheDocument();
  });
  
  test('renders lists within the board', () => {
    render(<Board board={mockBoard} />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });
});
