/**
 * Main Dashboard Page
 *
 * This is the primary dashboard interface that users see after logging in.
 * It provides a comprehensive overview of their activity tracking progress
 * and serves as the central hub for all gamified tracking features.
 *
 * Dashboard Layout:
 * - Header: Navigation, user info, and quick access to settings
 * - Points Overview: Today's progress, benchmarks, and comparisons
 * - Quick Actions: Fast access to activity logging
 * - Recent Activity: Timeline of completed activities
 * - Calendar View: Date picker for historical data
 *
 * Key Features:
 * - Real-time data aggregation from multiple API endpoints
 * - Responsive grid layout adapting to screen sizes
 * - Server-side authentication checking with redirects
 * - Optimized data fetching with parallel API calls
 *
 * Data Sources:
 * - /api/point-categories: Category points and benchmarks
 * - /api/dashboard/weekly-data: Weekly/monthly comparisons
 * - /api/recent-activity: Recent activity feed
 * - NextAuth session: User authentication status
 *
 * Performance Optimizations:
 * - Server-side rendering for initial page load
 * - Parallel API calls for faster data loading
 * - Lazy loading for non-critical components
 * - Optimized re-renders with proper state management
 *
 * User Experience:
 * - Clean, gamified interface encouraging daily engagement
 * - Color-coded progress indicators
 * - Intuitive navigation between features
 * - Mobile-responsive design for on-the-go access
 */

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from '@/components/DashboardHeader'
import { PointsOverview } from '@/components/PointsOverview'
import { QuickActions } from '@/components/QuickActions'
import { RecentActivity } from '@/components/RecentActivity'
import { CalendarView } from '@/components/CalendarView'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column - Points and Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <PointsOverview />
              <QuickActions />
              <CalendarView />
            </div>

            {/* Right column - Recent Activity */}
            <div className="space-y-6">
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
