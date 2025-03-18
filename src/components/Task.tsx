import { useState } from 'react'
import { Database } from '../lib/supabase'

type TaskProps = {
  task: Database['public']['Tables']['tasks']['Row']
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, title: string) => Promise<void>
}

export default function Task({ task, onDelete, onUpdate }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && title !== task.title) {
      await onUpdate(task.id, title.trim())
    }
    setIsEditing(false)
  }

  return (
    <div className="bg-white p-3 rounded shadow-sm">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 p-1 border rounded"
            autoFocus
          />
          <button
            type="submit"
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-start">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <h3 className="text-sm">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
            )}
          </div>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}