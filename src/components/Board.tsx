import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import TaskList from './TaskList';
import { useBoardContext } from '../context/BoardContext';

const Board: React.FC = () => {
  const { lists, tasks, createList, moveTask, isLoading, error } = useBoardContext();
  const [newListName, setNewListName] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area or in the same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Move task to a new list
    if (destination.droppableId !== source.droppableId) {
      moveTask(draggableId, destination.droppableId);
    }
  };

  const handleAddList = async () => {
    if (newListName.trim()) {
      await createList(newListName.trim());
      setNewListName('');
      setIsAddingList(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading your board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board">
        {lists.map((list) => (
          <TaskList
            key={list.id}
            list={list}
            tasks={tasks.filter((task) => task.list_id === list.id)}
          />
        ))}

        {isAddingList ? (
          <div className="list-column bg-white">
            <div className="space-y-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="List name"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAddingList(false)}
                  className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddList}
                  className="px-2 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="list-column bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
          >
            + Add List
          </button>
        )}
      </div>
    </DragDropContext>
  );
};

export default Board;