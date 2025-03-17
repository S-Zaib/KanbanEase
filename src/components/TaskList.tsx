import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Task from './Task';
import { List, Task as TaskType } from '../lib/supabase';
import { useBoardContext } from '../context/BoardContext';

interface TaskListProps {
  list: List;
  tasks: TaskType[];
}

const TaskList: React.FC<TaskListProps> = ({ list, tasks }) => {
  const { createTask, updateList, deleteList } = useBoardContext();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  const [listName, setListName] = useState(list.name);

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      await createTask(list.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleUpdateList = async () => {
    if (listName.trim()) {
      await updateList(list.id, listName.trim());
      setIsEditingList(false);
    }
  };

  const handleDeleteList = async () => {
    if (window.confirm('Are you sure you want to delete this list and all its tasks?')) {
      await deleteList(list.id);
    }
  };

  return (
    <div className="list-column">
      {isEditingList ? (
        <div className="mb-3 flex">
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="flex-1 p-1 border border-gray-300 rounded"
            autoFocus
          />
          <button
            onClick={handleUpdateList}
            className="ml-2 px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditingList(false)}
            className="ml-1 px-2 py-1 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mb-3 flex justify-between items-center">
          <h2 className="list-title">{list.name}</h2>
          <div className="flex space-x-1">
            <button
              onClick={() => setIsEditingList(true)}
              className="text-gray-500 hover:text-gray-700 text-sm px-1"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteList}
              className="text-gray-500 hover:text-red-600 text-sm px-1"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <Droppable droppableId={list.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="min-h-[100px]"
          >
            {tasks.map((task, index) => (
              <Task key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {isAddingTask ? (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Task title"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingTask(false)}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="px-2 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingTask(true)}
          className="w-full mt-2 p-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        >
          + Add Task
        </button>
      )}
    </div>
  );
};

export default TaskList;