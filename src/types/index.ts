// Database types (aligned with Prisma schema)
export interface User {
  id: string
  name: string | null
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface PointCategory {
  id: string
  userId: string
  name: string
  description: string | null
  color: string
  createdAt: Date
}

export interface Benchmark {
  id: string
  pointCategoryId: string
  name: string
  pointsRequired: number
  description: string | null
  createdAt: Date
}

export interface Activity {
  id: string
  userId: string
  pointCategoryId: string
  name: string
  description: string | null
  points: number
  createdAt: Date
}

export enum TaskType {
  DAILY = 'DAILY',
  TIME_BASED = 'TIME_BASED',
  ADHOC = 'ADHOC'
}

export enum TaskFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface Task {
  id: string
  userId: string
  pointCategoryId: string
  name: string
  description: string | null
  type: TaskType
  frequency: TaskFrequency
  basePoints: number
  isCompleted: boolean
  lastCompletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IntensityLevel {
  id: string
  taskId: string
  name: string
  multiplier: number
  description: string | null
}

export interface LoggedActivity {
  id: string
  userId: string
  activityId: string
  date: Date
  startTime: Date | null
  endTime: Date | null
  focusLevel: number | null
  notes: string | null
  pointsEarned: number
  createdAt: Date
}

export interface LoggedTask {
  id: string
  userId: string
  taskId: string
  date: Date
  startTime: Date | null
  endTime: Date | null
  durationMinutes: number | null
  intensityLevelId: string | null
  notes: string | null
  pointsEarned: number
  createdAt: Date
}

export interface DailyLog {
  id: string
  userId: string
  date: Date
  wakeUpTime: string | null
  workFromHome: boolean | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// Component prop types
export interface PointCategoryWithStats extends PointCategory {
  points: number
  benchmarks: (Benchmark & { achieved: boolean })[]
  activityCount: number
}

export interface RecentActivityItem {
  id: string
  type: 'activity' | 'task'
  name: string
  points: number
  categoryName: string
  categoryColor: string
  date: string
  time?: string
}

// API response types
export interface PointCategoriesResponse {
  categories: PointCategoryWithStats[]
  totalPoints: number
}

export interface RecentActivityResponse {
  activities: RecentActivityItem[]
}

// Form types
export interface CreatePointCategoryForm {
  name: string
  description?: string
  color?: string
}

export interface CreateActivityForm {
  name: string
  description?: string
  points: number
  pointCategoryId: string
}

export interface CreateTaskForm {
  name: string
  description?: string
  type: TaskType
  frequency: TaskFrequency
  basePoints: number
  pointCategoryId: string
  intensityLevels?: Array<{
    name: string
    multiplier: number
    description?: string
  }>
}

export interface LogActivityForm {
  activityId: string
  date: string
  startTime?: string
  endTime?: string
  focusLevel?: number
  notes?: string
}

export interface LogTaskForm {
  taskId: string
  date: string
  startTime?: string
  endTime?: string
  durationMinutes?: number
  intensityLevelId?: string
  notes?: string
}
