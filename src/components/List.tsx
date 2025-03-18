import { Droppable, Draggable } from '@hello-pangea/dnd'
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
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('taskTitle') as HTMLInputElement
    if (input.value.trim()) {
      await onAddTask(list.id, input.value.trim())
      form.reset()
    }
  }

  return (
    <div className="bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0">
      <h2 className="text-lg font-semibold mb-4">{list.name}</h2>
      
      <Droppable droppableId={list.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2 min-h-[50px]"
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
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

      <form onSubmit={handleAddTask} className="mt-4">
        <input
          type="text"
          name="taskTitle"
          placeholder="Add a task..."
          className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>
    </div>
  )
} 