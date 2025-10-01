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

    // For now, return empty data to avoid database schema issues
    // This will be fixed once the database schema is updated
    const today = new Date().toISOString().split('T')[0]
    
    return NextResponse.json({
      currentWeek: [],
      previousWeek: [],
      currentMonth: [],
      previousMonth: [],
    })

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}