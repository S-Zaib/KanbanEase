import { useState, useRef, useEffect } from "react";
import { Database } from "../lib/supabase";

type TaskProps = {
  task: Database["public"]["Tables"]["tasks"]["Row"];
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, title: string, description: string, dueDate: string, comments: string[]) => Promise<void>;
};

export default function Task({ task, onDelete, onUpdate }: TaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [comments, setComments] = useState<string[]>(task.comments || []); // New state for comments
  const [newComment, setNewComment] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    }

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    } else {
      document.removeEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (title.trim() && title !== task.title) ||
      (description.trim() !== task.description) ||
      (dueDate !== task.due_date) ||
      (comments !== task.comments)
    ) {
      await onUpdate(task.id, title.trim(), description.trim(), dueDate, comments);
    }
    setIsEditing(false);
  };

  const handleAddComment = async () => {
    if (newComment.trim() !== "") {
      const updatedComments = [...comments, newComment.trim()];
      setComments(updatedComments);
      setNewComment("");
      await onUpdate(task.id, title, description, dueDate, updatedComments);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.due_date || "");
    setComments(task.comments || []);
  };

  return (
    <>
      <div
        className="group relative bg-gradient-to-b from-[#161b22] to-[#1a2029] p-3 rounded-md shadow-sm border border-[#30363d] hover:border-[#3b434f] cursor-pointer transition-all hover:shadow-md"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{task.title}</p>
        {task.due_date && <p className="text-xs text-gray-400 mt-1">Due: {task.due_date}</p>}
        <div className={`absolute right-1 top-1 transition-opacity flex gap-1 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
              setIsEditing(true);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-400 rounded hover:bg-[#30363d]/70 transition-colors"
            title="Edit card"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
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
          <div ref={modalRef} className="bg-[#161b22] rounded-lg shadow-2xl border border-[#30363d] w-full max-w-md mx-4 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
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
                  <label className="block text-gray-400 text-sm mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 text-sm bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner mb-4"
                  />
                  <button type="submit" className="w-full bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 transition-colors">
                    Save
                  </button>
                </form>
              ) : (
                <>
                  <p className="text-gray-200">{task.description || "No description available."}</p>
                  <p className="text-gray-400 mt-2">Due: {task.due_date || "No due date set"}</p>
                  <h4 className="text-gray-400 mt-4">Comments:</h4>
                  <ul className="mt-2 text-gray-300">
                    {comments.map((comment, index) => (
                      <li key={index} className="p-2 bg-[#21262d] rounded mb-2">{comment}</li>
                    ))}
                  </ul>
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment" className="w-full p-2 bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d]" />
                  <button onClick={handleAddComment} className="w-full mt-2 bg-green-600 text-white rounded-md p-2 hover:bg-green-700">Add Comment</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
