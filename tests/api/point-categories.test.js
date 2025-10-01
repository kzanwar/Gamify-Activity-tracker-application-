/**
 * @jest-environment node
 */

import { GET, POST } from '../../src/app/api/point-categories/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../src/lib/prisma'

// Mock dependencies
jest.mock('next-auth')
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    pointCategory: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    loggedActivity: {
      findMany: jest.fn(),
    },
    loggedTask: {
      findMany: jest.fn(),
    },
  },
}))

const mockGetServerSession = getServerSession

describe('Point Categories API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/point-categories', () => {
    it('should return categories with points for authenticated user', async () => {
      // Mock session
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      // Mock database responses
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Professional',
          color: '#3b82f6',
          benchmarks: [{ id: 'bench-1', pointsRequired: 100 }],
          activities: [{ id: 'act-1' }]
        }
      ]

      const mockActivityPoints = [
        { pointsEarned: 50, activity: { pointCategoryId: 'cat-1' } }
      ]

      prisma.pointCategory.findMany.mockResolvedValue(mockCategories)
      prisma.loggedActivity.findMany.mockResolvedValue(mockActivityPoints)
      prisma.loggedTask.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/point-categories')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.categories).toHaveLength(1)
      expect(data.categories[0].points).toBe(50)
      expect(data.totalPoints).toBe(50)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/point-categories')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      prisma.pointCategory.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/point-categories')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/point-categories', () => {
    it('should create new category for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const mockCategory = {
        id: 'cat-1',
        name: 'Health',
        color: '#10b981',
        userId: 'user-123'
      }

      prisma.pointCategory.findFirst.mockResolvedValue(null) // No existing category
      prisma.pointCategory.create.mockResolvedValue(mockCategory)

      const request = new NextRequest('http://localhost:3000/api/point-categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Health',
          description: 'Health and fitness activities',
          color: '#10b981'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('Health')
      expect(prisma.pointCategory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: 'Health',
          description: 'Health and fitness activities',
          color: '#10b981'
        }
      })
    })

    it('should return 400 for duplicate category name', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      prisma.pointCategory.findFirst.mockResolvedValue({
        id: 'existing-cat',
        name: 'Health'
      })

      const request = new NextRequest('http://localhost:3000/api/point-categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Health',
          description: 'Health and fitness activities'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already exists')
    })

    it('should return 400 for missing name', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123' }
      })

      const request = new NextRequest('http://localhost:3000/api/point-categories', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Health and fitness activities'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
