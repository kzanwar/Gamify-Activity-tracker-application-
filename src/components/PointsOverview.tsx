'use client'

import { useEffect, useState } from 'react'
import { Trophy, Target, TrendingUp, TrendingDown, Clock, Calendar, BarChart3 } from 'lucide-react'

interface DailyData {
  date: string
  totalPoints: number
  categories: {
    name: string
    color: string
    points: number
  }[]
}

interface WeeklyData {
  currentWeek: DailyData[]
  previousWeek: DailyData[]
  currentMonth: DailyData[]
  previousMonth: DailyData[]
}

export function PointsOverview() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/weekly-data')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTodayData = () => {
    if (!data?.currentWeek) return null
    const today = new Date().toISOString().split('T')[0]
    return data.currentWeek.find(day => day.date === today) || {
      date: today,
      totalPoints: 0,
      categories: []
    }
  }

  const getCurrentWeekTotal = () => {
    if (!data?.currentWeek) return 0
    return data.currentWeek.reduce((sum, day) => sum + day.totalPoints, 0)
  }

  const getPreviousWeekTotal = () => {
    if (!data?.previousWeek) return 0
    return data.previousWeek.reduce((sum, day) => sum + day.totalPoints, 0)
  }

  const getCurrentMonthTotal = () => {
    if (!data?.currentMonth) return 0
    return data.currentMonth.reduce((sum, day) => sum + day.totalPoints, 0)
  }

  const getPreviousMonthTotal = () => {
    if (!data?.previousMonth) return 0
    return data.previousMonth.reduce((sum, day) => sum + day.totalPoints, 0)
  }

  const getWeekChange = () => {
    const current = getCurrentWeekTotal()
    const previous = getPreviousWeekTotal()
    if (previous === 0) return { percentage: 0, isIncrease: true }
    const change = ((current - previous) / previous) * 100
    return { percentage: Math.abs(change), isIncrease: change > 0 }
  }

  const getMonthChange = () => {
    const current = getCurrentMonthTotal()
    const previous = getPreviousMonthTotal()
    if (previous === 0) return { percentage: 0, isIncrease: true }
    const change = ((current - previous) / previous) * 100
    return { percentage: Math.abs(change), isIncrease: change > 0 }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const todayData = getTodayData()
  const weekChange = getWeekChange()
  const monthChange = getMonthChange()

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-500" />
            Today's Progress
          </h2>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">
              {todayData?.totalPoints || 0}
            </div>
            <div className="text-sm text-gray-500">Points Today</div>
          </div>
        </div>

        {/* Daily Categories */}
        {todayData && todayData.categories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todayData.categories.map((category) => (
              <div key={category.name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {category.points}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Daily Benchmarks */}
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-indigo-800">Daily Benchmarks</h3>
            <Target className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700">Daily Goal: 50 points</span>
              <span className={`font-medium ${todayData?.totalPoints >= 50 ? 'text-green-600' : 'text-indigo-600'}`}>
                {todayData?.totalPoints || 0}/50
              </span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  todayData?.totalPoints >= 50 ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min((todayData?.totalPoints || 0) / 50 * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-700">Weekly Goal: 300 points</span>
              <span className={`font-medium ${getCurrentWeekTotal() >= 300 ? 'text-green-600' : 'text-indigo-600'}`}>
                {getCurrentWeekTotal()}/300
              </span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  getCurrentWeekTotal() >= 300 ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(getCurrentWeekTotal() / 300 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {(!todayData || todayData.categories.length === 0) && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No activities logged today
            </h3>
            <p className="text-gray-500">
              Start your day by logging some activities!
            </p>
          </div>
        )}
      </div>

      {/* Weekly/Monthly Comparison */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
            Progress Comparison
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setActiveTab('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {activeTab === 'week' ? (
          <div className="space-y-4">
            {/* Weekly Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">This Week</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {getCurrentWeekTotal()}
                </div>
                <div className="text-xs text-blue-600">Total Points</div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">Last Week</span>
                  <span className="text-xs text-gray-500">Previous</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getPreviousWeekTotal()}
                </div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
            </div>

            {/* Weekly Change Indicator */}
            <div className="flex items-center justify-center py-2">
              {weekChange.percentage > 0 ? (
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {weekChange.percentage.toFixed(1)}% more than last week
                  </span>
                </div>
              ) : weekChange.percentage === 0 ? (
                <span className="text-sm text-gray-500">Same as last week</span>
              ) : (
                <div className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {weekChange.percentage.toFixed(1)}% less than last week
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Monthly Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">This Month</span>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {getCurrentMonthTotal()}
                </div>
                <div className="text-xs text-purple-600">Total Points</div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">Last Month</span>
                  <span className="text-xs text-gray-500">Previous</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getPreviousMonthTotal()}
                </div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
            </div>

            {/* Monthly Change Indicator */}
            <div className="flex items-center justify-center py-2">
              {monthChange.percentage > 0 ? (
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {monthChange.percentage.toFixed(1)}% more than last month
                  </span>
                </div>
              ) : monthChange.percentage === 0 ? (
                <span className="text-sm text-gray-500">Same as last month</span>
              ) : (
                <div className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {monthChange.percentage.toFixed(1)}% less than last month
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Day-by-Day Breakdown */}
      {data?.currentWeek && data.currentWeek.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
              This Week's Progress
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const dayData = data.currentWeek[index]
              const isToday = dayData?.date === new Date().toISOString().split('T')[0]

              return (
                <div
                  key={day}
                  className={`text-center p-3 rounded-lg border ${
                    isToday
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 mb-1">{day}</div>
                  <div className={`text-lg font-bold ${
                    isToday ? 'text-primary-600' : 'text-gray-900'
                  }`}>
                    {dayData?.totalPoints || 0}
                  </div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              )
            })}
          </div>

          {data.previousWeek && data.previousWeek.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Last Week Comparison</h4>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                  const dayData = data.previousWeek[index]

                  return (
                    <div key={day} className="text-center p-2 rounded border border-gray-200 bg-gray-25">
                      <div className="text-xs font-medium text-gray-500 mb-1">{day}</div>
                      <div className="text-sm font-bold text-gray-700">
                        {dayData?.totalPoints || 0}
                      </div>
                      <div className="text-xs text-gray-500">pts</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
