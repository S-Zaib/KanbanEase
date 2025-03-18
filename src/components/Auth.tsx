import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'

type AuthProps = {
  onAuthenticated: () => void
}

export default function Auth({ onAuthenticated }: AuthProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to KanbanEase
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your tasks
          </p>
        </div>
        <div className="mt-8">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['github', 'google']}
            onAuthStateChange={(event) => {
              if (event === 'SIGNED_IN') {
                onAuthenticated()
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}