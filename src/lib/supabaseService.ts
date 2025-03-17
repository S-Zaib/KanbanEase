import { supabase, List, Task, Board } from './supabase';

export const boardService = {
  async getAllBoards(): Promise<Board[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at');
    
    if (error) {
      console.error('Error fetching boards:', error);
      throw error;
    }
    
    return data || [];
  },
  
  async createBoard(name: string): Promise<Board> {
    const { data, error } = await supabase
      .from('boards')
      .insert({ name, user_id: (await supabase.auth.getUser()).data.user?.id })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating board:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateBoard(id: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('boards')
      .update({ name })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating board:', error);
      throw error;
    }
  },
  
  async deleteBoard(id: string): Promise<void> {
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting board:', error);
      throw error;
    }
  }
};

export const listService = {
  async getListsByBoardId(boardId: string): Promise<List[]> {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching lists:', error);
      throw error;
    }
    
    return data || [];
  },
  
  async createList(boardId: string, name: string): Promise<List> {
    const { data, error } = await supabase
      .from('lists')
      .insert({ board_id: boardId, name })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating list:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateList(id: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('lists')
      .update({ name })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  },
  
  async deleteList(id: string): Promise<void> {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  }
};

export const taskService = {
  async getTasksByListIds(listIds: string[]): Promise<Task[]> {
    if (listIds.length === 0) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('list_id', listIds)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
    
    return data || [];
  },
  
  async createTask(listId: string, title: string, description?: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ list_id: listId, title, description })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },
  
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
  
  async moveTask(taskId: string, newListId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ list_id: newListId })
      .eq('id', taskId);
    
    if (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  }
};