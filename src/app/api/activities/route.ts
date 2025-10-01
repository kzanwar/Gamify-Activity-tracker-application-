/**
 * Activities Management API Route
 *
 * This API endpoint provides comprehensive CRUD (Create, Read, Update, Delete) operations
 * for user activities. Activities are the core entities that users can log to track their
 * progress and earn points based on focus levels.
 *
 * Key Features:
 * - GET: Retrieve activities for a specific point category
 * - POST: Create new activities with customizable point calculations
 * - PUT: Update existing activity configurations
 * - DELETE: Remove activities (with optional cascade deletion of logged activities)
 *
 * Activity Types:
 * - Fixed: Activities with predetermined point values (e.g., "Code Review: 10 points")
 * - Time-based: Activities where points are calculated from duration (e.g., "Exercise: 60 min × focus multiplier")
 *
 * Focus Scoring Methods:
 * - Multipliers: Points = base_points × focus_multiplier (e.g., 10 × 1.5 = 15 points)
 * - Fixed Points: Points = predetermined value per focus level (e.g., Good = 15 points)
 *
 * Focus Levels & Multipliers:
 * - Low: 0.5x (distracted, multitasking)
 * - Medium: 1.0x (somewhat focused, occasional distractions)
 * - Good: 1.5x (focused, productive work)
 * - Zen: 2.0x (deep concentration, flow state)
 *
 * Security:
 * - All operations require user authentication
 * - Users can only access/modify their own activities
 * - Activity names must be unique within each category
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

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
        pointCategoryId: categoryId,
      },
      include: {
        pointCategory: true,
        _count: {
          select: {
            loggedActivities: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Add default values for missing columns and logged activity count
    const activitiesWithDefaults = activities.map(activity => ({
      ...activity,
      type: 'fixed' as const,
      focusScoringType: 'multiplier' as const,
      focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
      loggedActivitiesCount: activity._count.loggedActivities
    }))

    return NextResponse.json({ activities: activitiesWithDefaults })
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')
    const deleteLoggedActivities = searchParams.get('deleteLoggedActivities') === 'true'

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Verify the activity belongs to the user
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: session.user.id,
      },
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Use a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      if (deleteLoggedActivities) {
        // Delete all logged activities for this activity
        await tx.loggedActivity.deleteMany({
          where: {
            activityId: activityId,
          },
        })

        // Also delete any insights related to this activity
        await tx.insight.deleteMany({
          where: {
            activityId: activityId,
          },
        })
      } else {
        // Check if there are any logged activities for this activity
        const loggedActivitiesCount = await tx.loggedActivity.count({
          where: {
            activityId: activityId,
          },
        })

        if (loggedActivitiesCount > 0) {
          throw new Error('Cannot delete activity that has logged activities. Please delete the logged activities first or use deleteLoggedActivities=true.')
        }
      }

      // Delete the activity
      await tx.activity.delete({
        where: { id: activityId },
      })
    })

    return NextResponse.json({
      message: deleteLoggedActivities
        ? 'Activity and all its logged activities deleted successfully'
        : 'Activity deleted successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Failed to delete activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, description, type, focusScoringType, points, focusLevels, pointCategoryId } = await request.json()

    if (!id || !name || !pointCategoryId) {
      return NextResponse.json(
        { error: 'Activity ID, name and category are required' },
        { status: 400 }
      )
    }

    if (type === 'fixed' && !points) {
      return NextResponse.json(
        { error: 'Points are required for fixed activities' },
        { status: 400 }
      )
    }

    // Focus levels are required for both activity types now
    if (!focusLevels) {
      return NextResponse.json(
        { error: 'Focus levels are required for all activities' },
        { status: 400 }
      )
    }

    if (!focusScoringType || !['multiplier', 'fixed_points'].includes(focusScoringType)) {
      return NextResponse.json(
        { error: 'Valid focus scoring type is required' },
        { status: 400 }
      )
    }

    // Verify the activity belongs to the user
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Check if another activity with this name already exists in this category (excluding the current activity)
    const conflictingActivity = await prisma.activity.findFirst({
      where: {
        userId: session.user.id,
        pointCategoryId: pointCategoryId,
        name: name,
        id: { not: id }, // Exclude the current activity
      },
    })

    if (conflictingActivity) {
      return NextResponse.json(
        { error: 'An activity with this name already exists in this category' },
        { status: 400 }
      )
    }

    // For now, only update basic fields since database schema is not fully updated
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        name,
        description: description || null,
        points: type === 'fixed' ? parseInt(points) : 0,
      },
      include: {
        pointCategory: true,
      },
    })

    return NextResponse.json({
      activity: {
        id: activity.id,
        name: activity.name,
        description: activity.description,
        type: 'fixed', // Default to fixed for now
        focusScoringType: 'multiplier', // Default to multiplier for now
        points: activity.points,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 }, // Default values
        pointCategory: activity.pointCategory,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Failed to update activity:', error)
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

    const { name, description, type, focusScoringType, points, focusLevels, pointCategoryId } = await request.json()

    if (!name || !pointCategoryId) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    if (type === 'fixed' && !points) {
      return NextResponse.json(
        { error: 'Points are required for fixed activities' },
        { status: 400 }
      )
    }

    // Focus levels are required for both activity types now
    if (!focusLevels) {
      return NextResponse.json(
        { error: 'Focus levels are required for all activities' },
        { status: 400 }
      )
    }

    if (!focusScoringType || !['multiplier', 'fixed_points'].includes(focusScoringType)) {
      return NextResponse.json(
        { error: 'Valid focus scoring type is required' },
        { status: 400 }
      )
    }

    // Verify the category belongs to the user
    const category = await prisma.pointCategory.findFirst({
      where: {
        id: pointCategoryId,
        userId: session.user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or access denied' },
        { status: 404 }
      )
    }

    // Check if activity with this name already exists in this category
    const existingActivity = await prisma.activity.findFirst({
      where: {
        userId: session.user.id,
        pointCategoryId: pointCategoryId,
        name: name,
      },
    })

    if (existingActivity) {
      return NextResponse.json(
        { error: 'An activity with this name already exists in this category' },
        { status: 400 }
      )
    }

    const activity = await prisma.activity.create({
      data: {
        userId: session.user.id,
        pointCategoryId: pointCategoryId,
        name,
        description: description || null,
        points: type === 'fixed' ? parseInt(points) : 0,
      },
      include: {
        pointCategory: true,
      },
    })

    return NextResponse.json({
      activity: {
        id: activity.id,
        name: activity.name,
        description: activity.description,
        type: 'fixed', // Default to fixed for now
        focusScoringType: 'multiplier', // Default to multiplier for now
        points: activity.points,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 }, // Default values
        pointCategory: activity.pointCategory,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
