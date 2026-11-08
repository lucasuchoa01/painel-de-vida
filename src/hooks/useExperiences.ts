import { useEffect, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  query, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export type Experience = {
  id: string
  title: string
  category: string
  description?: string
  userId: string
  createdAt: number
  updatedAt: number
}

export type WeekendPlan = {
  id: string
  title: string
  category: string
  description?: string
  date: string
  time?: string
  status: 'planejado' | 'realizado' | 'cancelado'
  experienceId?: string
  userId: string
  createdAt: number
  updatedAt: number
}

export function useExperiences() {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState<Experience[]>([])
  const [plans, setPlans] = useState<WeekendPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIdeas([])
      setPlans([])
      setLoading(false)
      return
    }

    let ideasReady = false
    let plansReady = false
    const finishLoading = () => {
      if (ideasReady && plansReady) setLoading(false)
    }

    const ideasQuery = query(collection(db, 'experiences'), where('userId', '==', user.uid))
    const plansQuery = query(collection(db, 'weekend_plans'), where('userId', '==', user.uid))

    const unsubIdeas = onSnapshot(ideasQuery, (snapshot) => {
      setIdeas(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Experience))
        .sort((a, b) => b.createdAt - a.createdAt))
      ideasReady = true
      finishLoading()
    }, (error) => {
      console.error('Erro ao carregar ideias:', error)
      ideasReady = true
      finishLoading()
    })

    const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
      setPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeekendPlan))
        .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`)))
      plansReady = true
      finishLoading()
    }, (error) => {
      console.error('Erro ao carregar planejamentos:', error)
      plansReady = true
      finishLoading()
    })

    return () => { unsubIdeas(); unsubPlans() }
  }, [user])

  const addIdea = async (data: Omit<Experience, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return
    const now = Date.now()
    await addDoc(collection(db, 'experiences'), { ...data, userId: user.uid, createdAt: now, updatedAt: now })
  }

  const addIdeasBulk = async (items: Array<{ title: string; category: string; description?: string }>) => {
    if (!user || items.length === 0) return
    // Firestore permite até 500 operações por lote; usamos blocos menores por segurança.
    for (let i = 0; i < items.length; i += 450) {
      const batch = writeBatch(db)
      const chunk = items.slice(i, i + 450)
      chunk.forEach(item => {
        const ref = doc(collection(db, 'experiences'))
        const now = Date.now()
        batch.set(ref, { ...item, userId: user.uid, createdAt: now, updatedAt: now })
      })
      await batch.commit()
    }
  }

  const updateIdea = async (id: string, data: Partial<Pick<Experience, 'title' | 'category' | 'description'>>) => {
    await updateDoc(doc(db, 'experiences', id), { ...data, updatedAt: Date.now() })
  }

  const deleteIdea = async (id: string) => {
    await deleteDoc(doc(db, 'experiences', id))
  }

  const addPlan = async (data: Omit<WeekendPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!user) return
    const now = Date.now()
    await addDoc(collection(db, 'weekend_plans'), { ...data, userId: user.uid, status: 'planejado', createdAt: now, updatedAt: now })
  }

  const updatePlan = async (id: string, data: Partial<Pick<WeekendPlan, 'title' | 'category' | 'description' | 'date' | 'time' | 'status'>>) => {
    await updateDoc(doc(db, 'weekend_plans', id), { ...data, updatedAt: Date.now() })
  }

  const deletePlan = async (id: string) => {
    await deleteDoc(doc(db, 'weekend_plans', id))
  }

  return { ideas, plans, loading, addIdea, addIdeasBulk, updateIdea, deleteIdea, addPlan, updatePlan, deletePlan }
}
