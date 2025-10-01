import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/DashboardHeader'
import { CalendarView } from '@/components/CalendarView'

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Activity Calendar</h1>
            <p className="mt-2 text-gray-600">
              View your activity patterns and log new activities by date.
            </p>
          </div>

          <CalendarView />
        </div>
      </main>
    </div>
  )
}
