import { Droppable, Draggable } from '@hello-pangea/dnd'
import { useState } from 'react'
import { Database } from '../lib/supabase'
import Task from './Task'

type ListProps = {
  list: Database['public']['Tables']['lists']['Row']
  tasks: Database['public']['Tables']['tasks']['Row'][]
  onAddTask: (listId: string, title: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onUpdateTask: (taskId: string, title: string) => Promise<void>
}

export default function List({ list, tasks, onAddTask, onDeleteTask, onUpdateTask }: ListProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newTaskTitle.trim()) {
      await onAddTask(list.id, newTaskTitle.trim())
      setNewTaskTitle('')
      setIsAddingTask(false)
    }
  }

  return (
    <div className="bg-[#21262d] rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full border border-[#30363d] shadow-xl relative">
      {/* List header with options */}
      <div className="p-2 flex justify-between items-center border-b border-[#30363d] bg-[#2b3139]">
        <h2 className="text-sm font-semibold px-2 py-1 text-gray-200 truncate flex-1">{list.name}</h2>
        <div className="flex items-center">
          <span className="text-xs text-gray-400 mr-2">{tasks.length}</span>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 rounded-md hover:bg-[#30363d] transition-colors">
            •••
          </button>
        </div>
      </div>
      
      {/* Droppable area for tasks */}
      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[2rem] transition-colors scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-transparent ${
              snapshot.isDraggingOver ? 'bg-[#2b3139]' : ''
            }`}
            style={{ 
              maxHeight: 'calc(100vh - 10rem)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#30363d transparent' 
            }}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${snapshot.isDragging ? 'rotate-2 opacity-90 scale-105 z-10' : ''} transition-transform`}
                  >
                    <Task
                      task={task}
                      onDelete={onDeleteTask}
                      onUpdate={onUpdateTask}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task section */}
      <div className="p-2 border-t border-[#30363d] bg-[#232930]">
        {isAddingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2">
            <textarea
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter a title for this card..."
              className="w-full min-h-[4rem] p-2 text-sm bg-[#161b22] text-gray-200 rounded border border-[#30363d] focus:border-blue-500 outline-none resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false)
                  setNewTaskTitle('')
                }}
                className="px-2 py-1 text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full px-2 py-1.5 text-sm text-gray-400 hover:text-gray-200 bg-[#2b3139] hover:bg-[#323b47] rounded border border-[#30363d] focus:outline-none text-left flex items-center transition-colors"
          >
            <span className="text-lg mr-1">+</span> Add a card
          </button>
        )}
      </div>
      
      {/* Visual indicator for list boundaries */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700/30 to-purple-700/30 rounded-b-lg"></div>
    </div>
  )
} 