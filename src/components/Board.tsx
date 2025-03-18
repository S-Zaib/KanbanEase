import { useState, useEffect } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { supabase, Database } from '../lib/supabase'
import List from './List'

type List = Database['public']['Tables']['lists']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Board = Database['public']['Tables']['boards']['Row']

type BoardProps = {
  userId: string
}

export default function Board({ userId }: BoardProps) {
  const [boards, setBoards] = useState<Board[]>([])
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBoards()
  }, [userId])

  useEffect(() => {
    if (currentBoard) {
      fetchLists()
    }
  }, [currentBoard?.id])

  useEffect(() => {
    if (lists.length > 0) {
      fetchTasks()
    }
  }, [lists])

  const fetchBoards = async () => {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    
    if (error) {
      console.error('Error fetching boards:', error)
      return
    }
    
    setBoards(data)
    if (data.length > 0 && !currentBoard) {
      setCurrentBoard(data[0])
    }
    setLoading(false)
  }

  const fetchLists = async () => {
    if (!currentBoard) return

    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('board_id', currentBoard.id)
      .order('created_at')
    
    if (error) {
      console.error('Error fetching lists:', error)
      return
    }
    
    setLists(data)
  }

  const fetchTasks = async () => {
    if (lists.length === 0) return

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('list_id', lists.map(list => list.id))
      .order('created_at')
    
    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }
    
    setTasks(data || [])
  }

  const setupRealtimeSubscription = () => {
    if (!currentBoard) return

    const listsSubscription = supabase
      .channel('lists')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'lists',
        filter: `board_id=eq.${currentBoard.id}`
      }, fetchLists)
      .subscribe()

    const tasksSubscription = supabase
      .channel('tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `list_id=in.(${lists.map(list => list.id).join(',')})`
      }, fetchTasks)
      .subscribe()

    return () => {
      listsSubscription.unsubscribe()
      tasksSubscription.unsubscribe()
    }
  }

  useEffect(() => {
    const cleanup = setupRealtimeSubscription()
    return () => {
      if (cleanup) cleanup()
    }
  }, [currentBoard?.id, lists])

  const handleCreateBoard = async () => {
    const name = prompt('Enter board name:')
    if (!name) return

    const { data, error } = await supabase
      .from('boards')
      .insert([{ name, user_id: userId }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating board:', error)
      return
    }

    setBoards([...boards, data])
    setCurrentBoard(data)
  }

  const handleAddList = async (name: string) => {
    if (!currentBoard) return

    const { error } = await supabase
      .from('lists')
      .insert([{ name, board_id: currentBoard.id }])
    
    if (error) {
      console.error('Error adding list:', error)
    }
  }

  const handleAddTask = async (listId: string, title: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ list_id: listId, title }])
      .select()
      .single()
    
    if (error) {
      console.error('Error adding task:', error)
      return
    }

    setTasks(prev => [...prev, data])
  }

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    
    if (error) {
      console.error('Error deleting task:', error)
      return
    }

    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const handleUpdateTask = async (taskId: string, title: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ title })
      .eq('id', taskId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating task:', error)
      return
    }

    setTasks(prev => prev.map(task => task.id === taskId ? data : task))
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId) return

    const { data, error } = await supabase
      .from('tasks')
      .update({ list_id: destination.droppableId })
      .eq('id', draggableId)
      .select()
      .single()

    if (error) {
      console.error('Error moving task:', error)
      return
    }

    setTasks(prev => prev.map(task => task.id === draggableId ? data : task))
  }

  if (loading) {
    return <div className="p-4">Loading boards...</div>
  }

  if (boards.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 mb-4">You don't have any boards yet.</p>
        <button
          onClick={handleCreateBoard}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Your First Board
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <select
            value={currentBoard?.id}
            onChange={(e) => {
              const board = boards.find(b => b.id === e.target.value)
              if (board) setCurrentBoard(board)
            }}
            className="px-3 py-2 border rounded-md"
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateBoard}
            className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            New Board
          </button>
        </div>
        <button
          onClick={() => {
            const name = prompt('Enter list name:')
            if (name) handleAddList(name)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add List
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.map((list) => (
            <List
              key={list.id}
              list={list}
              tasks={tasks.filter((task) => task.list_id === list.id)}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}