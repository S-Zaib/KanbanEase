import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { supabase, Database } from '../lib/supabase'
import List from './List'
import BoardMembers from './BoardMembers'
import Logo from './Logo'
import TaskFilters, { FilterCriteria } from './TaskFilters'

interface BoardMember {
  id: string;
  email: string;
  role?: string;
}

type List = Database['public']['Tables']['lists']['Row']
type Task = Database['public']['Tables']['tasks']['Row'] & {
  description?: string | null;
  due_date?: string;
  assigned_to?: string;
}
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
  const [newListName, setNewListName] = useState('')
  const [newBoardName, setNewBoardName] = useState('')
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filters, setFilters] = useState<FilterCriteria>({
    searchText: '',
    priority: [],
    assignedTo: [],
    hasDueDate: null,
    isOverdue: null,
    hasSubtasks: null
  })

  useEffect(() => {
    fetchBoards()
  }, [userId])

  useEffect(() => {
    if (currentBoard) {
      fetchLists()
      fetchBoardMembers()
    }
  }, [currentBoard?.id])

  useEffect(() => {
    if (lists.length > 0) {
      fetchTasks()
    }
  }, [lists])

  const fetchBoards = async () => {
    try {
      setLoading(true)
      
      // First, get boards the user owns
      const { data: ownedBoards, error: ownedError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
      
      if (ownedError) throw ownedError
      
      // Then, get boards the user is a member of
      const { data: membershipData, error: membershipError } = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', userId)
      
      if (membershipError) throw membershipError
      
      let allBoards = [...(ownedBoards || [])]
      
      // If user is a member of any boards, fetch those boards too
      if (membershipData && membershipData.length > 0) {
        const boardIds = membershipData.map(item => item.board_id)
        
        const { data: memberBoards, error: boardsError } = await supabase
          .from('boards')
          .select('*')
          .in('id', boardIds)
          .order('created_at')
        
        if (boardsError) throw boardsError
        
        if (memberBoards) {
          allBoards = [...allBoards, ...memberBoards]
        }
      }
      
      setBoards(allBoards)
      
      if (allBoards.length > 0 && !currentBoard) {
        setCurrentBoard(allBoards[0])
      }
    } catch (error) {
      console.error('Error fetching boards:', error)
    } finally {
      setLoading(false)
    }
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
    if (!lists.length) return;
    
    try {
      const listIds = lists.map(list => list.id);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks:subtasks(*),
          task_labels:task_labels(
            label_id,
            labels:label_id(*)
          )
        `)
        .in('list_id', listIds)
        .order('created_at');
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }
      
      // Transform the data to match our task structure with subtasks and labels
      const transformedTasks = data.map(task => {
        // Process subtasks
        const subtasks = task.subtasks || [];
        const completedSubtasks = subtasks.filter(st => st.is_completed).length;
        const subtaskProgress = {
          completed: completedSubtasks,
          total: subtasks.length
        };
        
        // Process labels
        const labelRelations = task.task_labels || [];
        const labels = labelRelations.map(relation => ({
          id: relation.labels.id,
          name: relation.labels.name,
          color: relation.labels.color
        }));
        
        return {
          ...task,
          subtasks,
          subtaskProgress,
          labels
        };
      });
      
      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }

  const fetchBoardMembers = async () => {
    try {
      // Fetch the board owner first
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('user_id')
        .eq('id', currentBoard?.id)
        .single()
      
      if (boardError) throw boardError
      
      // Get the owner's profile from the profiles table
      const { data: ownerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', boardData.user_id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means not found, which is fine - we'll use a default value
        console.warn('Owner profile not found:', profileError)
      }
      
      // Then fetch other members
      const { data: membersData, error: membersError } = await supabase
        .from('board_members')
        .select('id, user_id, role')
        .eq('board_id', currentBoard?.id)
      
      if (membersError) throw membersError
      
      // Combine the owner and members into one array
      const allMembers: BoardMember[] = [
        {
          id: boardData.user_id,
          email: ownerProfile?.email || 'Owner',
          role: 'owner'
        }
      ]
      
      // If there are other members, fetch their profiles
      if (membersData && membersData.length > 0) {
        // Get all user IDs
        const memberUserIds = membersData.map(member => member.user_id)
        
        // Fetch all profiles in one query
        const { data: memberProfiles, error: memberProfilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', memberUserIds)
        
        if (memberProfilesError) {
          console.warn('Error fetching member profiles:', memberProfilesError)
        }
        
        // Create a map for quick lookup
        const profileMap = new Map()
        if (memberProfiles) {
          memberProfiles.forEach(profile => {
            profileMap.set(profile.id, profile.email)
          })
        }
        
        // Add members with their emails
        membersData.forEach(member => {
          allMembers.push({
            id: member.user_id,
            email: profileMap.get(member.user_id) || 'Unknown',
            role: member.role
          })
        })
      }
      
      setBoardMembers(allMembers)
    } catch (error) {
      console.error('Error fetching board members:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!currentBoard) return;

    const listsSubscription = supabase
      .channel('lists')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'lists',
        filter: `board_id=eq.${currentBoard.id}`
      }, fetchLists)
      .subscribe();

    // For tasks, we need to handle the event more carefully to preserve detailed data
    const tasksSubscription = supabase
      .channel('tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `list_id=in.(${lists.map(list => list.id).join(',')})`
      }, (payload) => {
        // Instead of calling fetchTasks which would reload everything,
        // we'll handle the state update more granularly
        if (payload.eventType === 'INSERT') {
          // For inserts, we'll need to fetch the complete task with relationships
          fetchSingleTaskWithDetails(payload.new.id);
        } else if (payload.eventType === 'UPDATE') {
          // For updates, merge the new data with existing task data
          updateTaskInState(payload.new);
        } else if (payload.eventType === 'DELETE') {
          // For deletes, remove from state
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    // Add subscriptions for subtasks and task_labels
    const subtasksSubscription = supabase
      .channel('subtasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subtasks'
      }, (payload) => {
        handleSubtaskChange(payload);
      })
      .subscribe();

    const labelsSubscription = supabase
      .channel('task_labels')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task_labels'
      }, (payload) => {
        handleTaskLabelChange(payload);
      })
      .subscribe();

    return () => {
      listsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      subtasksSubscription.unsubscribe();
      labelsSubscription.unsubscribe();
    };
  };

  // Fetch a single task with all its relationships
  const fetchSingleTaskWithDetails = async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks:subtasks(*),
          task_labels:task_labels(
            label_id,
            labels:label_id(*)
          )
        `)
        .eq('id', taskId)
        .single();
      
      if (error) throw error;
      
      // Process the data as in fetchTasks
      const subtasks = data.subtasks || [];
      const completedSubtasks = subtasks.filter(st => st.is_completed).length;
      const subtaskProgress = {
        completed: completedSubtasks,
        total: subtasks.length
      };
      
      const labelRelations = data.task_labels || [];
      const labels = labelRelations.map(relation => ({
        id: relation.labels.id,
        name: relation.labels.name,
        color: relation.labels.color
      }));
      
      const taskWithDetails = {
        ...data,
        subtasks,
        subtaskProgress,
        labels
      };
      
      // Add to state
      setTasks(prev => [...prev, taskWithDetails]);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  // Update a task in state while preserving relationship data
  const updateTaskInState = (updatedTask) => {
    setTasks(prev => prev.map(task => {
      if (task.id === updatedTask.id) {
        // Preserve the relationships data
        return {
          ...task,
          ...updatedTask,
          subtasks: task.subtasks,
          subtaskProgress: task.subtaskProgress,
          labels: task.labels
        };
      }
      return task;
    }));
  };

  // Handle subtask changes in real-time
  const handleSubtaskChange = (payload) => {
    setTasks(prev => prev.map(task => {
      if (task.id === payload.new?.task_id || task.id === payload.old?.task_id) {
        let updatedSubtasks = [...(task.subtasks || [])];
        
        if (payload.eventType === 'INSERT') {
          updatedSubtasks.push(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          updatedSubtasks = updatedSubtasks.map(st => 
            st.id === payload.new.id ? payload.new : st
          );
        } else if (payload.eventType === 'DELETE') {
          updatedSubtasks = updatedSubtasks.filter(st => st.id !== payload.old.id);
        }
        
        const completedSubtasks = updatedSubtasks.filter(st => st.is_completed).length;
        const subtaskProgress = {
          completed: completedSubtasks,
          total: updatedSubtasks.length
        };
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          subtaskProgress
        };
      }
      return task;
    }));
  };

  // Handle task label changes in real-time
  const handleTaskLabelChange = async (payload) => {
    // For task labels, we need to fetch the complete label data
    if (payload.eventType === 'INSERT') {
      try {
        const { data, error } = await supabase
          .from('labels')
          .select('*')
          .eq('id', payload.new.label_id)
          .single();
        
        if (error) throw error;
        
        setTasks(prev => prev.map(task => {
          if (task.id === payload.new.task_id) {
            return {
              ...task,
              labels: [...(task.labels || []), data]
            };
          }
          return task;
        }));
      } catch (error) {
        console.error('Error fetching label details:', error);
      }
    } else if (payload.eventType === 'DELETE') {
      setTasks(prev => prev.map(task => {
        if (task.id === payload.old.task_id) {
          return {
            ...task,
            labels: (task.labels || []).filter(label => label.id !== payload.old.label_id)
          };
        }
        return task;
      }));
    }
  };

  const handleCreateBoard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!newBoardName.trim()) return
    
    try {
      // First check if the user is still authenticated
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('Your session has expired. Please sign in again.')
      }
      
      // Then try to create the board
      const { data, error } = await supabase
        .from('boards')
        .insert([{ 
          name: newBoardName.trim(), 
          user_id: userId 
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setBoards([...boards, data])
      setCurrentBoard(data)
      setNewBoardName('')
      setIsCreatingBoard(false)
    } catch (error: any) {
      console.error('Error creating board:', error)
      
      // Show a more user-friendly message
      alert(`Failed to create board: ${error.message || 'Unknown error'}`)
      
      // If it's an authentication error, sign the user out
      if (error.message?.includes('session') || error.code === 'PGRST301') {
        handleSignOut()
      }
    }
  }

  const handleAddList = async (name: string) => {
    if (!currentBoard) return

    const { error } = await supabase
      .from('lists')
      .insert([{ name, board_id: currentBoard.id }])
    
    if (error) {
      console.error('Error adding list:', error)
    }

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

    setTasks(prev => [...prev, data as Task])
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

  const handleUpdateTask = async (
    taskId: string, 
    title: string, 
    description?: string, 
    due_date?: string, 
    assigned_to?: string,
    priority?: string
  ) => {
    try {
      const updateData: any = { title };
      
      if (description !== undefined) {
        updateData.description = description;
      }
      
      if (due_date !== undefined) {
        updateData.due_date = due_date;
      }
      
      if (assigned_to !== undefined) {
        updateData.assigned_to = assigned_to;
      }
      
      if (priority !== undefined) {
        updateData.priority = priority;
      }
      
      console.log('Updating task with data:', updateData); // Debug log
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Update the task in state, including priority
      setTasks(prev => prev.map(task => task.id === taskId ? {
        ...task,
        title,
        description: description !== undefined ? description : task.description,
        due_date: due_date !== undefined ? due_date : task.due_date,
        assigned_to: assigned_to !== undefined ? assigned_to : task.assigned_to,
        priority: priority !== undefined ? priority : task.priority
      } : task));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleMoveTask = async (taskId: string, sourceListId: string, destinationListId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ list_id: destinationListId })
      .eq('id', taskId);
    
    if (error) {
      console.error('Error moving task:', error);
      return;
    }

    // Preserve all task details when moving between lists
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, list_id: destinationListId }
        : task
    ));
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId) return

    await handleMoveTask(draggableId, source.droppableId, destination.droppableId)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
  if (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleUpdateListTitle = (listId: string, title: string) => {
    // Add this functionality if needed
  }

  const handleDeleteList = (listId: string) => {
    // Add this functionality if needed
  }

  // 1. First define the hasActiveFilters function before using it
  const hasActiveFilters = () => {
    return filters.searchText !== '' || 
      filters.priority.length > 0 || 
      filters.assignedTo.length > 0 || 
      filters.hasDueDate !== null || 
      filters.isOverdue !== null ||
      filters.hasSubtasks !== null;
  };

  // 2. Helper function to check if a task is overdue
  const isOverdue = (dateString: string): boolean => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const now = new Date();
    return dueDate < now;
  };

  // 3. Define the taskMatchesFilters function
  const taskMatchesFilters = (task) => {
    // Search text
    if (filters.searchText && !(
      task.title.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filters.searchText.toLowerCase()))
    )) {
      return false;
    }
    
    // Priority
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority || 'medium')) {
      return false;
    }
    
    // Assignee
    if (filters.assignedTo.length > 0) {
      const isUnassigned = !task.assigned_to;
      const isSelectedUnassigned = filters.assignedTo.includes('');
      const isAssignedToSelected = task.assigned_to && filters.assignedTo.includes(task.assigned_to);
      
      if (!(isUnassigned && isSelectedUnassigned) && !isAssignedToSelected) {
        return false;
      }
    }
    
    // Due date
    if (filters.hasDueDate === true && !task.due_date) {
      return false;
    }
    if (filters.hasDueDate === false && task.due_date) {
      return false;
    }
    
    // Overdue
    if (filters.isOverdue === true && (!task.due_date || !isOverdue(task.due_date))) {
      return false;
    }
    
    // Subtasks
    if (filters.hasSubtasks === true && (!task.subtasks || task.subtasks.length === 0)) {
      return false;
    }
    if (filters.hasSubtasks === false && task.subtasks && task.subtasks.length > 0) {
      return false;
    }
    
    return true;
  };

  // 4. Now define filteredTasks using the functions above
  const filteredTasks = useMemo(() => {
    if (!hasActiveFilters()) {
      return tasks;
    }
    
    return tasks.filter(taskMatchesFilters);
  }, [tasks, filters]);

  const handleDeleteBoard = async (boardId: string) => {
    // First confirm with the user
    if (!window.confirm("Are you sure you want to delete this board? This action cannot be undone and will delete all lists and tasks within the board.")) {
      return;
    }
    
    try {
      // Check if user is the owner of the board
      const boardToDelete = boards.find(b => b.id === boardId);
      if (!boardToDelete || boardToDelete.user_id !== userId) {
        alert("You can only delete boards that you own.");
        return;
      }
      
      // Delete the board
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);
      
      if (error) throw error;
      
      // Update state
      setBoards(prev => prev.filter(board => board.id !== boardId));
      
      // If the deleted board was the current board, set a new current board
      if (currentBoard?.id === boardId) {
        const remainingBoards = boards.filter(board => board.id !== boardId);
        setCurrentBoard(remainingBoards.length > 0 ? remainingBoards[0] : null);
      }
      
    } catch (error) {
      console.error('Error deleting board:', error);
      alert(`Failed to delete board: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <div className="text-xl text-gray-200">Loading your boards...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0d1117] text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`bg-[#161b22] border-r border-[#30363d] flex flex-col z-20 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar header with logo and collapse button */}
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex-1">
              <Logo size="small" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 rounded-md hover:bg-[#30363d] transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {/* Boards section */}
        <div className="flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Boards</h2>
                <button
                  onClick={() => setIsCreatingBoard(true)}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-[#30363d] transition-colors"
                  title="Create new board"
                >
                  +
                </button>
              </div>
              
              {isCreatingBoard ? (
                <form onSubmit={handleCreateBoard} className="mb-4">
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Board name"
                    className="w-full p-2 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newBoardName.trim()}
                      className="flex-1 p-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingBoard(false)
                        setNewBoardName('')
                      }}
                      className="p-1.5 text-xs font-medium bg-[#30363d] text-gray-300 rounded hover:bg-[#3b434f] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : boards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No boards yet</p>
                  <button
                    onClick={() => setIsCreatingBoard(true)}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors"
                  >
                    Create your first board
                  </button>
                </div>
              ) : (
                <ul className="space-y-1">
                  {boards.map((board) => (
                    <li key={board.id}>
                      <div className="flex w-full">
                        <button
                          className={`flex-1 p-2 text-left rounded-l-md flex items-center transition-colors ${
                            currentBoard?.id === board.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-[#30363d] hover:text-white'
                          }`}
                          onClick={() => setCurrentBoard(board)}
                        >
                          <span className="truncate">{board.name}</span>
                        </button>
                        {/* Only show delete button for boards owned by the user */}
                        {board.user_id === userId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the board selection
                              handleDeleteBoard(board.id);
                            }}
                            className={`p-2 rounded-r-md transition-colors text-gray-400 hover:text-red-400 ${
                              currentBoard?.id === board.id
                                ? 'bg-blue-600'
                                : 'hover:bg-[#30363d]'
                            }`}
                            title="Delete board"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="flex flex-col items-center pt-4">
              <button
                onClick={() => setIsCreatingBoard(true)}
                className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-[#30363d] transition-colors mb-4"
                title="Create new board"
              >
                +
              </button>
              
              {boards.map((board) => (
                <div key={board.id} className="relative mb-2">
                  <button
                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      currentBoard?.id === board.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-[#30363d] hover:text-white'
                    }`}
                    onClick={() => setCurrentBoard(board)}
                    title={board.name}
                  >
                    {board.name.charAt(0).toUpperCase()}
                  </button>
                  {board.user_id === userId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBoard(board.id);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      title="Delete board"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar footer with user controls */}
        <div className="p-4 border-t border-[#30363d]">
          <button
            onClick={handleSignOut}
            className={`text-gray-400 hover:text-white transition-colors ${
              sidebarCollapsed ? 'w-8 h-8 flex items-center justify-center' : 'w-full text-left'
            }`}
            title="Sign out"
          >
            {sidebarCollapsed ? '👋' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header for current board info */}
        {currentBoard && (
          <div className="p-4 border-b border-[#30363d] bg-[#161b22] shadow-md z-10 backdrop-blur bg-opacity-80">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-white">{currentBoard.name}</h1>
                {/* Only show delete button for boards owned by the user */}
                {currentBoard.user_id === userId && (
                  <button
                    onClick={() => handleDeleteBoard(currentBoard.id)}
                    className="ml-3 px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-[#21262d] rounded transition-colors"
                    title="Delete board"
                  >
                    Delete Board
                  </button>
                )}
              </div>
              <BoardMembers boardId={currentBoard.id} ownerId={userId} />
            </div>
          </div>
        )}

        {/* Main board content with lists and tasks */}
        {currentBoard ? (
          <div className="p-4">
            <TaskFilters 
              boardMembers={boardMembers}
              onFilterChange={setFilters}
            />
            
            {hasActiveFilters() && (
              <div className="bg-blue-900/20 text-blue-400 p-3 rounded-md mb-4 flex justify-between items-center">
                <span className="text-sm">
                  Showing {filteredTasks.length} of {tasks.length} tasks based on filters
                </span>
                <button 
                  onClick={() => setFilters({
                    searchText: '',
                    priority: [],
                    assignedTo: [],
                    hasDueDate: null,
                    isOverdue: null,
                    hasSubtasks: null
                  })}
                  className="text-xs bg-blue-800/50 hover:bg-blue-700/50 px-2 py-1 rounded"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex-1 overflow-x-auto p-6">
                <div className="flex gap-6 items-start">
                  {lists.map((list) => (
                    <List
                      key={list.id}
                      list={list}
                      tasks={filteredTasks.filter((task) => task.list_id === list.id)}
                      onAddTask={handleAddTask}
                      onDeleteTask={handleDeleteTask}
                      onUpdateTask={handleUpdateTask}
                      onUpdateListTitle={handleUpdateListTitle}
                      onDeleteList={handleDeleteList}
                      onMoveTask={handleMoveTask}
                      boardMembers={boardMembers}
                    />
                  ))}

                  <div className="w-72 shrink-0 bg-[#161b22] rounded-lg border border-[#30363d] shadow-md overflow-hidden">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (newListName.trim()) {
                        handleAddList(newListName.trim())
                      }
                    }} className="p-2">
                      <input
                        type="text"
                        placeholder="Add a new list"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="w-full p-2 bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
                      />
                      <button
                        type="submit"
                        disabled={!newListName.trim()}
                        className="mt-2 w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add List
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </DragDropContext>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-[#161b22] p-8 rounded-lg shadow-2xl max-w-md w-full border border-[#30363d] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4 text-center">Select or Create a Board</h2>
              <p className="text-gray-400 mb-6 text-center">
                {boards.length > 0 
                  ? "Please select a board from the sidebar to get started"
                  : "Create your first board to start organizing your tasks"
                }
              </p>
              {boards.length === 0 && (
                <button
                  onClick={() => setIsCreatingBoard(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#161b22] font-medium"
                >
                  Create Board
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}