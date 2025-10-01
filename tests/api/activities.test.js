/**
 * @jest-environment node
 */

import { GET, POST, PUT, DELETE } from '../../src/app/api/activities/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../src/lib/prisma'

// Mock dependencies
jest.mock('next-auth')
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    activity: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pointCategory: {
      findFirst: jest.fn(),
    },
    loggedActivity: {
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    insight: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const mockGetServerSession = getServerSession

describe('Activities API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/activities', () => {
    it('should return activities for a category', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockActivities = [
        {
          id: 'act-1',
          name: 'Morning Run',
          points: 10,
          pointCategory: { id: 'cat-1', name: 'Health' },
          _count: { loggedActivities: 5 }
        }
      ]

      prisma.activity.findMany.mockResolvedValue(mockActivities)

      const request = new NextRequest('http://localhost:3000/api/activities?categoryId=cat-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.activities).toHaveLength(1)
      expect(data.activities[0].name).toBe('Morning Run')
      expect(data.activities[0].type).toBe('fixed')
      expect(data.activities[0].focusScoringType).toBe('multiplier')
      expect(data.activities[0].loggedActivitiesCount).toBe(5)
    })

    it('should return 400 for missing categoryId', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const request = new NextRequest('http://localhost:3000/api/activities')
      const response = await GET(request)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/activities', () => {
    it('should create new activity', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockCategory = { id: 'cat-1', userId: 'user-123' }
      const mockActivity = {
        id: 'act-1',
        name: 'Code Review',
        points: 15,
        pointCategory: mockCategory
      }

      prisma.pointCategory.findFirst.mockResolvedValue(mockCategory)
      prisma.activity.findFirst.mockResolvedValue(null) // No existing activity
      prisma.activity.create.mockResolvedValue(mockActivity)

      const request = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Code Review',
          description: 'Review team code',
          type: 'fixed',
          focusScoringType: 'multiplier',
          points: 15,
          focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
          pointCategoryId: 'cat-1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.activity.name).toBe('Code Review')
      expect(data.activity.points).toBe(15)
    })

    it('should return 400 for duplicate activity name', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockCategory = { id: 'cat-1', userId: 'user-123' }
      prisma.pointCategory.findFirst.mockResolvedValue(mockCategory)
      prisma.activity.findFirst.mockResolvedValue({
        id: 'existing-act',
        name: 'Code Review'
      })

      const request = new NextRequest('http://localhost:3000/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Code Review',
          type: 'fixed',
          focusScoringType: 'multiplier',
          points: 15,
          focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
          pointCategoryId: 'cat-1'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/activities', () => {
    it('should update existing activity', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Updated Code Review',
        points: 20,
        pointCategory: { id: 'cat-1', name: 'Professional' }
      }

      prisma.activity.findFirst
        .mockResolvedValueOnce({ id: 'act-1', userId: 'user-123' }) // Existing activity check
        .mockResolvedValueOnce(null) // No conflicting activity
      prisma.activity.update.mockResolvedValue(mockActivity)

      const request = new NextRequest('http://localhost:3000/api/activities', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'act-1',
          name: 'Updated Code Review',
          description: 'Updated description',
          type: 'fixed',
          focusScoringType: 'multiplier',
          points: 20,
          focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
          pointCategoryId: 'cat-1'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.activity.name).toBe('Updated Code Review')
      expect(data.activity.points).toBe(20)
    })
  })

  describe('DELETE /api/activities', () => {
    it('should delete activity without logged activities', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      prisma.activity.findFirst.mockResolvedValue({
        id: 'act-1',
        userId: 'user-123'
      })

      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          loggedActivity: {
            count: jest.fn().mockResolvedValue(0)
          },
          activity: {
            delete: jest.fn().mockResolvedValue({})
          }
        }
        return await callback(tx)
      })

      const request = new NextRequest('http://localhost:3000/api/activities?id=act-1')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('deleted successfully')
    })

    it('should delete activity with logged activities when requested', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      prisma.activity.findFirst.mockResolvedValue({
        id: 'act-1',
        userId: 'user-123'
      })

      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          loggedActivity: {
            deleteMany: jest.fn().mockResolvedValue({})
          },
          insight: {
            deleteMany: jest.fn().mockResolvedValue({})
          },
          activity: {
            delete: jest.fn().mockResolvedValue({})
          }
        }
        return await callback(tx)
      })

      const request = new NextRequest('http://localhost:3000/api/activities?id=act-1&deleteLoggedActivities=true')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('and all its logged activities deleted')
    })
  })
})
