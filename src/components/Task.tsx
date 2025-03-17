import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task as TaskType } from '../lib/supabase';
import { useBoardContext } from '../context/BoardContext';

interface TaskProps {
  task: TaskType;
  index: number;
}

const Task: React.FC<TaskProps> = ({ task, index }) => {
  const { updateTask, deleteTask } = useBoardContext();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  const handleSave = async () => {
    await updateTask(task.id, { title, description });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="task-card"
        >
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-1 border border-gray-300 rounded"
                autoFocus
              />
              <textarea
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-1 border border-gray-300 rounded min-h-[60px]"
                placeholder="Description (optional)"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-2 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{task.title}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-gray-700 text-sm px-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-gray-500 hover:text-red-600 text-sm px-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Task;