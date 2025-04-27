import { useState, useRef, useEffect } from 'react'
import { Database } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { FaFlag } from 'react-icons/fa'

// Type for comments
interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
}

// Type for board members/users for assignment
interface BoardMember {
  id: string;
  email: string;
}

// Type for subtasks
interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  position: number;
}

// Type for labels
interface Label {
  id: string;
  name: string;
  color: string;
}

// Enhanced type for Task with additional properties
type EnhancedTask = Database['public']['Tables']['tasks']['Row'] & {
  description?: string | null;
  due_date?: string;
  assigned_to?: string;
  assignee_email?: string;
  comments?: Comment[];
  subtasks?: Subtask[];
  subtaskProgress?: { completed: number; total: number };
  labels?: Label[];
  priority?: string;
};

type TaskProps = {
  task: EnhancedTask;
  boardMembers: BoardMember[];
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (
    taskId: string, 
    title: string, 
    description?: string, 
    due_date?: string, 
    assigned_to?: string,
    priority?: string
  ) => Promise<void>;
}

// Add priority configuration
const PRIORITY_CONFIG = {
  urgent: { 
    color: '#ef4444', // Red
    label: 'Urgent',
    icon: '🔴'
  },
  high: { 
    color: '#f97316', // Orange
    label: 'High',
    icon: '🟠'
  },
  medium: { 
    color: '#facc15', // Yellow
    label: 'Medium',
    icon: '🟡'
  },
  low: { 
    color: '#a3e635', // Light green
    label: 'Low',
    icon: '🟢'
  }
};

export default function Task({ task, boardMembers, onDelete, onUpdate }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [comments, setComments] = useState<Comment[]>(task.comments || [])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [subtaskProgress, setSubtaskProgress] = useState(task.subtaskProgress || { completed: 0, total: 0 })
  const [labels, setLabels] = useState<Label[]>(task.labels || [])
  const [boardLabels, setBoardLabels] = useState<Label[]>([])
  const [isAddingLabel, setIsAddingLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#0284c7')
  const [priority, setPriority] = useState(task.priority || 'medium')
  
  const modalRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize due date and time when component mounts or task changes
  useEffect(() => {
    if (task.due_date) {
      const date = new Date(task.due_date)
      setDueDate(formatDateForInput(date))
      setDueTime(formatTimeForInput(date))
    } else {
      setDueDate('')
      setDueTime('')
    }
  }, [task.due_date])

  // Helper functions for date/time formatting
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const formatTimeForInput = (date: Date): string => {
    return date.toISOString().split('T')[1].substring(0, 5)
  }

  const combineDateAndTime = (): string | undefined => {
    if (!dueDate) return undefined
    
    if (dueTime) {
      // Combine date and time to create ISO string
      return `${dueDate}T${dueTime}:00`
    }
    
    // Just use the date with default time (start of day)
    return `${dueDate}T00:00:00`
  }

  // Fetch comments when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchComments();
      fetchSubtasks();
      fetchTaskLabels();
    }
  }, [isModalOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModalOpen])

  // Handle Escape key to close modal
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscapeKey)
    } else {
      document.removeEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isModalOpen])

  // Focus the title input when editing in modal
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditing])

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // First get the comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });
      
      if (commentsError) throw commentsError;
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }
      
      // Then get the user profiles in a separate query
      const userIds = commentsData.map(comment => comment.user_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map for quick lookup
      const profileMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap.set(profile.id, profile.email);
        });
      }
      
      // Add email to each comment
      const formattedComments = commentsData.map(comment => ({
        ...comment,
        user_email: profileMap.get(comment.user_id) || 'Unknown User'
      }));
      
      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async () => {
    if (task.subtasks && task.subtasks.length > 0) {
      // Data is already loaded, just update state if needed
      setSubtasks(task.subtasks);
      return;
    }
    
    // Original fetch code for when data is not pre-loaded
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('position', { ascending: true });
      
      if (error) throw error;
      
      setSubtasks(data || []);
      
      // Calculate progress
      if (data) {
        const completed = data.filter(subtask => subtask.is_completed).length;
        setSubtaskProgress({
          completed,
          total: data.length
        });
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const fetchTaskLabels = async () => {
    if (task.labels && task.labels.length > 0) {
      // Labels are already loaded
      setLabels(task.labels);
      
      // Still need to fetch board labels
      try {
        // Get the board_id
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select(`
            list_id,
            lists:list_id (
              board_id
            )
          `)
          .eq('id', task.id)
          .single();
        
        if (taskError) throw taskError;
        
        const boardId = taskData.lists.board_id;
        
        // Get all labels for this board
        const { data: allLabels, error: labelsError } = await supabase
          .from('labels')
          .select('*')
          .eq('board_id', boardId)
          .order('name');
        
        if (labelsError) throw labelsError;
        
        setBoardLabels(allLabels || []);
      } catch (error) {
        console.error('Error fetching board labels:', error);
      }
      
      return;
    }
    
    // Original fetch code goes here
    // ...
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting with priority:', priority); // Debug log
    
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const combinedDueDate = combineDateAndTime();
    
    if (trimmedTitle && (
      trimmedTitle !== task.title || 
      trimmedDescription !== (task.description || '') || 
      combinedDueDate !== task.due_date || 
      assignedTo !== (task.assigned_to || '') ||
      priority !== (task.priority || 'medium') // Check if priority changed
    )) {
      await onUpdate(
        task.id, 
        trimmedTitle, 
        trimmedDescription || undefined, 
        combinedDueDate, 
        assignedTo || undefined,
        priority // Include priority here
      );
    }
    setIsEditing(false);
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const userId = sessionData.session?.user.id;
      if (!userId) {
        console.error('User not authenticated');
        return;
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { 
            task_id: task.id, 
            user_id: userId, 
            content: newComment.trim() 
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Get the user's email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (!userError && userData) {
        // Add the new comment to the state
        setComments(prev => [{
          ...data,
          user_email: userData.email
        }, ...prev]);
      } else {
        setComments(prev => [data, ...prev]);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false)
    setIsEditing(false)
    setTitle(task.title)
    setDescription(task.description || '')
    
    if (task.due_date) {
      const date = new Date(task.due_date)
      setDueDate(formatDateForInput(date))
      setDueTime(formatTimeForInput(date))
    } else {
      setDueDate('')
      setDueTime('')
    }
    
    setAssignedTo(task.assigned_to || '')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Get assignee email from the boardMembers array
  const getAssigneeEmail = (userId?: string): string => {
    if (!userId) return '';
    const member = boardMembers.find(m => m.id === userId);
    return member ? member.email : '';
  };

  // Determine if task is assigned to current user
  const isAssignedToCurrentUser = async (): Promise<boolean> => {
    if (!task.assigned_to) return false;
    
    const { data } = await supabase.auth.getSession();
    const currentUserId = data.session?.user.id;
    return currentUserId === task.assigned_to;
  };

  // Add handler to create subtask
  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    
    try {
      // Find the highest position and add 1
      const position = subtasks.length > 0 
        ? Math.max(...subtasks.map(s => s.position)) + 1 
        : 0;
      
      const { data, error } = await supabase
        .from('subtasks')
        .insert([{
          task_id: task.id,
          title: newSubtaskTitle.trim(),
          position
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setSubtasks(prev => [...prev, data]);
      setNewSubtaskTitle('');
      setSubtaskProgress(prev => ({
        completed: prev.completed,
        total: prev.total + 1
      }));
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  // Add handler to toggle subtask completion
  const toggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ is_completed: !currentStatus })
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      const updatedSubtasks = subtasks.map(subtask => 
        subtask.id === subtaskId 
          ? { ...subtask, is_completed: !currentStatus } 
          : subtask
      );
      
      setSubtasks(updatedSubtasks);
      
      // Update progress
      const completed = updatedSubtasks.filter(subtask => subtask.is_completed).length;
      setSubtaskProgress({
        completed,
        total: updatedSubtasks.length
      });
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  // Add handler to delete subtask
  const deleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      const filteredSubtasks = subtasks.filter(subtask => subtask.id !== subtaskId);
      setSubtasks(filteredSubtasks);
      
      // Update progress
      const completed = filteredSubtasks.filter(subtask => subtask.is_completed).length;
      setSubtaskProgress({
        completed,
        total: filteredSubtasks.length
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  // Add handler to create a new label
  const createLabel = async () => {
    if (!newLabelName.trim()) return;
    
    try {
      // Get the board_id
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          list_id,
          lists:list_id (
            board_id
          )
        `)
        .eq('id', task.id)
        .single();
      
      if (taskError) throw taskError;
      
      const boardId = taskData.lists.board_id;
      
      // Create the label
      const { data: labelData, error: labelError } = await supabase
        .from('labels')
        .insert([{
          board_id: boardId,
          name: newLabelName.trim(),
          color: newLabelColor
        }])
        .select()
        .single();
      
      if (labelError) throw labelError;
      
      // Add the new label to the board labels list
      setBoardLabels(prev => [...prev, labelData]);
      
      // Clear the form
      setNewLabelName('');
      setIsAddingLabel(false);
    } catch (error) {
      console.error('Error creating label:', error);
    }
  };

  // Add handler to toggle a label on a task
  const toggleTaskLabel = async (labelId: string) => {
    try {
      const isLabelApplied = labels.some(label => label.id === labelId);
      
      if (isLabelApplied) {
        // Remove the label
        const { error } = await supabase
          .from('task_labels')
          .delete()
          .eq('task_id', task.id)
          .eq('label_id', labelId);
        
        if (error) throw error;
        
        // Update local state
        setLabels(prev => prev.filter(label => label.id !== labelId));
      } else {
        // Add the label
        const { error } = await supabase
          .from('task_labels')
          .insert([{
            task_id: task.id,
            label_id: labelId
          }]);
        
        if (error) throw error;
        
        // Find the label in boardLabels and add it to labels
        const labelToAdd = boardLabels.find(label => label.id === labelId);
        if (labelToAdd) {
          setLabels(prev => [...prev, labelToAdd]);
        }
      }
    } catch (error) {
      console.error('Error toggling label:', error);
    }
  };

  // Add these color options
  const colorOptions = [
    { name: 'Blue', value: '#0284c7' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Yellow', value: '#ca8a04' },
    { name: 'Purple', value: '#9333ea' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Gray', value: '#6b7280' }
  ];

  // Add console logs to debug
  console.log('Current task priority:', task.priority);
  console.log('Current priority state:', priority);

  // Task card component
  return (
    <>
      <div
        className="group relative bg-gradient-to-b from-[#161b22] to-[#1a2029] p-3 rounded-md shadow-sm border border-[#30363d] hover:border-[#3b434f] cursor-pointer transition-all hover:shadow-md"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Add this for priority indicator */}
        {priority && priority !== 'medium' && (
          <div 
            className="absolute top-0 left-0 bottom-0 w-1 rounded-tl-md rounded-bl-md"
            style={{ backgroundColor: PRIORITY_CONFIG[priority].color }}
          ></div>
        )}
        
        {/* Task created indicator */}
        <div className="absolute top-0 left-0 w-1 h-1 rounded-full bg-blue-500/50 m-1"></div>
        
        {/* Task content */}
        <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{task.title}</p>
        
        {/* Task metadata indicators */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {task.description && (
            <div className="text-gray-400 flex items-center">
              <span className="mr-1">📝</span>
            </div>
          )}
          {task.due_date && (
            <div className={`flex items-center ${isOverdue(task.due_date) ? 'text-red-400' : 'text-blue-400'}`}>
              <span className="mr-1">📅</span>
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          {(comments.length > 0 || (task.comments && task.comments.length > 0)) && (
            <div className="text-gray-400 flex items-center">
              <span className="mr-1">💬</span>
              <span>{comments.length || task.comments?.length}</span>
            </div>
          )}
          {task.assigned_to && (
            <div className="text-purple-400 flex items-center ml-auto">
              <span className="mr-1">👤</span>
              <span className="truncate max-w-[100px]">{getAssigneeEmail(task.assigned_to)}</span>
            </div>
          )}
          {subtaskProgress.total > 0 && (
            <div className="text-gray-400 flex items-center">
              <span className="mr-1">✓</span>
              <span>{subtaskProgress.completed}/{subtaskProgress.total}</span>
            </div>
          )}
          {labels && labels.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {labels.map(label => (
                <span 
                  key={label.id}
                  className="px-2 py-0.5 text-xs rounded-full text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
          {priority && priority !== 'medium' && (
            <div className="text-gray-400 flex items-center" title={`Priority: ${PRIORITY_CONFIG[priority].label}`}>
              <span className="mr-1">{PRIORITY_CONFIG[priority].icon}</span>
            </div>
          )}
        </div>
        
        {/* Edit and delete buttons */}
        <div className={`absolute right-1 top-1 transition-opacity flex gap-1 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsModalOpen(true)
              setIsEditing(true)
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-400 rounded hover:bg-[#30363d]/70 transition-colors"
            title="Edit card"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 rounded hover:bg-[#30363d]/70 transition-colors"
            title="Delete card"
          >
            ×
          </button>
        </div>
        
        {/* Bottom bar for visual boundary */}
        <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#30363d]/50 rounded-full"></div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div 
            ref={modalRef}
            className="bg-[#161b22] rounded-lg shadow-2xl border border-[#30363d] w-full max-w-md mx-4 overflow-hidden relative max-h-[90vh] flex flex-col"
          >
            {/* Modal header */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="flex justify-between items-center border-b border-[#30363d] p-4">
              <h3 className="text-lg font-semibold text-gray-100">Task Details</h3>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-200 text-xl"
              >
                ×
              </button>
            </div>

            {/* Modal content */}
            <div className="p-4 overflow-y-auto flex-1">
          {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Title</label>
                    <textarea
                      ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                      className="w-full min-h-[4rem] p-3 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none resize-none shadow-inner"
                      placeholder="Task title"
              />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Description</label>
              <textarea
                      value={description}
                onChange={(e) => setDescription(e.target.value)}
                      className="w-full min-h-[8rem] p-3 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none resize-none shadow-inner"
                      placeholder="Add a more detailed description..."
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Due Date & Time</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="flex-1 p-2 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
                      />
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-24 p-2 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Assign To</label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full p-2 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
                    >
                      <option value="">Unassigned</option>
                      {boardMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Priority</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PRIORITY_CONFIG).map(([key, value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            console.log(`Setting priority to: ${key}`);
                            setPriority(key);
                          }}
                          className={`px-3 py-1.5 rounded text-xs flex items-center transition-all ${
                            priority === key 
                              ? 'ring-1 ring-white bg-opacity-30'
                              : 'bg-opacity-10 hover:bg-opacity-20'
                          }`}
                          style={{ 
                            backgroundColor: value.color, 
                            color: 'white'
                          }}
                        >
                          <span className="mr-1">{value.icon}</span>
                          {value.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setTitle(task.title)
                        setDescription(task.description || '')
                        if (task.due_date) {
                          const date = new Date(task.due_date)
                          setDueDate(formatDateForInput(date))
                          setDueTime(formatTimeForInput(date))
                        } else {
                          setDueDate('')
                          setDueTime('')
                        }
                        setAssignedTo(task.assigned_to || '')
                      }}
                      className="px-3 py-1.5 text-sm bg-[#21262d] text-gray-300 rounded-md hover:bg-[#30363d] transition-colors"
                >
                  Cancel
                </button>
                <button
                      type="submit"
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors"
                >
                  Save
                </button>
              </div>
                </form>
              ) : (
                <div>
                  <div className="mb-4">
                    <h4 className="text-gray-400 text-sm mb-2">Title</h4>
                    <p className="text-gray-200 whitespace-pre-wrap break-words p-3 bg-[#0d1117] rounded-md border border-[#30363d]">{task.title}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-gray-400 text-sm mb-2">Description</h4>
                    {task.description ? (
                      <p className="text-gray-200 whitespace-pre-wrap break-words p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
                        {task.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
                        No description provided
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-gray-400 text-sm mb-2">Due Date & Time</h4>
                    {task.due_date ? (
                      <p className={`p-3 bg-[#0d1117] rounded-md border border-[#30363d] ${isOverdue(task.due_date) ? 'text-red-400' : 'text-gray-200'}`}>
                        {formatDateTime(task.due_date)} {isOverdue(task.due_date) && '(Overdue)'}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
                        No due date set
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <h4 className="text-gray-400 text-sm mb-2">Assigned To</h4>
                    {task.assigned_to ? (
                      <p className="p-3 bg-[#0d1117] rounded-md border border-[#30363d] text-purple-400 flex items-center">
                        <span className="mr-2">👤</span> {getAssigneeEmail(task.assigned_to)}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
                        Not assigned
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-gray-400 text-sm mb-2">Priority</h4>
                    <div 
                      className="p-2 rounded-md flex items-center"
                      style={{ 
                        backgroundColor: PRIORITY_CONFIG[priority || 'medium'].color + '30',
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}
                    >
                      <span className="mr-2 text-lg">{PRIORITY_CONFIG[priority || 'medium'].icon}</span>
                      <span className="font-medium">{PRIORITY_CONFIG[priority || 'medium'].label}</span>
                    </div>
                  </div>

                  {/* Comments section */}
                  <div className="mt-6 border-t border-[#30363d] pt-4">
                    <h4 className="text-gray-400 text-sm mb-3">Comments</h4>
                    
                    <form onSubmit={addComment} className="mb-4">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full min-h-[4rem] p-3 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none resize-none shadow-inner mb-2"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Comment
                        </button>
                      </div>
                    </form>

                    {loading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-[#1c2129] p-3 rounded-md border border-[#30363d]">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-medium text-blue-400">{comment.user_email || 'Unknown'}</span>
                              <span className="text-xs text-gray-500">{formatCommentDate(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{comment.content}</p>
                          </div>
                        ))}
            </div>
          ) : (
                      <p className="text-gray-500 italic text-center py-4">No comments yet</p>
                    )}
                  </div>

                  {/* Checklist section */}
                  <div className="mt-6 border-t border-[#30363d] pt-4">
                    <h4 className="text-gray-400 text-sm mb-3 flex justify-between items-center">
                      <span>Checklist {subtaskProgress.total > 0 && `(${subtaskProgress.completed}/${subtaskProgress.total})`}</span>
                      {subtaskProgress.total > 0 && (
                        <span className="text-xs text-blue-400">
                          {Math.round((subtaskProgress.completed / subtaskProgress.total) * 100)}%
                        </span>
                      )}
                    </h4>
                    
                    {/* Progress bar */}
                    {subtaskProgress.total > 0 && (
                      <div className="w-full h-1.5 bg-[#21262d] rounded-full mb-4 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ 
                            width: `${(subtaskProgress.completed / subtaskProgress.total) * 100}%`,
                            transition: 'width 0.3s ease-in-out' 
                          }}
                        ></div>
                      </div>
                    )}
                    
                    {/* Subtasks list */}
                    <div className="space-y-2 mb-4">
                      {subtasks.map(subtask => (
                        <div 
                          key={subtask.id} 
                          className="flex items-center p-2 rounded hover:bg-[#1c2129] group"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.is_completed}
                            onChange={() => toggleSubtask(subtask.id, subtask.is_completed)}
                            className="mr-3 h-4 w-4 rounded border-gray-600 bg-[#0d1117] checked:bg-blue-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <span 
                            className={`flex-grow text-sm ${subtask.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}
                          >
                            {subtask.title}
                          </span>
                          <button
                            onClick={() => deleteSubtask(subtask.id)}
                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add subtask form */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a subtask..."
                        className="flex-grow p-2 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addSubtask();
                          }
                        }}
                      />
                      <button
                        onClick={addSubtask}
                        disabled={!newSubtaskTitle.trim()}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Labels section */}
                  <div className="mb-4">
                    <h4 className="text-gray-400 text-sm mb-2 flex justify-between items-center">
                      <span>Labels</span>
                      <button 
                        onClick={() => setIsAddingLabel(!isAddingLabel)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        {isAddingLabel ? 'Cancel' : 'Add label'}
                      </button>
                    </h4>
                    
                    {isAddingLabel ? (
                      <div className="p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
                        <input
                          type="text"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="Label name"
                          className="w-full p-2 mb-3 text-sm bg-[#161b22] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
                        />
                        
                        <div className="mb-3">
                          <label className="block text-xs text-gray-400 mb-2">Color</label>
                          <div className="flex flex-wrap gap-2">
                            {colorOptions.map(color => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => setNewLabelColor(color.value)}
                                className={`w-6 h-6 rounded-full ${newLabelColor === color.value ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={createLabel}
                            disabled={!newLabelName.trim()}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Create Label
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
                        {boardLabels.length === 0 ? (
                          <p className="text-gray-500 text-sm">No labels available. Create one to get started.</p>
                        ) : (
                          <div className="space-y-2">
                            {boardLabels.map(boardLabel => {
                              const isApplied = labels.some(label => label.id === boardLabel.id);
                              return (
                                <div 
                                  key={boardLabel.id}
                                  className="flex items-center"
                                >
                                  <button
                                    onClick={() => toggleTaskLabel(boardLabel.id)}
                                    className={`flex items-center w-full rounded py-1 px-2 hover:bg-[#1c2129] ${isApplied ? 'bg-[#1c2129]' : ''}`}
                                  >
                                    <span
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: boardLabel.color }}
                                    />
                                    <span className="text-sm text-gray-200">{boardLabel.name}</span>
                                    {isApplied && (
                                      <span className="ml-auto text-blue-400">✓</span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-sm bg-[#21262d] text-gray-300 rounded-md hover:bg-[#30363d] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                      onClick={closeModal}
                      className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors"
                  >
                      Close
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Helper function to check if a date is overdue
function isOverdue(dateString: string): boolean {
  if (!dateString) return false;
  const now = new Date();
  const dueDate = new Date(dateString);
  return dueDate < now;
}

// Format comment date
function formatCommentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}