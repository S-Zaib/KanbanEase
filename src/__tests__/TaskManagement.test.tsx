import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { List } from '../components/List';
import { Task } from '../components/Task';
import Board from '../components/Board';
import { supabase } from '../lib/supabase';

// Partial mock of supabase client
jest.mock('../lib/supabase', () => {
  const originalModule = jest.requireActual('../lib/supabase');
  return {
    ...originalModule,
    supabase: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      data: null,
      error: null,
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null
        }),
        getSession: jest.fn().mockResolvedValue({
          data: { 
            session: { 
              user: { 
                id: 'test-user-id', 
                email: 'test@example.com' 
              } 
            } 
          },
          error: null
        })
      },
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      })
    }
  };
});

describe('Task Management', () => {
  // Test case for creating a new task
  test('US: Add, edit, and delete tasks', async () => {
    // Mock data
    const mockList = {
      id: 'list-1',
      name: 'To Do',
      position: 1,
      board_id: 'board-1',
      tasks: []
    };
    
    // Mock functions
    const onAddTask = jest.fn();
    const onUpdateTask = jest.fn();
    const onDeleteTask = jest.fn();
    
    // Render component
    render(
      <List 
        list={mockList}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onMoveTask={jest.fn()}
      />
    );
    
    // Test adding a task
    const addButton = screen.getByText(/add a card/i);
    userEvent.click(addButton);
    
    const taskTitleInput = screen.getByPlaceholderText(/enter task title/i);
    userEvent.type(taskTitleInput, 'New test task');
    
    const saveButton = screen.getByText(/save/i);
    userEvent.click(saveButton);
    
    expect(onAddTask).toHaveBeenCalledWith(
      expect.any(String),
      'New test task',
      mockList.id,
      expect.any(Number)
    );
  });
  
  // Test case for task with due date
  test('US: Set due dates for tasks', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      list_id: 'list-1',
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const onUpdate = jest.fn();
    
    render(
      <Task 
        task={mockTask}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );
    
    // Open edit mode
    const taskElement = screen.getByText('Test Task');
    userEvent.click(taskElement);
    
    // Set due date
    const dueDateInput = screen.getByLabelText(/due date/i);
    fireEvent.change(dueDateInput, { target: { value: '2023-12-31' } });
    
    // Save changes
    const saveButton = screen.getByText(/save/i);
    userEvent.click(saveButton);
    
    expect(onUpdate).toHaveBeenCalledWith(
      mockTask.id, 
      mockTask.title, 
      undefined, 
      expect.stringContaining('2023-12-31'), 
      undefined
    );
  });
  
  // Test case for task description
  test('US: Add descriptions and notes to tasks', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      list_id: 'list-1',
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const onUpdate = jest.fn();
    
    render(
      <Task 
        task={mockTask}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );
    
    // Open edit mode
    const taskElement = screen.getByText('Test Task');
    userEvent.click(taskElement);
    
    // Add description
    const descriptionInput = screen.getByLabelText(/description/i);
    userEvent.type(descriptionInput, 'This is a test description');
    
    // Save changes
    const saveButton = screen.getByText(/save/i);
    userEvent.click(saveButton);
    
    expect(onUpdate).toHaveBeenCalledWith(
      mockTask.id, 
      mockTask.title, 
      'This is a test description', 
      undefined, 
      undefined
    );
  });
  
  // Test for task priority
  test('US: Mark tasks with priority levels', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      list_id: 'list-1',
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      priority: 'medium'
    };
    
    const onUpdate = jest.fn();
    
    render(
      <Task 
        task={mockTask}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );
    
    // Open edit mode
    const taskElement = screen.getByText('Test Task');
    userEvent.click(taskElement);
    
    // Change priority
    const prioritySelect = screen.getByLabelText(/priority/i);
    userEvent.selectOptions(prioritySelect, 'high');
    
    // Save changes
    const saveButton = screen.getByText(/save/i);
    userEvent.click(saveButton);
    
    expect(onUpdate).toHaveBeenCalledWith(
      mockTask.id, 
      mockTask.title, 
      undefined, 
      undefined, 
      undefined,
      'high'
    );
  });
  
  // Test for task assignment
  test('US: Assign tasks to specific team members', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      list_id: 'list-1',
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const onUpdate = jest.fn();
    
    // Mock board members data
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'board_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          data: [
            { user_id: 'user-1', user_email: 'user1@example.com' },
            { user_id: 'user-2', user_email: 'user2@example.com' }
          ],
          error: null
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        data: null,
        error: null
      };
    });
    
    render(
      <Task 
        task={mockTask}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );
    
    // Open edit mode
    const taskElement = screen.getByText('Test Task');
    userEvent.click(taskElement);
    
    // Select assignee
    const assigneeSelect = screen.getByLabelText(/assign to/i);
    userEvent.selectOptions(assigneeSelect, 'user1@example.com');
    
    // Save changes
    const saveButton = screen.getByText(/save/i);
    userEvent.click(saveButton);
    
    expect(onUpdate).toHaveBeenCalledWith(
      mockTask.id, 
      mockTask.title, 
      undefined, 
      undefined, 
      'user1@example.com'
    );
  });
});
