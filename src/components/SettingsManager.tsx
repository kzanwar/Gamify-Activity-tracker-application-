/**
 * Settings Management Component
 *
 * This component provides a comprehensive settings interface for managing user activities,
 * goals, and application preferences. It serves as the central hub for configuring
 * the gamified tracking system according to individual user needs.
 *
 * Key Features:
 * - Tabbed interface for different settings categories
 * - Activity management (CRUD operations for activities)
 * - Goal and benchmark configuration
 * - User profile management
 * - Notification preferences
 * - Appearance and theming options
 * - Privacy and security settings
 *
 * Activity Management Features:
 * - Create activities with customizable point calculations
 * - Configure activity types (fixed vs time-based)
 * - Set focus scoring methods (multipliers vs fixed points)
 * - Define focus level multipliers for each activity
 * - Edit existing activities with real-time validation
 * - Delete activities with cascade options for logged data
 *
 * Activity Configuration Options:
 * - Activity Type: Fixed (predetermined points) or Time-based (duration × multiplier)
 * - Focus Scoring: Multipliers (base × focus) or Fixed Points (preset values per level)
 * - Focus Levels: Custom multipliers for Low (0.5x), Medium (1.0x), Good (1.5x), Zen (2.0x)
 * - Category Assignment: Organize activities under point categories
 *
 * User Experience Features:
 * - Form validation with real-time feedback
 * - Example calculations showing how points are computed
 * - Color-coded focus levels for easy identification
 * - Confirmation dialogs for destructive operations
 * - Success/error messaging with appropriate styling
 * - Responsive design for mobile and desktop use
 *
 * Data Integrity:
 * - Prevents duplicate activity names within categories
 * - Validates required fields before submission
 * - Handles concurrent edits and data conflicts
 * - Maintains referential integrity with cascade operations
 */

'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Palette, Shield, Plus, Target } from 'lucide-react'

interface PointCategory {
  id: string
  name: string
  color: string
  activities: Array<{
    id: string
    name: string
    points: number
    description?: string
    type: 'fixed' | 'time_based'
    focusScoringType: 'multiplier' | 'fixed_points'
    focusLevels: {
      low: number
      medium: number
      good: number
      zen: number
    }
    loggedActivitiesCount: number
  }>
}

export function SettingsManager() {
  const [activeTab, setActiveTab] = useState('activities')
  const [categories, setCategories] = useState<PointCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activityName, setActivityName] = useState('')
  const [activityType, setActivityType] = useState<'fixed' | 'time_based'>('fixed')
  const [focusScoringType, setFocusScoringType] = useState<'multiplier' | 'fixed_points'>('multiplier')
  const [activityPoints, setActivityPoints] = useState('')
  const [activityDescription, setActivityDescription] = useState('')
  const [focusLevels, setFocusLevels] = useState({
    low: '',
    medium: '',
    good: '',
    zen: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [editingActivity, setEditingActivity] = useState<string | null>(null)

  const tabs = [
    { id: 'activities', name: 'Activities', icon: Target },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'privacy', name: 'Privacy', icon: Shield },
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/point-categories')
      if (response.ok) {
        const data = await response.json()
        // Fetch activities for each category
        const categoriesWithActivities = await Promise.all(
          data.categories.map(async (category: any) => {
            const activitiesResponse = await fetch(`/api/activities?categoryId=${category.id}`)
            const activitiesData = activitiesResponse.ok ? await activitiesResponse.json() : { activities: [] }
            return {
              ...category,
              activities: activitiesData.activities || []
            }
          })
        )
        setCategories(categoriesWithActivities)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity.id)
    setSelectedCategory(activity.pointCategoryId || activity.pointCategory?.id)
    setActivityName(activity.name)
    setActivityType(activity.type)
    setFocusScoringType(activity.focusScoringType)
    setActivityPoints(activity.points?.toString() || '')
    setActivityDescription(activity.description || '')
    setFocusLevels({
      low: activity.focusLevels?.low?.toString() || '',
      medium: activity.focusLevels?.medium?.toString() || '',
      good: activity.focusLevels?.good?.toString() || '',
      zen: activity.focusLevels?.zen?.toString() || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingActivity(null)
    setSelectedCategory('')
    setActivityName('')
    setActivityType('fixed')
    setFocusScoringType('multiplier')
    setActivityPoints('')
    setActivityDescription('')
    setFocusLevels({ low: '', medium: '', good: '', zen: '' })
  }

  const handleDeleteActivity = async (activityId: string, activityName: string, hasLoggedActivities: boolean = false) => {
    let confirmMessage = `Are you sure you want to delete "${activityName}"?`

    if (hasLoggedActivities) {
      const deleteLoggedActivities = confirm(
        `${confirmMessage}\n\nThis activity has logged activities associated with it.\n\nClick "OK" to delete the activity AND all its logged activities.\nClick "Cancel" to keep the activity.`
      )

      if (!deleteLoggedActivities) {
        return
      }

      // Delete with logged activities
      setIsSubmitting(true)
      setMessage('')

      try {
        const response = await fetch(`/api/activities?id=${activityId}&deleteLoggedActivities=true`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setMessage(`Activity "${activityName}" and all its logged activities deleted successfully!`)
          fetchCategories() // Refresh the list
          setTimeout(() => setMessage(''), 3000)
        } else {
          const data = await response.json()
          setMessage(data.error || 'Failed to delete activity')
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Simple delete for activities without logged activities
      confirmMessage += ' This action cannot be undone.'

      if (!confirm(confirmMessage)) {
        return
      }

      setIsSubmitting(true)
      setMessage('')

      try {
        const response = await fetch(`/api/activities?id=${activityId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setMessage(`Activity "${activityName}" deleted successfully!`)
          fetchCategories() // Refresh the list
          setTimeout(() => setMessage(''), 3000)
        } else {
          const data = await response.json()
          setMessage(data.error || 'Failed to delete activity')
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingActivity || !selectedCategory || !activityName) return

    // Validate focus levels for all activities
    const focusValues = Object.values(focusLevels)
    if (focusValues.some(val => val === '' || parseFloat(val) <= 0)) {
      setMessage('Please fill in all focus level multipliers')
      return
    }

    if (activityType === 'fixed' && !activityPoints) {
      setMessage('Please enter points for fixed activities')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/activities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingActivity,
          name: activityName,
          description: activityDescription || null,
          type: activityType,
          focusScoringType: focusScoringType,
          points: activityType === 'fixed' ? parseInt(activityPoints) : 0,
          focusLevels: {
            low: parseFloat(focusLevels.low || '0.5'),
            medium: parseFloat(focusLevels.medium || '1.0'),
            good: parseFloat(focusLevels.good || '1.5'),
            zen: parseFloat(focusLevels.zen || '2.0'),
          },
          pointCategoryId: selectedCategory,
        }),
      })

      if (response.ok) {
        setMessage('Activity updated successfully! 🎉')
        setEditingActivity(null)
        handleCancelEdit()
        fetchCategories() // Refresh the list
        setTimeout(() => setMessage(''), 3000)
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to update activity')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory || !activityName) return

    // Validate focus levels for all activities
    const focusValues = Object.values(focusLevels)
    if (focusValues.some(val => val === '' || parseFloat(val) <= 0)) {
      setMessage('Please fill in all focus level multipliers')
      return
    }

    if (activityType === 'fixed' && !activityPoints) {
      setMessage('Please enter points for fixed activities')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: activityName,
          description: activityDescription || null,
          type: activityType,
          focusScoringType: focusScoringType,
          points: activityType === 'fixed' ? parseInt(activityPoints) : 0,
          focusLevels: {
            low: parseFloat(focusLevels.low || (focusScoringType === 'multiplier' ? '0.5' : '5')),
            medium: parseFloat(focusLevels.medium || (focusScoringType === 'multiplier' ? '1.0' : '10')),
            good: parseFloat(focusLevels.good || (focusScoringType === 'multiplier' ? '1.5' : '15')),
            zen: parseFloat(focusLevels.zen || (focusScoringType === 'multiplier' ? '2.0' : '20')),
          },
          pointCategoryId: selectedCategory,
        }),
      })

      if (response.ok) {
        setMessage('Activity added successfully! 🎉')
        setActivityName('')
        setActivityType('fixed')
        setFocusScoringType('multiplier')
        setActivityPoints('')
        setActivityDescription('')
        setSelectedCategory('')
        setFocusLevels({ low: '', medium: '', good: '', zen: '' })
        fetchCategories() // Refresh the list
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to add activity')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 inline mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Activities</h3>

                  {/* Add/Edit Activity Form */}
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                      {editingActivity ? (
                        <>
                          <span className="h-4 w-4 mr-2">✏️</span>
                          Edit Activity
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Activity
                        </>
                      )}
                    </h4>
                <form onSubmit={editingActivity ? handleUpdateActivity : handleAddActivity} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input"
                        required
                      >
                        <option value="">Select category...</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="activityName" className="block text-sm font-medium text-gray-700 mb-1">
                        Activity Name
                      </label>
                      <input
                        type="text"
                        id="activityName"
                        value={activityName}
                        onChange={(e) => setActivityName(e.target.value)}
                        className="input"
                        placeholder="e.g., Morning Run, Code Review"
                        required
                      />
                    </div>
                  </div>

                  {/* Activity Type Toggle */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Activity Type</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {activityType === 'fixed'
                            ? 'Fixed points earned each completion'
                            : 'Points calculated from time spent'
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          activityType === 'fixed'
                            ? 'bg-primary-100 text-primary-800'
                            : 'text-gray-500'
                        }`}>
                          Fixed Points
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivityType(activityType === 'fixed' ? 'time_based' : 'fixed')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            activityType === 'time_based' ? 'bg-primary-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              activityType === 'time_based' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          activityType === 'time_based'
                            ? 'bg-primary-100 text-primary-800'
                            : 'text-gray-500'
                        }`}>
                          Time-Based
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Focus Scoring Method Toggle */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Focus Scoring Method</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {focusScoringType === 'multiplier'
                            ? 'Multiply base points by focus level'
                            : 'Fixed points for each focus level'
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          focusScoringType === 'multiplier'
                            ? 'bg-purple-100 text-purple-800'
                            : 'text-gray-500'
                        }`}>
                          × Multipliers
                        </span>
                        <button
                          type="button"
                          onClick={() => setFocusScoringType(focusScoringType === 'multiplier' ? 'fixed_points' : 'multiplier')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                            focusScoringType === 'fixed_points' ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              focusScoringType === 'fixed_points' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          focusScoringType === 'fixed_points'
                            ? 'bg-purple-100 text-purple-800'
                            : 'text-gray-500'
                        }`}>
                          Fixed Points
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Points Configuration */}
                  {activityType === 'fixed' && (
                    <div>
                      <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                        Base Points Value
                      </label>
                      <input
                        type="number"
                        id="points"
                        value={activityPoints}
                        onChange={(e) => setActivityPoints(e.target.value)}
                        className="input"
                        placeholder="10"
                        min="1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Base points × focus multiplier = total points earned
                      </p>
                    </div>
                  )}

                  {/* Focus Level Values - Required for all activity types */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {focusScoringType === 'multiplier' ? 'Focus Level Multipliers' : 'Focus Level Points'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Set values for each focus level
                        </p>
                      </div>
                      <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {focusScoringType === 'multiplier' ? '× values' : 'Point values'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-red-800">🧘 Low Focus</span>
                          <span className="text-xs text-red-600 font-medium">
                            {focusScoringType === 'multiplier' ? '×' : ''}
                          </span>
                        </div>
                        <input
                          type="number"
                          id="low"
                          value={focusLevels.low}
                          onChange={(e) => setFocusLevels(prev => ({ ...prev, low: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder={focusScoringType === 'multiplier' ? '0.5' : '5'}
                          step={focusScoringType === 'multiplier' ? '0.1' : '1'}
                          min={focusScoringType === 'multiplier' ? '0.1' : '0'}
                          required
                        />
                        <p className="text-xs text-red-600 mt-1">
                          Distracted, multitasking
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-yellow-800">🤔 Medium Focus</span>
                          <span className="text-xs text-yellow-600 font-medium">
                            {focusScoringType === 'multiplier' ? '×' : ''}
                          </span>
                        </div>
                        <input
                          type="number"
                          id="medium"
                          value={focusLevels.medium}
                          onChange={(e) => setFocusLevels(prev => ({ ...prev, medium: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder={focusScoringType === 'multiplier' ? '1.0' : '10'}
                          step={focusScoringType === 'multiplier' ? '0.1' : '1'}
                          min={focusScoringType === 'multiplier' ? '0.1' : '0'}
                          required
                        />
                        <p className="text-xs text-yellow-600 mt-1">
                          Some focus, minor distractions
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">🎯 Good Focus</span>
                          <span className="text-xs text-blue-600 font-medium">
                            {focusScoringType === 'multiplier' ? '×' : ''}
                          </span>
                        </div>
                        <input
                          type="number"
                          id="good"
                          value={focusLevels.good}
                          onChange={(e) => setFocusLevels(prev => ({ ...prev, good: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={focusScoringType === 'multiplier' ? '1.5' : '15'}
                          step={focusScoringType === 'multiplier' ? '0.1' : '1'}
                          min={focusScoringType === 'multiplier' ? '0.1' : '0'}
                          required
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Focused, productive work
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-800">🧘‍♂️ Zen Focus</span>
                          <span className="text-xs text-green-600 font-medium">
                            {focusScoringType === 'multiplier' ? '×' : ''}
                          </span>
                        </div>
                        <input
                          type="number"
                          id="zen"
                          value={focusLevels.zen}
                          onChange={(e) => setFocusLevels(prev => ({ ...prev, zen: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder={focusScoringType === 'multiplier' ? '2.0' : '20'}
                          step={focusScoringType === 'multiplier' ? '0.1' : '1'}
                          min={focusScoringType === 'multiplier' ? '0.1' : '0'}
                          required
                        />
                        <p className="text-xs text-green-600 mt-1">
                          Deep concentration, flow state
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        <strong>Example calculation:</strong> {
                          activityType === 'fixed'
                            ? focusScoringType === 'multiplier'
                              ? `${activityPoints || '10'} base points × ${focusLevels.good || '1.5'} (Good Focus) = ${(parseFloat(activityPoints || '10') * parseFloat(focusLevels.good || '1.5')).toFixed(1)} points`
                              : `${focusLevels.good || '15'} points for Good Focus`
                            : focusScoringType === 'multiplier'
                              ? `30 minutes × ${focusLevels.good || '1.5'} (Good Focus) = ${(30 * parseFloat(focusLevels.good || '1.5')).toFixed(1)} points`
                              : `${focusLevels.good || '15'} points for Good Focus`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      id="description"
                      value={activityDescription}
                      onChange={(e) => setActivityDescription(e.target.value)}
                      className="input"
                      placeholder="Brief description..."
                    />
                  </div>

                      {/* Submit Button */}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting
                            ? (editingActivity ? 'Updating Activity...' : 'Adding Activity...')
                            : (editingActivity ? 'Update Activity' : 'Add Activity')
                          }
                        </button>
                        {editingActivity && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                </form>
              </div>

              {/* Display Existing Activities */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Your Activities</h4>
                {categories.length === 0 ? (
                  <p className="text-gray-500">Loading categories...</p>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <h5 className="font-medium text-gray-900">{category.name}</h5>
                          <span className="ml-2 text-sm text-gray-500">
                            ({category.activities.length} activities)
                          </span>
                        </div>
                        {category.activities.length === 0 ? (
                          <p className="text-gray-500 text-sm">No activities in this category yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {category.activities.map((activity) => (
                              <div key={activity.id} className="bg-white p-4 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">{activity.name}</p>
                                    <div className="flex gap-1">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        activity.type === 'fixed'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {activity.type === 'fixed' ? 'Fixed' : 'Time-Based'}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        activity.focusScoringType === 'multiplier'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        {activity.focusScoringType === 'multiplier' ? '× Multiplier' : 'Fixed Points'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditActivity(activity)}
                                      className="text-gray-400 hover:text-gray-600 text-sm"
                                      title="Edit activity"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteActivity(activity.id, activity.name, activity.loggedActivitiesCount > 0)}
                                      className="text-red-400 hover:text-red-600 text-sm"
                                      title="Delete activity"
                                      disabled={isSubmitting}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>

                                {activity.description && (
                                  <p className="text-sm text-gray-500 mb-2">{activity.description}</p>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-600">
                                    {activity.type === 'fixed' ? (
                                      <div className="space-y-1">
                                        <div>Base: +{activity.points} points</div>
                                        <div className="text-xs">
                                          {activity.focusScoringType === 'multiplier'
                                            ? '× Focus multiplier = total points'
                                            : 'Fixed points per focus level'
                                          }
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <div className="text-xs font-medium">
                                          {activity.focusScoringType === 'multiplier' ? 'Focus Multipliers:' : 'Focus Points:'}
                                        </div>
                                        <div className="flex space-x-3 text-xs">
                                          <span>L: {activity.focusLevels?.low || 0}{activity.focusScoringType === 'multiplier' ? 'x' : ''}</span>
                                          <span>M: {activity.focusLevels?.medium || 0}{activity.focusScoringType === 'multiplier' ? 'x' : ''}</span>
                                          <span>G: {activity.focusLevels?.good || 0}{activity.focusScoringType === 'multiplier' ? 'x' : ''}</span>
                                          <span>Z: {activity.focusLevels?.zen || 0}{activity.focusScoringType === 'multiplier' ? 'x' : ''}</span>
                                        </div>
                                        <div className="text-xs">
                                          {activity.focusScoringType === 'multiplier'
                                            ? 'Points = Time (minutes) × multiplier'
                                            : 'Points = Fixed value per focus level'
                                          }
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('successfully')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 input"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 input"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="goal-reminders"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="goal-reminders" className="ml-2 block text-sm text-gray-900">
                  Daily goal reminders
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="achievement-notifications"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="achievement-notifications" className="ml-2 block text-sm text-gray-900">
                  Achievement notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="weekly-reports"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="weekly-reports" className="ml-2 block text-sm text-gray-900">
                  Weekly progress reports
                </label>
              </div>
            </div>
            <div>
              <button className="btn btn-primary">Save Preferences</button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select className="input">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Scheme
                </label>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                  <div className="w-8 h-8 bg-green-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                  <div className="w-8 h-8 bg-purple-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                  <div className="w-8 h-8 bg-pink-500 rounded-full cursor-pointer border-2 border-gray-300"></div>
                </div>
              </div>
            </div>
            <div>
              <button className="btn btn-primary">Save Appearance</button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Privacy & Security</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Data Export</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Download all your activity data and settings.
                </p>
                <button className="btn btn-secondary">Export Data</button>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Permanently delete your account and all associated data.
                </p>
                <button className="btn bg-red-600 text-white hover:bg-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
