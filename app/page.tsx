import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Dating Cuba! 💕
        </h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-lg">
          <p className="text-xl mb-4">
            Hello, {user.user_metadata.full_name || user.email}!
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You are successfully logged in with Google OAuth.
          </p>
          <div className="flex gap-4">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
