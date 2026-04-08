import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { Task, Priority, TaskImpact, SkipReason } from '../types'
import { useAuth } from '../context/AuthContext'
import { format, addDays } from 'date-fns'

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
    const cleanData = Object.fromEntries(
  Object.entries(data).filter(([, v]) => v !== undefined)
)
await addDoc(collection(db, 'tasks'), {
  ...cleanData,
  userId: user.uid,
  status: 'pendente',
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

  const completeTask = async (id: string) => {
    await updateDoc(doc(db, 'tasks', id), {
      status: 'concluida',
      updatedAt: Date.now(),
    })
  }

  const skipTask = async (id: string, reason: SkipReason) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const nextDay = format(addDays(new Date(task.date), 1), 'yyyy-MM-dd')
    await updateDoc(doc(db, 'tasks', id), {
      date: nextDay,
      reason,
      updatedAt: Date.now(),
    })
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    await updateDoc(doc(db, 'tasks', id), { ...data, updatedAt: Date.now() })
  }

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id))
  }

  const todayTasks = tasks.filter(
    (t) => t.date === format(new Date(), 'yyyy-MM-dd') && t.status === 'pendente'
  )

  const overdueTasks = tasks.filter(
    (t) =>
      t.date < format(new Date(), 'yyyy-MM-dd') && t.status === 'pendente'
  )

  return {
    tasks,
    todayTasks,
    overdueTasks,
    loading,
    addTask,
    completeTask,
    skipTask,
    updateTask,
    deleteTask,
  }
}
