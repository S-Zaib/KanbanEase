import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Board from '../components/Board';
import { BoardsList } from '../components/BoardsList';

describe('Board Management', () => {
  // Test case for creating a board
  test('US: Create a new board', () => {
    const onCreateBoard = jest.fn();
    
    render(
      <BoardsList 
        boards={[]}
        onCreateBoard={onCreateBoard}
        onSelectBoard={jest.fn()}
      />
    );
    
    const createBoardButton = screen.getByText(/create board/i);
    userEvent.click(createBoardButton);
    
    const boardNameInput = screen.getByPlaceholderText(/board name/i);
    userEvent.type(boardNameInput, 'New Project Board');
    
    const saveButton = screen.getByText(/create/i);
    userEvent.click(saveButton);
    
    expect(onCreateBoard).toHaveBeenCalledWith('New Project Board');
  });
  
  // Test case for inviting members to a board
  test('US: Invite members to a board for collaboration', () => {
    const mockBoard = {
      id: 'board-1',
      name: 'Test Board',
      lists: []
    };
    
    const onInviteMember = jest.fn();
    
    render(
      <BoardMembers 
        boardId={mockBoard.id}
        ownerId="owner-id"
        onInviteMember={onInviteMember}
      />
    );
    
    const inviteButton = screen.getByText(/invite/i);
    userEvent.click(inviteButton);
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    userEvent.type(emailInput, 'colleague@example.com');
    
    const sendInviteButton = screen.getByText(/send invitation/i);
    userEvent.click(sendInviteButton);
    
    expect(onInviteMember).toHaveBeenCalledWith(mockBoard.id, 'colleague@example.com');
  });
  
  // Test for dark mode
  test('US: Use dark mode for comfortable work in low-light environments', () => {
    render(
      <ThemeToggle />
    );
    
    // Default should be dark mode
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    // Toggle to light mode
    const themeToggleButton = screen.getByLabelText(/toggle theme/i);
    userEvent.click(themeToggleButton);
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // Toggle back to dark mode
    userEvent.click(themeToggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
