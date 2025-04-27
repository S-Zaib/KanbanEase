import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { List } from '../components/List';

describe('List Management', () => {
  // Test case for creating a list
  test('US: Create task lists to organize work efficiently', () => {
    const mockBoard = {
      id: 'board-1',
      name: 'Test Board',
      lists: []
    };
    
    const onAddList = jest.fn();
    
    render(
      <Board 
        board={mockBoard}
        onAddList={onAddList}
      />
    );
    
    const addListButton = screen.getByText(/add another list/i);
    userEvent.click(addListButton);
    
    const listNameInput = screen.getByPlaceholderText(/enter list name/i);
    userEvent.type(listNameInput, 'New List');
    
    const saveButton = screen.getByText(/add list/i);
    userEvent.click(saveButton);
    
    expect(onAddList).toHaveBeenCalledWith('New List', mockBoard.id, 1);
  });
  
  // Test case for editing a list
  test('US: Edit list name', () => {
    const mockList = {
      id: 'list-1',
      name: 'To Do',
      position: 1,
      board_id: 'board-1',
      tasks: []
    };
    
    const onUpdate = jest.fn();
    
    render(
      <List 
        list={mockList}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
        onAddTask={jest.fn()}
        onUpdateTask={jest.fn()}
        onDeleteTask={jest.fn()}
        onMoveTask={jest.fn()}
      />
    );
    
    // Open edit mode
    const listNameElement = screen.getByText('To Do');
    userEvent.doubleClick(listNameElement);
    
    // Change list name
    const listNameInput = screen.getByDisplayValue('To Do');
    userEvent.clear(listNameInput);
    userEvent.type(listNameInput, 'In Progress');
    
    // Simulate blur/enter to save
    fireEvent.blur(listNameInput);
    
    expect(onUpdate).toHaveBeenCalledWith(mockList.id, 'In Progress');
  });
  
  // Test case for deleting a list
  test('US: Delete a list', () => {
    const mockList = {
      id: 'list-1',
      name: 'To Do',
      position: 1,
      board_id: 'board-1',
      tasks: []
    };
    
    const onDelete = jest.fn();
    
    render(
      <List 
        list={mockList}
        onUpdate={jest.fn()}
        onDelete={onDelete}
        onAddTask={jest.fn()}
        onUpdateTask={jest.fn()}
        onDeleteTask={jest.fn()}
        onMoveTask={jest.fn()}
      />
    );
    
    // Open menu
    const menuButton = screen.getByLabelText(/list actions/i);
    userEvent.click(menuButton);
    
    // Click delete option
    const deleteButton = screen.getByText(/delete list/i);
    userEvent.click(deleteButton);
    
    // Confirm deletion
    window.confirm = jest.fn().mockReturnValue(true);
    
    expect(onDelete).toHaveBeenCalledWith(mockList.id);
  });
});
