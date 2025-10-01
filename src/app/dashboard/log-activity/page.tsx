import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/DashboardHeader'
import { LogActivityForm } from '@/components/LogActivityForm'

export default async function LogActivityPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Log Activity</h1>
            <p className="mt-2 text-gray-600">
              Record your activities and earn points towards your goals.
            </p>
          </div>

          <LogActivityForm />
        </div>
      </main>
    </div>
  )
}
