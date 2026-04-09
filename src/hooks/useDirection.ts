import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { Direction } from '../types'
import { useAuth } from '../context/AuthContext'

export function useDirection() {
  const { user } = useAuth()
  const [direction, setDirection] = useState<Direction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'direction'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0]
        setDirection({ id: d.id, ...d.data() } as Direction)
      }
      setLoading(false)
    })
    return unsub
  }, [user])

  const saveDirection = async (data: {
    lifeDirection: string
    idealSelf: string
    weeklyFocus: string[]
    values: string[]
    currentIncome: string
    shouldIncome: string
  }) => {
    if (!user) return
    if (direction?.id) {
      await updateDoc(doc(db, 'direction', direction.id), {
        ...data,
        updatedAt: Date.now(),
      })
    } else {
      await addDoc(collection(db, 'direction'), {
        ...data,
        userId: user.uid,
        updatedAt: Date.now(),
      })
    }
  }

  return { direction, loading, saveDirection }
}
