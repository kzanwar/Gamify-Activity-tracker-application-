import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/DashboardHeader'
import { GoalsManager } from '@/components/GoalsManager'

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Goals & Benchmarks</h1>
            <p className="mt-2 text-gray-600">
              Set targets and track your progress across different categories.
            </p>
          </div>

          <GoalsManager />
        </div>
      </main>
    </div>
  )
}
