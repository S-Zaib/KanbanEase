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
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')

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

    setIsAddingList(false)
    setNewListName('')
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
    return (
      <div className="min-h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <div className="text-xl text-gray-200">Loading your boards...</div>
        </div>
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="bg-[#161b22] p-8 rounded-lg shadow-2xl max-w-md w-full border border-[#30363d] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <h2 className="text-2xl font-bold text-gray-100 mb-4 text-center">Create Your First Board</h2>
          <p className="text-gray-400 mb-6 text-center">Start organizing your tasks with a new board</p>
          <button
            onClick={handleCreateBoard}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#161b22] font-medium"
          >
            Create Board
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="border-b border-[#30363d] bg-[#161b22] p-2 z-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <select
              value={currentBoard?.id}
              onChange={(e) => {
                const board = boards.find(b => b.id === e.target.value)
                if (board) setCurrentBoard(board)
              }}
              className="px-3 py-1.5 bg-[#21262d] text-gray-200 border border-[#30363d] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner"
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id} className="bg-[#21262d] text-gray-200">
                  {board.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateBoard}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] rounded-md border border-[#30363d] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg"
            >
              New Board
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingList(true)}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg flex items-center gap-1"
            >
              <span>+</span> Add List
            </button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 p-4 overflow-x-auto">
          <div className="flex gap-4 items-start min-h-full">
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
            
            {isAddingList ? (
              <div className="bg-[#21262d] rounded-lg w-72 flex-shrink-0 border border-[#30363d] shadow-xl overflow-hidden">
                <div className="p-3 border-b border-[#30363d]">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list title..."
                    className="w-full px-2 py-1 text-sm bg-[#161b22] text-gray-200 rounded border border-[#30363d] focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (newListName.trim()) {
                          handleAddList(newListName.trim())
                        }
                      }}
                      className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add List
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingList(false)
                        setNewListName('')
                      }}
                      className="px-3 py-1 text-xs font-medium bg-[#30363d] text-gray-200 rounded hover:bg-[#2b3139]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsAddingList(true)}
                className="bg-[#21262d]/70 hover:bg-[#21262d] rounded-lg w-72 h-12 flex-shrink-0 border border-dashed border-[#30363d] flex items-center justify-center text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
              >
                <span className="text-lg mr-1">+</span> Add another list
              </div>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}