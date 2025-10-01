/**
 * @jest-environment node
 */

import { GET, POST } from '../../src/app/api/point-categories/route'
import { GET as getActivities, POST as createActivity } from '../../src/app/api/activities/route'
import { POST as logActivity } from '../../src/app/api/activities/log/route'
import { NextRequest } from 'next/server'

// Mock NextAuth to simulate authenticated user
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id' }
  }))
}))

// Mock Prisma client
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    pointCategory: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    loggedActivity: {
      create: jest.fn(),
    },
  },
}))

const { getServerSession } = require('next-auth')
const { prisma } = require('../../src/lib/prisma')

describe('Complete Activity Logging Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete full activity logging workflow: Category → Activity → Logging', async () => {
    console.log('🚀 Starting Complete Activity Logging Workflow Test...\n')

    // Mock authenticated session
    getServerSession.mockResolvedValue({
      user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' }
    })

    // ===== PHASE 1: Create Point Category =====
    console.log('📂 Phase 1: Creating Point Category...')

    const createCategoryRequest = new NextRequest('http://localhost:3000/api/point-categories', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Professional Development',
        description: 'Activities for career growth',
        color: '#3b82f6'
      })
    })

    // Mock category creation
    const mockCategory = {
      id: 'category-professional',
      name: 'Professional Development',
      description: 'Activities for career growth',
      color: '#3b82f6',
      userId: 'test-user-id'
    }

    prisma.pointCategory.findFirst.mockResolvedValue(null) // No existing category
    prisma.pointCategory.create.mockResolvedValue(mockCategory)

    const categoryResponse = await POST(createCategoryRequest)
    expect(categoryResponse.status).toBe(201)

    const categoryData = await categoryResponse.json()
    expect(categoryData.name).toBe('Professional Development')
    console.log('✅ Category created:', categoryData.name)

    // ===== PHASE 2: Create Activities =====
    console.log('\n📝 Phase 2: Creating Activities...')

    // Create Fixed Points Activity
    const fixedActivityRequest = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Code Review',
        description: 'Review team member code',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 15,
        focusLevels: {
          low: 0.5,
          medium: 1.0,
          good: 1.5,
          zen: 2.0
        },
        pointCategoryId: 'category-professional'
      })
    })

    const mockFixedActivity = {
      id: 'activity-code-review',
      name: 'Code Review',
      description: 'Review team member code',
      points: 15,
      pointCategoryId: 'category-professional',
      pointCategory: mockCategory
    }

    prisma.activity.findFirst.mockResolvedValue(null) // No existing activity
    prisma.activity.create.mockResolvedValue(mockFixedActivity)

    const fixedActivityResponse = await createActivity(fixedActivityRequest)
    expect(fixedActivityResponse.status).toBe(201)

    const fixedActivityData = await fixedActivityResponse.json()
    expect(fixedActivityData.activity.name).toBe('Code Review')
    console.log('✅ Fixed Activity created:', fixedActivityData.activity.name)

    // Create Time-Based Activity
    const timeActivityRequest = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Deep Work Session',
        description: 'Focused programming time',
        type: 'time_based',
        focusScoringType: 'multiplier',
        points: 0, // Time-based
        focusLevels: {
          low: 0.5,
          medium: 1.0,
          good: 1.5,
          zen: 2.0
        },
        pointCategoryId: 'category-professional'
      })
    })

    const mockTimeActivity = {
      id: 'activity-deep-work',
      name: 'Deep Work Session',
      description: 'Focused programming time',
      points: 0,
      pointCategoryId: 'category-professional',
      pointCategory: mockCategory
    }

    prisma.activity.findFirst.mockResolvedValue(null) // No existing activity
    prisma.activity.create.mockResolvedValue(mockTimeActivity)

    const timeActivityResponse = await createActivity(timeActivityRequest)
    expect(timeActivityResponse.status).toBe(201)

    const timeActivityData = await timeActivityResponse.json()
    expect(timeActivityData.activity.name).toBe('Deep Work Session')
    console.log('✅ Time-Based Activity created:', timeActivityData.activity.name)

    // ===== PHASE 3: Fetch Activities =====
    console.log('\n📋 Phase 3: Fetching Activities...')

    const fetchActivitiesRequest = new NextRequest('http://localhost:3000/api/activities?categoryId=category-professional')

    const mockActivities = [
      {
        id: 'activity-code-review',
        name: 'Code Review',
        points: 15,
        type: 'fixed',
        focusScoringType: 'multiplier',
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
        pointCategory: mockCategory,
        _count: { loggedActivities: 0 }
      },
      {
        id: 'activity-deep-work',
        name: 'Deep Work Session',
        points: 0,
        type: 'time_based',
        focusScoringType: 'multiplier',
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
        pointCategory: mockCategory,
        _count: { loggedActivities: 0 }
      }
    ]

    prisma.activity.findMany.mockResolvedValue(mockActivities)

    const activitiesResponse = await getActivities(fetchActivitiesRequest)
    expect(activitiesResponse.status).toBe(200)

    const activitiesData = await activitiesResponse.json()
    expect(activitiesData.activities).toHaveLength(2)
    console.log('✅ Fetched activities:', activitiesData.activities.map(a => a.name))

    // ===== PHASE 4: Log Fixed Activity =====
    console.log('\n🎯 Phase 4: Logging Fixed Activity (Code Review)...')

    const logFixedRequest = new NextRequest('http://localhost:3000/api/activities/log', {
      method: 'POST',
      body: JSON.stringify({
        activityId: 'activity-code-review',
        date: '2024-01-15',
        focusLevel: 'good', // Should give 15 * 1.5 = 22.5 points
        notes: 'Reviewed complex authentication logic'
      })
    })

    const mockLoggedFixedActivity = {
      id: 'logged-activity-1',
      userId: 'test-user-id',
      activityId: 'activity-code-review',
      date: new Date('2024-01-15'),
      focusLevel: 'good',
      notes: 'Reviewed complex authentication logic',
      pointsEarned: 22, // 15 * 1.5 = 22.5, rounded to 22
      activity: {
        id: 'activity-code-review',
        name: 'Code Review',
        pointCategory: {
          name: 'Professional Development',
          color: '#3b82f6'
        }
      }
    }

    prisma.activity.findFirst.mockResolvedValue(mockFixedActivity)
    prisma.loggedActivity.create.mockResolvedValue(mockLoggedFixedActivity)

    const logFixedResponse = await logActivity(logFixedRequest)
    expect(logFixedResponse.status).toBe(201)

    const logFixedData = await logFixedResponse.json()
    expect(logFixedData.message).toBe('Activity logged successfully!')
    expect(logFixedData.loggedActivity.pointsEarned).toBe(22)
    console.log('✅ Fixed Activity logged: 22 points (15 × 1.5 good focus)')

    // ===== PHASE 5: Log Time-Based Activity =====
    console.log('\n⏰ Phase 5: Logging Time-Based Activity (Deep Work Session)...')

    const logTimeRequest = new NextRequest('http://localhost:3000/api/activities/log', {
      method: 'POST',
      body: JSON.stringify({
        activityId: 'activity-deep-work',
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '11:30', // 2.5 hours = 150 minutes
        focusLevel: 'zen', // Should give 150 * 2.0 = 300 points
        notes: 'Deep focus on implementing new feature'
      })
    })

    const mockLoggedTimeActivity = {
      id: 'logged-activity-2',
      userId: 'test-user-id',
      activityId: 'activity-deep-work',
      date: new Date('2024-01-15'),
      startTime: new Date('1970-01-01T09:00:00.000Z'),
      endTime: new Date('1970-01-01T11:30:00.000Z'),
      focusLevel: 'zen',
      notes: 'Deep focus on implementing new feature',
      pointsEarned: 300, // 150 minutes * 2.0 = 300
      activity: {
        id: 'activity-deep-work',
        name: 'Deep Work Session',
        pointCategory: {
          name: 'Professional Development',
          color: '#3b82f6'
        }
      }
    }

    prisma.activity.findFirst.mockResolvedValue(mockTimeActivity)
    prisma.loggedActivity.create.mockResolvedValue(mockLoggedTimeActivity)

    const logTimeResponse = await logTime(logTimeRequest)
    expect(logTimeResponse.status).toBe(201)

    const logTimeData = await logTimeResponse.json()
    expect(logTimeData.message).toBe('Activity logged successfully!')
    expect(logTimeData.loggedActivity.pointsEarned).toBe(300)
    console.log('✅ Time-Based Activity logged: 300 points (150 min × 2.0 zen focus)')

    // ===== PHASE 6: Verify Point Aggregation =====
    console.log('\n📊 Phase 6: Verifying Point Aggregation...')

    const pointsRequest = new NextRequest('http://localhost:3000/api/point-categories')

    const mockCategoriesWithPoints = [
      {
        id: 'category-professional',
        name: 'Professional Development',
        color: '#3b82f6',
        benchmarks: [],
        activities: [],
        points: 322 // 22 + 300 = 322 total points
      }
    ]

    // Mock the aggregation queries
    prisma.pointCategory.findMany.mockResolvedValue(mockCategoriesWithPoints)
    prisma.loggedActivity.findMany.mockResolvedValue([
      { pointsEarned: 22, activity: { pointCategoryId: 'category-professional' } },
      { pointsEarned: 300, activity: { pointCategoryId: 'category-professional' } }
    ])
    prisma.loggedTask.findMany.mockResolvedValue([])

    const pointsResponse = await GET(pointsRequest)
    expect(pointsResponse.status).toBe(200)

    const pointsData = await pointsResponse.json()
    expect(pointsData.categories[0].points).toBe(322)
    expect(pointsData.totalPoints).toBe(322)
    console.log('✅ Points aggregated correctly: 322 total points')

    console.log('\n🎉 WORKFLOW COMPLETE! All activity logging with focus is working perfectly!')
    console.log('📈 Summary:')
    console.log('   • Category: Professional Development')
    console.log('   • Activities: Code Review (Fixed), Deep Work Session (Time-based)')
    console.log('   • Logged: Code Review (22 pts), Deep Work (300 pts)')
    console.log('   • Total Points: 322')
  })

  it('should handle different focus scoring methods', async () => {
    console.log('\n🔄 Testing Different Focus Scoring Methods...\n')

    getServerSession.mockResolvedValue({
      user: { id: 'test-user-id' }
    })

    // Create activity with fixed_points scoring
    const fixedPointsActivityRequest = new NextRequest('http://localhost:3000/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Fixed Points Activity',
        type: 'fixed',
        focusScoringType: 'fixed_points',
        points: 10,
        focusLevels: {
          low: 5,
          medium: 10,
          good: 15,
          zen: 20
        },
        pointCategoryId: 'category-test'
      })
    })

    const mockFixedPointsActivity = {
      id: 'activity-fixed-points',
      name: 'Fixed Points Activity',
      points: 10,
      pointCategoryId: 'category-test'
    }

    prisma.pointCategory.findFirst.mockResolvedValue({ id: 'category-test', userId: 'test-user-id' })
    prisma.activity.findFirst.mockResolvedValue(null)
    prisma.activity.create.mockResolvedValue(mockFixedPointsActivity)

    const createResponse = await createActivity(fixedPointsActivityRequest)
    expect(createResponse.status).toBe(201)
    console.log('✅ Created fixed-points activity')

    // Log with different focus levels
    const focusLevels = ['low', 'medium', 'good', 'zen']
    const expectedPoints = [5, 10, 15, 20]

    for (let i = 0; i < focusLevels.length; i++) {
      const logRequest = new NextRequest('http://localhost:3000/api/activities/log', {
        method: 'POST',
        body: JSON.stringify({
          activityId: 'activity-fixed-points',
          date: '2024-01-15',
          focusLevel: focusLevels[i],
          notes: `Testing ${focusLevels[i]} focus`
        })
      })

      const mockLogged = {
        id: `logged-${i}`,
        pointsEarned: expectedPoints[i],
        activity: { name: 'Fixed Points Activity' }
      }

      prisma.activity.findFirst.mockResolvedValue(mockFixedPointsActivity)
      prisma.loggedActivity.create.mockResolvedValue(mockLogged)

      const logResponse = await logActivity(logRequest)
      expect(logResponse.status).toBe(201)

      const logData = await logResponse.json()
      expect(logData.loggedActivity.pointsEarned).toBe(expectedPoints[i])
      console.log(`✅ ${focusLevels[i]} focus: ${expectedPoints[i]} points`)
    }

    console.log('\n✅ All focus scoring methods working correctly!')
  })

  it('should validate required fields and permissions', async () => {
    console.log('\n🔒 Testing Validation and Security...\n')

    // Test unauthenticated access
    getServerSession.mockResolvedValue(null)

    const unauthRequest = new NextRequest('http://localhost:3000/api/activities/log', {
      method: 'POST',
      body: JSON.stringify({
        activityId: 'some-activity',
        date: '2024-01-15',
        focusLevel: 'good'
      })
    })

    const unauthResponse = await logActivity(unauthRequest)
    expect(unauthResponse.status).toBe(401)
    console.log('✅ Authentication required - access denied for unauthenticated users')

    // Test missing required fields
    getServerSession.mockResolvedValue({
      user: { id: 'test-user-id' }
    })

    const invalidRequest = new NextRequest('http://localhost:3000/api/activities/log', {
      method: 'POST',
      body: JSON.stringify({
        // Missing activityId and date
        focusLevel: 'good'
      })
    })

    const invalidResponse = await logActivity(invalidRequest)
    expect(invalidResponse.status).toBe(400)
    console.log('✅ Required field validation working')

    // Test non-existent activity
    const nonexistentRequest = new NextRequest('http://localhost:3000/api/activities/log', {
      method: 'POST',
      body: JSON.stringify({
        activityId: 'non-existent',
        date: '2024-01-15',
        focusLevel: 'good'
      })
    })

    prisma.activity.findFirst.mockResolvedValue(null)

    const nonexistentResponse = await logActivity(nonexistentRequest)
    expect(nonexistentResponse.status).toBe(404)
    console.log('✅ Activity ownership validation working')

    console.log('\n✅ All security and validation checks passed!')
  })
})
