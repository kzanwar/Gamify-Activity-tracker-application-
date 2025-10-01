/**
 * @jest-environment node
 */

import { POST } from '../../src/app/api/activities/log/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../src/lib/prisma'

// Mock dependencies
jest.mock('next-auth')
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    activity: {
      findFirst: jest.fn(),
    },
    loggedActivity: {
      create: jest.fn(),
    },
  },
}))

const mockGetServerSession = getServerSession

describe('Activity Logging API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/activities/log', () => {
    it('should log fixed activity with focus multiplier', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Morning Run',
        points: 10,
        userId: 'user-123',
        pointCategory: { id: 'cat-1', name: 'Health', color: '#10b981' }
      }

      const mockLoggedActivity = {
        id: 'log-1',
        pointsEarned: 15, // 10 * 1.5 (good focus)
        activity: mockActivity
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)
      prisma.loggedActivity.create.mockResolvedValue(mockLoggedActivity)

      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: 'good',
          notes: 'Great run today!'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Activity logged successfully!')
      expect(data.loggedActivity.pointsEarned).toBe(15)
      expect(data.loggedActivity.activity.name).toBe('Morning Run')
    })

    it('should log time-based activity with duration calculation', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Coding Session',
        points: 0, // Time-based
        userId: 'user-123',
        pointCategory: { id: 'cat-1', name: 'Professional', color: '#3b82f6' }
      }

      const mockLoggedActivity = {
        id: 'log-1',
        pointsEarned: 90, // 60 minutes * 1.5 (good focus)
        activity: mockActivity
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)
      prisma.loggedActivity.create.mockResolvedValue(mockLoggedActivity)

      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '10:00',
          focusLevel: 'good',
          notes: 'Productive coding session'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.loggedActivity.pointsEarned).toBe(90)
    })

    it('should return 400 for missing required fields', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          // Missing activityId and date
          focusLevel: 'good'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent activity', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      prisma.activity.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'non-existent',
          date: '2024-01-15',
          focusLevel: 'good'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: 'good'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Morning Run',
        points: 10,
        userId: 'user-123',
        pointCategory: { id: 'cat-1', name: 'Health', color: '#10b981' }
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)
      prisma.loggedActivity.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: 'good'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
