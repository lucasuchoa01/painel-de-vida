export type Priority = 'alta' | 'media' | 'baixa'
export type TaskStatus = 'pendente' | 'concluida'
export type TaskImpact = 'ganha' | 'gasta' | 'neutro'
export type SkipReason = 'preguica' | 'tempo' | 'esqueci' | 'dificil'

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  date: string // ISO date string YYYY-MM-DD
  priority: Priority
  status: TaskStatus
  impact: TaskImpact
  reason?: SkipReason
  notificationTime?: string // HH:MM
  createdAt: number
  updatedAt: number
}

export interface Idea {
  id: string
  userId: string
  content: string
  createdAt: number
}

export interface Distraction {
  id: string
  userId: string
  text: string
  createdAt: number
}

export interface Discarded {
  id: string
  userId: string
  text: string
  createdAt: number
}

export interface Direction {
  id: string
  userId: string
  lifeDirection: string
  idealSelf: string
  weeklyFocus: string[]
  values: string[]
  updatedAt: number
}

export interface DailyLog {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  good: string
  bad: string
  improve: string
  createdAt: number
}

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
}
