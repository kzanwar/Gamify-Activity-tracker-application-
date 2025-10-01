'use client'

import { useState, useEffect } from 'react'
import { Target, Plus, Trophy } from 'lucide-react'

interface PointCategory {
  id: string
  name: string
  color: string
  points: number
  benchmarks: Array<{
    id: string
    name: string
    pointsRequired: number
    achieved: boolean
  }>
}

export function GoalsManager() {
  const [categories, setCategories] = useState<PointCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/point-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: category.color }}
              ></div>
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <span className="ml-2 text-sm text-gray-500">
                {category.points} points earned
              </span>
            </div>
            <button className="btn btn-secondary text-sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Benchmark
            </button>
          </div>

          <div className="space-y-3">
            {category.benchmarks.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No benchmarks set for this category yet.
              </p>
            ) : (
              category.benchmarks.map((benchmark) => (
                <div
                  key={benchmark.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    benchmark.achieved
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    {benchmark.achieved ? (
                      <Trophy className="h-5 w-5 text-green-600 mr-3" />
                    ) : (
                      <Target className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        benchmark.achieved ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {benchmark.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {benchmark.pointsRequired} points required
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      benchmark.achieved ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {benchmark.achieved ? 'Achieved! 🎉' : 'In Progress'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {category.points}/{benchmark.pointsRequired} points
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="card text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No point categories yet
          </h3>
          <p className="text-gray-500">
            Create point categories first to set up goals and benchmarks.
          </p>
        </div>
      )}
    </div>
  )
}
