import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Board from './components/Board'
import Auth from './components/Auth'
import Logo from './components/Logo'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] to-[#161b22]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <div className="text-xl text-gray-200">Loading your boards...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth onAuthenticated={() => {}} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1117] to-[#161b22]">
      <header className="sticky top-0 z-10 bg-[#161b22]/90 backdrop-blur-md border-b border-[#30363d] shadow-lg">
        <div className="w-full px-4 py-3 flex justify-between items-center">
          <Logo size="small" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">
              {session.user.email}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="h-[calc(100vh-4rem)]">
        <Board userId={session.user.id} />
      </main>
    </div>
  )
}