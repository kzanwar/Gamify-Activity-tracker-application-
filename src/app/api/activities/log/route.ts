/**
 * Activity Logging API Route
 *
 * This API endpoint handles the logging of user activities with focus levels and point calculations.
 * It processes activity logging requests from the frontend, validates the data, calculates points
 * based on activity type and focus level, and stores the logged activity in the database.
 *
 * Key Features:
 * - Validates user authentication and activity ownership
 * - Supports both fixed-point and time-based activities
 * - Implements focus-based point multipliers (low: 0.5x, medium: 1x, good: 1.5x, zen: 2x)
 * - Handles different scoring methods (multipliers vs fixed points)
 * - Ensures data integrity and proper error handling
 *
 * Request Body:
 * - activityId: string - ID of the activity to log
 * - date: string - Date when the activity was performed (YYYY-MM-DD)
 * - startTime?: string - Start time for time-based activities (HH:MM)
 * - endTime?: string - End time for time-based activities (HH:MM)
 * - focusLevel: string - Focus level ('low', 'medium', 'good', 'zen')
 * - notes?: string - Optional notes about the activity
 *
 * Response:
 * - Success: 201 with logged activity details and points earned
 * - Error: 400/401/404/500 with appropriate error messages
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activityId, date, startTime, endTime, focusLevel, notes } = await request.json()

    if (!activityId || !date) {
      return NextResponse.json(
        { error: 'Activity ID and date are required' },
        { status: 400 }
      )
    }

    // Verify the activity belongs to the user
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: session.user.id,
      },
      include: {
        pointCategory: true,
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate points based on activity type and focus level
    let pointsEarned = 0

    // Get actual activity properties from database
    const activityType = activity.type || 'fixed'
    const focusScoringType = activity.focusScoringType || 'multiplier'
    const focusLevels = activity.focusLevels || { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 }

    console.log('Activity data:', {
      id: activity.id,
      name: activity.name,
      type: activityType,
      focusScoringType: focusScoringType,
      points: activity.points,
      focusLevels: focusLevels
    })

    if (activityType === 'fixed') {
      if (focusScoringType === 'multiplier') {
        const multiplier = focusLevels[focusLevel as keyof typeof focusLevels] || 1.0
        pointsEarned = Math.round(activity.points * multiplier)
        console.log(`Fixed activity calculation: ${activity.points} × ${multiplier} = ${pointsEarned}`)
      } else {
        pointsEarned = focusLevels[focusLevel as keyof typeof focusLevels] || activity.points
        console.log(`Fixed activity fixed points: ${pointsEarned}`)
      }
    } else if (activityType === 'time_based' && startTime && endTime) {
      const start = new Date(`1970-01-01T${startTime}`)
      const end = new Date(`1970-01-01T${endTime}`)
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

      console.log(`Time-based activity duration: ${startTime} to ${endTime} = ${durationMinutes} minutes`)

      if (durationMinutes > 0) {
        if (focusScoringType === 'multiplier') {
          const multiplier = focusLevels[focusLevel as keyof typeof focusLevels] || 1.0
          pointsEarned = Math.round(durationMinutes * multiplier)
          console.log(`Time-based calculation: ${durationMinutes} × ${multiplier} = ${pointsEarned}`)
        } else {
          pointsEarned = focusLevels[focusLevel as keyof typeof focusLevels] || 0
          console.log(`Time-based fixed points: ${pointsEarned}`)
        }
      }
    }

    // Ensure focusLevel is always a string to prevent type conversion errors
    const focusLevelString = focusLevel ? String(focusLevel) : null;

    // Create the logged activity
    const loggedActivity = await prisma.loggedActivity.create({
      data: {
        userId: session.user.id,
        activityId: activityId,
        date: new Date(date),
        startTime: startTime ? new Date(`1970-01-01T${startTime}`) : null,
        endTime: endTime ? new Date(`1970-01-01T${endTime}`) : null,
        focusLevel: focusLevelString,
        notes: notes || null,
        pointsEarned: pointsEarned,
      },
      include: {
        activity: {
          include: {
            pointCategory: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Activity logged successfully!',
      loggedActivity: {
        id: loggedActivity.id,
        pointsEarned: loggedActivity.pointsEarned,
        activity: {
          name: loggedActivity.activity.name,
          pointCategory: {
            name: loggedActivity.activity.pointCategory.name,
            color: loggedActivity.activity.pointCategory.color,
          },
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to log activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}