import React, { useState } from 'react';
import { BoardProvider } from './context/BoardContext';
import Board from './components/Board';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-board">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">KanbanEase</h1>
          <button
            onClick={handleSignOut}
            className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main>
        <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-8">
          <BoardProvider>
            <Board />
          </BoardProvider>
        </div>
      </main>
    </div>
  );
}

export default App;