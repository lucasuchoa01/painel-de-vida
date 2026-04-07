import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { Idea, Distraction, Discarded } from '../types'
import { useAuth } from '../context/AuthContext'

function useCollection<T extends { id: string }>(collectionName: string) {
  const { user } = useAuth()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, collectionName),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))
      )
      setLoading(false)
    })
    return unsub
  }, [user, collectionName])

  const add = async (data: Omit<T, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return
    await addDoc(collection(db, collectionName), {
      ...data,
      userId: user.uid,
      createdAt: Date.now(),
    })
  }

  const remove = async (id: string) => {
    await deleteDoc(doc(db, collectionName, id))
  }

  return { items, loading, add, remove }
}

export function useIdeas() {
  return useCollection<Idea>('ideas')
}

export function useDistractions() {
  return useCollection<Distraction>('distractions')
}

export function useDiscarded() {
  return useCollection<Discarded>('discarded')
}
