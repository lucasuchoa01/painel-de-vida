import { useState, useEffect } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { DailyLog } from '../types'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export function useDailyLog() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [growAreas, setGrowAreas] = useState<string[]>([])
  const [toStudy, setToStudy] = useState<string[]>([])
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

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'evolution_config'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data()
        setGrowAreas(data.growAreas ?? [])
        setToStudy(data.toStudy ?? [])
      }
    })
    return unsub
  }, [user])

  const todayLog = logs.find((l) => l.date === today) ?? null

  const saveLog = async (data: { good: string; bad: string; improve: string }, id?: string) => {
    if (!user) return
    if (id) {
      await updateDoc(doc(db, 'daily_logs', id), { ...data, updatedAt: Date.now() })
    } else if (todayLog?.id) {
      await updateDoc(doc(db, 'daily_logs', todayLog.id), { ...data, updatedAt: Date.now() })
    } else {
      await addDoc(collection(db, 'daily_logs'), {
        ...data, userId: user.uid, date: today, createdAt: Date.now(),
      })
    }
  }

  const deleteLog = async (id: string) => {
    await deleteDoc(doc(db, 'daily_logs', id))
  }

  const saveEvolutionConfig = async (data: { growAreas: string[]; toStudy: string[] }) => {
    if (!user) return
    const q = query(collection(db, 'evolution_config'), where('userId', '==', user.uid))
    const snap = await new Promise<any>((resolve) => {
      const unsub = onSnapshot(q, (s) => { resolve(s); unsub() })
    })
    if (!snap.empty) {
      await updateDoc(doc(db, 'evolution_config', snap.docs[0].id), { ...data, updatedAt: Date.now() })
    } else {
      await addDoc(collection(db, 'evolution_config'), { ...data, userId: user.uid, createdAt: Date.now() })
    }
  }

  return { logs, todayLog, loading, saveLog, deleteLog, growAreas, toStudy, saveEvolutionConfig }
}
