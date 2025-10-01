'use client'

import { Plus, Calendar, Target, Settings } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      title: 'Log Activity',
      description: 'Record what you did today',
      icon: Plus,
      href: '/dashboard/log-activity',
      color: 'bg-blue-500'
    },
    {
      title: 'View Calendar',
      description: 'See your activity calendar',
      icon: Calendar,
      href: '/dashboard/calendar',
      color: 'bg-green-500'
    },
    {
      title: 'Manage Goals',
      description: 'Set and track your goals',
      icon: Target,
      href: '/dashboard/goals',
      color: 'bg-purple-500'
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${action.color} text-white mr-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
