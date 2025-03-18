import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import Logo from './Logo'

type AuthProps = {
  onAuthenticated: () => void
}

export default function Auth({ onAuthenticated }: AuthProps) {
  const darkTheme = {
    ...ThemeSupa,
    colors: {
      ...ThemeSupa.colors,
      brand: '#0284c7',
      brandAccent: '#0369a1',
      brandButtonText: 'white',
      defaultButtonBackground: '#21262d',
      defaultButtonBackgroundHover: '#30363d',
      defaultButtonBorder: '#30363d',
      defaultButtonText: '#e5e7eb',
      inputBackground: '#0d1117',
      inputBorder: '#30363d',
      inputBorderFocus: '#0284c7',
      inputBorderHover: '#3b434f',
      inputText: '#e5e7eb',
      inputLabelText: '#9ca3af',
      inputPlaceholder: '#4b5563',
    },
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] to-[#161b22] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#161b22] p-8 rounded-lg shadow-2xl border border-[#30363d] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="flex flex-col items-center">
          <Logo size="large" />
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-100">
            Welcome to KanbanEase
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to manage your tasks seamlessly
          </p>
        </div>
        <div className="mt-8">
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{ theme: darkTheme }}
            providers={['github', 'google']}
            theme="dark"
          />
        </div>
      </div>
    </div>
  )
}