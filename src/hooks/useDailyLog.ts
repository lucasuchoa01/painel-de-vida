import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { DailyLog } from '../types'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export function useDailyLog() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'daily_logs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyLog)))
      setLoading(false)
    })
    return unsub
  }, [user])

  const todayLog = logs.find((l) => l.date === today) ?? null

  const saveLog = async (data: { good: string; bad: string; improve: string }) => {
    if (!user) return
    if (todayLog?.id) {
      await updateDoc(doc(db, 'daily_logs', todayLog.id), {
        ...data,
        updatedAt: Date.now(),
      })
    } else {
      await addDoc(collection(db, 'daily_logs'), {
        ...data,
        userId: user.uid,
        date: today,
        createdAt: Date.now(),
      })
    }
  }

  return { logs, todayLog, loading, saveLog }
}
