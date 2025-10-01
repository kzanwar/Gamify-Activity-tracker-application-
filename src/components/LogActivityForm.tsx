/**
 * Activity Logging Form Component
 *
 * This component provides the user interface for logging completed activities with focus levels.
 * It handles the entire activity logging workflow, from selecting categories and activities
 * to calculating and displaying points earned based on focus levels.
 *
 * Key Features:
 * - Dynamic category and activity selection with cascading dropdowns
 * - Real-time point calculation preview based on activity type and focus level
 * - Support for both fixed-point and time-based activities
 * - Focus level selection with descriptive labels and multipliers
 * - Form validation and error handling
 * - Success feedback with automatic redirect to dashboard
 *
 * Activity Types Handled:
 * - Fixed: Shows base points and multiplier calculation (e.g., "10 points × 1.5 = 15 points")
 * - Time-based: Shows duration calculation (e.g., "60 minutes × 1.5 = 90 points")
 *
 * Focus Levels Supported:
 * - Low: 0.5x multiplier (distracted, multitasking)
 * - Medium: 1.0x multiplier (somewhat focused, occasional distractions)
 * - Good: 1.5x multiplier (focused, productive work)
 * - Zen: 2.0x multiplier (deep concentration, flow state)
 *
 * Form Validation:
 * - Required: Category, Activity, Focus Level
 * - Time-based activities require start and end times
 * - All inputs are validated before submission
 *
 * User Experience:
 * - Activity info panel shows calculation method and requirements
 * - Real-time point preview updates as user makes selections
 * - Loading states during form submission
 * - Success/error message display with appropriate styling
 * - Automatic redirect to dashboard after successful logging
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Clock, Target } from 'lucide-react'

interface PointCategory {
  id: string
  name: string
  color: string
}

interface Activity {
  id: string
  name: string
  points: number
  type: 'fixed' | 'time_based'
  focusScoringType: 'multiplier' | 'fixed_points'
  focusLevels?: {
    low: number
    medium: number
    good: number
    zen: number
  }
  pointCategory: PointCategory
}

export function LogActivityForm() {
  const [categories, setCategories] = useState<PointCategory[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedActivity, setSelectedActivity] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [focusLevel, setFocusLevel] = useState<'low' | 'medium' | 'good' | 'zen' | ''>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchActivities(selectedCategory)
    } else {
      setActivities([])
      setSelectedActivity('')
    }
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/point-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchActivities = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/activities?categoryId=${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const selectedActivityData = activities.find(a => a.id === selectedActivity)

    // Focus level is required for all activities
    if (!focusLevel) {
      setMessage('Focus level is required for all activities')
      setIsSubmitting(false)
      return
    }

    // Validation for time-based activities
    if (selectedActivityData?.type === 'time_based') {
      if (!startTime || !endTime) {
        setMessage('Start and end times are required for time-based activities')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const response = await fetch('/api/activities/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: selectedActivity,
          date: new Date().toISOString().split('T')[0],
          startTime: startTime || null,
          endTime: endTime || null,
          focusLevel: focusLevel || null,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        setMessage('Activity logged successfully! 🎉')
        // Reset form
        setSelectedCategory('')
        setSelectedActivity('')
        setStartTime('')
        setEndTime('')
        setFocusLevel('')
        setNotes('')
        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to log activity')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <Plus className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Log New Activity</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Point Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input"
            required
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Activity Selection */}
        {selectedCategory && (
          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
              Activity
            </label>
            <select
              id="activity"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="input"
              required
            >
              <option value="">Select an activity...</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name} {
                    activity.type === 'fixed'
                      ? activity.focusScoringType === 'multiplier'
                        ? `[${activity.points}×] Base × Focus`
                        : `[${activity.points}+] Fixed + Focus`
                      : activity.focusScoringType === 'multiplier'
                        ? '[time×] Duration × Focus'
                        : '[fixed] Fixed per Focus'
                  }
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Activity Info */}
        {selectedActivity && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activities.find(a => a.id === selectedActivity)?.type === 'fixed'
                    ? 'bg-blue-100'
                    : 'bg-green-100'
                }`}>
                  {activities.find(a => a.id === selectedActivity)?.type === 'fixed' ? '🎯' : '⏱️'}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  {activities.find(a => a.id === selectedActivity)?.name}
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  {(() => {
                    const activity = activities.find(a => a.id === selectedActivity);
                    if (!activity) return '';

                    if (activity.type === 'fixed') {
                      return activity.focusScoringType === 'multiplier'
                        ? `Base: ${activity.points} points × Focus multiplier = Total points`
                        : `Points awarded: ${activity.points} + Focus level bonus`;
                    } else {
                      return activity.focusScoringType === 'multiplier'
                        ? 'Points = Duration (minutes) × Focus multiplier'
                        : 'Points awarded based on focus level selected';
                    }
                  })()}
                </p>
                <div className="flex items-center gap-4 text-xs text-blue-600">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      activities.find(a => a.id === selectedActivity)?.type === 'fixed'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}></span>
                    {activities.find(a => a.id === selectedActivity)?.type === 'fixed' ? 'Fixed Points' : 'Time-Based'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      activities.find(a => a.id === selectedActivity)?.focusScoringType === 'multiplier'
                        ? 'bg-purple-500'
                        : 'bg-orange-500'
                    }`}></span>
                    {activities.find(a => a.id === selectedActivity)?.focusScoringType === 'multiplier' ? 'Multipliers' : 'Fixed Values'}
                  </span>
                  {activities.find(a => a.id === selectedActivity)?.type === 'time_based' && (
                    <>
                      <span>•</span>
                      <span className="font-medium">Requires: Start & End Time</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Focus Level */}
        <div>
          <label htmlFor="focusLevel" className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="h-4 w-4 inline mr-1" />
            Focus Level
          </label>
          <select
            id="focusLevel"
            value={focusLevel}
            onChange={(e) => setFocusLevel(e.target.value)}
            className="input"
          >
            <option value="">Select focus level...</option>
            <option value="low">🧘 Low Focus - Distracted, multitasking</option>
            <option value="medium">🤔 Medium Focus - Somewhat focused, occasional distractions</option>
            <option value="good">🎯 Good Focus - Focused, productive work</option>
            <option value="zen">🧘‍♂️ Zen Focus - Deep concentration, flow state</option>
          </select>

          {/* Points Preview */}
          {selectedActivity && focusLevel && (() => {
            const activity = activities.find(a => a.id === selectedActivity);
            if (!activity) return null;

            let points = 0;
            if (activity.type === 'fixed') {
              if (activity.focusScoringType === 'multiplier') {
                points = Math.round(activity.points * (activity.focusLevels?.[focusLevel] || 1));
              } else {
                points = activity.focusLevels?.[focusLevel] || activity.points;
              }
            } else if (activity.type === 'time_based' && startTime && endTime) {
              const start = new Date(`1970-01-01T${startTime}`);
              const end = new Date(`1970-01-01T${endTime}`);
              const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

              if (durationMinutes > 0) {
                if (activity.focusScoringType === 'multiplier') {
                  points = Math.round(durationMinutes * (activity.focusLevels?.[focusLevel] || 1));
                } else {
                  points = activity.focusLevels?.[focusLevel] || 0;
                }
              }
            }

            return (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <span className="font-medium">Expected Points:</span> {points}
                  {activity.type === 'time_based' && startTime && endTime && (
                    <span className="text-green-600 ml-1">
                      ({Math.round((new Date(`1970-01-01T${endTime}`).getTime() - new Date(`1970-01-01T${startTime}`).getTime()) / (1000 * 60))} min × {activity.focusLevels?.[focusLevel] || 1})
                    </span>
                  )}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input"
            placeholder="Any additional notes about this activity..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !selectedActivity}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Logging Activity...' : 'Log Activity'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-md ${message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
