import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, List, Task, DEFAULT_BOARD_ID } from '../lib/supabase';

type BoardContextType = {
  lists: List[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  createList: (name: string) => Promise<void>;
  updateList: (id: string, name: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  createTask: (listId: string, title: string, description?: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newListId: string) => Promise<void>;
};

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};

type BoardProviderProps = {
  children: ReactNode;
  boardId?: string;
};

export const BoardProvider = ({ children, boardId = DEFAULT_BOARD_ID }: BoardProviderProps) => {
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load lists and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch lists
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select('*')
          .eq('board_id', boardId)
          .order('created_at');
        
        if (listsError) throw listsError;
        
        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('list_id', listsData.map(list => list.id) || [''])
          .order('created_at');
        
        if (tasksError) throw tasksError;
        
        setLists(listsData);
        setTasks(tasksData);
      } catch (err) {
        console.error('Error fetching board data:', err);
        setError('Failed to load board data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time listeners
    const listsSubscription = supabase
      .channel('lists-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'lists',
        filter: `board_id=eq.${boardId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLists(current => [...current, payload.new as List]);
        } else if (payload.eventType === 'UPDATE') {
          setLists(current => 
            current.map(list => list.id === payload.new.id ? payload.new as List : list)
          );
        } else if (payload.eventType === 'DELETE') {
          setLists(current => current.filter(list => list.id !== payload.old.id));
        }
      })
      .subscribe();

    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(current => [...current, payload.new as Task]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(current => 
            current.map(task => task.id === payload.new.id ? payload.new as Task : task)
          );
        } else if (payload.eventType === 'DELETE') {
          setTasks(current => current.filter(task => task.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(listsSubscription);
      supabase.removeChannel(tasksSubscription);
    };
  }, [boardId]);

  // Create a new list
  const createList = async (name: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .insert({ name, board_id: boardId });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error creating list:', err);
      setError('Failed to create list');
    }
  };

  // Update an existing list
  const updateList = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .update({ name })
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating list:', err);
      setError('Failed to update list');
    }
  };

  // Delete a list
  const deleteList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting list:', err);
      setError('Failed to delete list');
    }
  };

  // Create a new task
  const createTask = async (listId: string, title: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({ 
          list_id: listId, 
          title, 
          description: description || null
        });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    }
  };

  // Update an existing task
  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  // Move a task to a different list
  const moveTask = async (taskId: string, newListId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ list_id: newListId })
        .eq('id', taskId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error moving task:', err);
      setError('Failed to move task');
    }
  };

  const value = {
    lists,
    tasks,
    isLoading,
    error,
    createList,
    updateList,
    deleteList,
    createTask,
    updateTask,
    deleteTask,
    moveTask
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};