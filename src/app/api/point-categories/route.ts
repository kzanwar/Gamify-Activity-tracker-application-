/**
 * Point Categories Management API Route
 *
 * This API endpoint manages point categories, which are the top-level organizational units
 * for grouping related activities. Categories help users organize their goals and track
 * progress across different life domains (e.g., "Professional", "Health", "Personal").
 *
 * Key Features:
 * - GET: Retrieve all categories for the authenticated user with aggregated point totals
 * - POST: Create new point categories with custom colors and descriptions
 *
 * Point Aggregation Logic:
 * - Combines points from both activities and tasks within each category
 * - Calculates total points earned across all logged activities in the category
 * - Includes benchmarks/levels for goal tracking within each category
 * - Optimized N+1 query prevention using bulk database operations
 *
 * Category Properties:
 * - name: Unique identifier for the category (e.g., "Professional Development")
 * - description: Optional detailed explanation of the category's purpose
 * - color: Hex color code for UI theming and visual organization
 * - points: Calculated total points earned in this category
 * - benchmarks: Achievement levels/goals for motivation and progress tracking
 *
 * Database Optimization:
 * - Uses bulk queries to prevent N+1 problems when calculating points
 * - Aggregates activity and task points in memory for efficient processing
 * - Maintains referential integrity with cascading deletes
 *
 * Security:
 * - All operations require user authentication
 * - Users can only access their own categories
 * - Category names must be unique per user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all point categories with their benchmarks and calculate points efficiently
    const categories = await prisma.pointCategory.findMany({
      where: { userId: session.user.id },
      include: {
        benchmarks: {
          orderBy: { pointsRequired: 'asc' }
        },
        activities: {
          select: {
            id: true
          }
        }
      }
    })

    // Get activity points grouped by category in a single query
    const activityPointsResult = await prisma.loggedActivity.findMany({
      where: {
        userId: session.user.id,
        activity: {
          pointCategoryId: {
            in: categories.map(c => c.id)
          }
        }
      },
      select: {
        pointsEarned: true,
        activity: {
          select: {
            pointCategoryId: true
          }
        }
      }
    })

    // Get task points grouped by category in a single query
    const taskPointsResult = await prisma.loggedTask.findMany({
      where: {
        userId: session.user.id,
        task: {
          pointCategoryId: {
            in: categories.map(c => c.id)
          }
        }
      },
      select: {
        pointsEarned: true,
        task: {
          select: {
            pointCategoryId: true
          }
        }
      }
    })

    // Aggregate points by category
    const activityPointsMap = new Map()
    const taskPointsMap = new Map()

    for (const item of activityPointsResult) {
      const categoryId = item.activity?.pointCategoryId
      if (categoryId) {
        activityPointsMap.set(categoryId, (activityPointsMap.get(categoryId) || 0) + (item.pointsEarned || 0))
      }
    }

    for (const item of taskPointsResult) {
      const categoryId = item.task?.pointCategoryId
      if (categoryId) {
        taskPointsMap.set(categoryId, (taskPointsMap.get(categoryId) || 0) + (item.pointsEarned || 0))
      }
    }

    // Build the final result
    const categoriesWithPoints = categories.map(category => {
      const activityPoints = activityPointsMap.get(category.id) || 0
      const taskPoints = taskPointsMap.get(category.id) || 0
      const totalPoints = activityPoints + taskPoints

      // Mark benchmarks as achieved
      const benchmarksWithStatus = category.benchmarks.map(benchmark => ({
        ...benchmark,
        achieved: totalPoints >= benchmark.pointsRequired
      }))

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        points: totalPoints,
        benchmarks: benchmarksWithStatus,
        activityCount: category.activities.length
      }
    })

    // Calculate total points across all categories
    const totalPoints = categoriesWithPoints.reduce((sum, cat) => sum + cat.points, 0)

    return NextResponse.json({
      categories: categoriesWithPoints,
      totalPoints
    })
  } catch (error) {
    console.error('Failed to fetch point categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, color } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if category with this name already exists for this user
    const existingCategory = await prisma.pointCategory.findFirst({
      where: {
        userId: session.user.id,
        name: name
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.pointCategory.create({
      data: {
        userId: session.user.id,
        name,
        description,
        color: color || '#3b82f6'
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create point category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
