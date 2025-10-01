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

describe('Activity Logging Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/activities/log - Error Cases', () => {
    it('should catch focusLevel type conversion errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      // Mock valid activity data
      const mockActivity = {
        id: 'act-1',
        name: 'Test Activity',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 10,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
        pointCategory: { id: 'cat-1', name: 'Test', color: '#000' }
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)

      // Mock Prisma error for focusLevel type conversion
      const typeConversionError = new Error('Invalid `prisma.loggedActivity.create()` invocation: Error converting field "focusLevel" of expected non-nullable type "String", found incompatible value of "1735356260"')
      typeConversionError.code = 'P2032' // Prisma type conversion error code

      prisma.loggedActivity.create.mockRejectedValue(typeConversionError)

      // Send request with potentially problematic focusLevel data
      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: 'good', // This should be a string, but something is converting it
          notes: 'Test activity'
        })
      })

      const response = await POST(request)

      // Should catch the error and return 500
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should validate focusLevel is a valid string value', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Test Activity',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 10,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
        pointCategory: { id: 'cat-1', name: 'Test', color: '#000' }
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)
      prisma.loggedActivity.create.mockResolvedValue({ id: 'log-1', pointsEarned: 15 })

      // Test with valid string focusLevel
      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: 'good',
          notes: 'Valid test'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.message).toBe('Activity logged successfully!')
      expect(data.loggedActivity.pointsEarned).toBe(15)
    })

    it('should handle invalid focusLevel values gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Test Activity',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 10,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
        pointCategory: { id: 'cat-1', name: 'Test', color: '#000' }
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)
      prisma.loggedActivity.create.mockResolvedValue({ id: 'log-1', pointsEarned: 10 }) // Should use default multiplier of 1.0

      // Test with invalid focusLevel
      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: 'invalid_focus_level',
          notes: 'Test with invalid focus'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.message).toBe('Activity logged successfully!')
      // Should use default multiplier (1.0) for invalid focus level
      expect(data.loggedActivity.pointsEarned).toBe(10)
    })

    it('should handle numeric focusLevel by converting to string', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Test Activity',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 10,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
        pointCategory: { id: 'cat-1', name: 'Test', color: '#000' }
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)
      prisma.loggedActivity.create.mockResolvedValue({ id: 'log-1', pointsEarned: 10 }) // Default multiplier for invalid focus level

      // Test with numeric focusLevel that should be converted to string
      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: 1735356260, // This numeric value was causing the error
          notes: 'Test with numeric focusLevel'
        })
      })

      const response = await POST(request)

      // Should now succeed with string conversion
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.message).toBe('Activity logged successfully!')
      // Numeric value converts to string "1735356260" which is not a valid focus level,
      // so it should use default multiplier of 1.0
      expect(data.loggedActivity.pointsEarned).toBe(10)

      // Verify that create was called with string focusLevel
      expect(prisma.loggedActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          focusLevel: '1735356260', // Should be converted to string
        }),
        include: expect.any(Object)
      })
    })

    it('should handle null/undefined focusLevel gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'test-user-id' }
      })

      const mockActivity = {
        id: 'act-1',
        name: 'Test Activity',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 10,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
        pointCategory: { id: 'cat-1', name: 'Test', color: '#000' }
      }

      prisma.activity.findFirst.mockResolvedValue(mockActivity)
      prisma.loggedActivity.create.mockResolvedValue({ id: 'log-1', pointsEarned: 10 })

      // Test with null focusLevel
      const request = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'act-1',
          date: '2024-01-15',
          focusLevel: null,
          notes: 'Test with null focusLevel'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.message).toBe('Activity logged successfully!')
      expect(data.loggedActivity.pointsEarned).toBe(10)

      // Verify that create was called with null focusLevel
      expect(prisma.loggedActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          focusLevel: null,
        }),
        include: expect.any(Object)
      })
    })
  })
})
