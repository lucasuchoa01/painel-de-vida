import { useState, useEffect } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { Task, Priority, TaskImpact, SkipReason } from '../types'
import { useAuth } from '../context/AuthContext'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)))
      setLoading(false)
    })
    return unsub
  }, [user])

  const addTask = async (data: {
    title: string
    description?: string
    date: string
    priority: Priority
    impact: TaskImpact
    notificationTime?: string
  }) => {
    if (!user) return
    const cleanData: Record<string, unknown> = {
      title: data.title,
      date: data.date,
      priority: data.priority,
      impact: data.impact,
    }
    if (data.description !== undefined) cleanData.description = data.description
    if (data.notificationTime !== undefined) cleanData.notificationTime = data.notificationTime
    await addDoc(collection(db, 'tasks'), {
      ...cleanData,
      userId: user.uid,
      status: 'pendente',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  const completeTask = async (id: string) => {
    await updateDoc(doc(db, 'tasks', id), { status: 'concluida', updatedAt: Date.now() })
  }

  const skipTask = async (id: string, reason: SkipReason) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const nextDay = format(addDays(new Date(task.date), 1), 'yyyy-MM-dd')
    await updateDoc(doc(db, 'tasks', id), { date: nextDay, reason, updatedAt: Date.now() })
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    await updateDoc(doc(db, 'tasks', id), { ...data, updatedAt: Date.now() })
  }

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id))
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const pendingTasks = tasks.filter((t) => t.status === 'pendente')

  const overdueTasks = pendingTasks.filter((t) => t.date < todayStr)

  const concluidasHoje = tasks.filter(
    (t) => t.status === 'concluida' && t.date === todayStr
  )

  // Tarefas pendentes agrupadas por data (hoje em diante)
  const upcomingTasksByDate: { label: string; date: string; tasks: Task[] }[] = []
  const futurePending = pendingTasks
    .filter((t) => t.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  futurePending.forEach((task) => {
    const existing = upcomingTasksByDate.find((g) => g.date === task.date)
    if (existing) {
      existing.tasks.push(task)
    } else {
      let label = ''
      if (task.date === todayStr) {
        label = 'Hoje'
      } else if (task.date === format(addDays(new Date(), 1), 'yyyy-MM-dd')) {
        label = 'Amanhã'
      } else {
        label = format(new Date(task.date + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })
        label = label.charAt(0).toUpperCase() + label.slice(1)
      }
      upcomingTasksByDate.push({ label, date: task.date, tasks: [task] })
    }
  })

  return {
    tasks,
    todayTasks: pendingTasks.filter((t) => t.date === todayStr),
    overdueTasks,
    concluidasHoje,
    upcomingTasksByDate,
    loading,
    addTask,
    completeTask,
    skipTask,
    updateTask,
    deleteTask,
  }
}
