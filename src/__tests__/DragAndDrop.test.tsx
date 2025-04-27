import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Board from '../components/Board';

describe('Drag and Drop Functionality', () => {
  // Test for dragging a task between lists
  test('US: Drag and drop tasks between lists', () => {
    const mockBoard = {
      id: 'board-1',
      name: 'Test Board',
      lists: [
        {
          id: 'list-1',
          name: 'To Do',
          position: 1,
          board_id: 'board-1',
          tasks: [
            {
              id: 'task-1',
              title: 'Test Task',
              position: 1,
              list_id: 'list-1'
            }
          ]
        },
        {
          id: 'list-2',
          name: 'In Progress',
          position: 2,
          board_id: 'board-1',
          tasks: []
        }
      ]
    };
    
    const onMoveTask = jest.fn();
    
    render(
      <DndProvider backend={HTML5Backend}>
        <Board 
          board={mockBoard}
          onMoveTask={onMoveTask}
        />
      </DndProvider>
    );
    
    // Find the task and target list
    const taskElement = screen.getByText('Test Task');
    const targetList = screen.getByText('In Progress').closest('.list-container');
    
    // Simulate drag and drop
    fireEvent.dragStart(taskElement);
    fireEvent.dragEnter(targetList);
    fireEvent.dragOver(targetList);
    fireEvent.drop(targetList);
    
    expect(onMoveTask).toHaveBeenCalledWith(
      'task-1',
      'list-1',
      'list-2',
      expect.any(Number)
    );
  });
});
