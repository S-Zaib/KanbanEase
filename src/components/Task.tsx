import { useState, useRef, useEffect } from 'react'
import { Database } from '../lib/supabase'

type TaskProps = {
  task: Database['public']['Tables']['tasks']['Row']
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, title: string, description: string) => Promise<void>
}

export default function Task({ task, onDelete, onUpdate }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "") // New state for description
  const modalRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLTextAreaElement>(null)

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

  // Focus the title input when editing
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((title.trim() && title !== task.title) || (description.trim() !== task.description)) {
      await onUpdate(task.id, title.trim(), description.trim())
    }
    setIsEditing(false)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setIsEditing(false)
    setTitle(task.title)
    setDescription(task.description || "")
  }

  return (
    <>
      <div
        className="group relative bg-gradient-to-b from-[#161b22] to-[#1a2029] p-3 rounded-md shadow-sm border border-[#30363d] hover:border-[#3b434f] cursor-pointer transition-all hover:shadow-md"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute top-0 left-0 w-1 h-1 rounded-full bg-blue-500/50 m-1"></div>
        <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{task.title}</p>
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div 
            ref={modalRef}
            className="bg-[#161b22] rounded-lg shadow-2xl border border-[#30363d] w-full max-w-md mx-4 overflow-hidden relative"
          >
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

            <div className="p-4">
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <label className="block text-gray-400 text-sm mb-2">Title</label>
                  <textarea
                    ref={titleInputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full min-h-[3rem] p-3 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none resize-none shadow-inner mb-4"
                  />
                  <label className="block text-gray-400 text-sm mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[6rem] p-3 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none resize-none shadow-inner mb-4"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
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
                <>
                  <p className="text-gray-200">{task.description || "No description available."}</p>
                  <button onClick={() => setIsEditing(true)} className="mt-4 px-3 py-1.5 text-sm bg-[#21262d] text-gray-300 rounded-md hover:bg-[#30363d] transition-colors">
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
