import { useState, useEffect } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { FreePage, FreeSection, FreeSectionType } from '../types'
import { useAuth } from '../context/AuthContext'

export function usePages() {
  const { user } = useAuth()
  const [pages, setPages] = useState<FreePage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'free_pages'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setPages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FreePage)))
      setLoading(false)
    })
    return unsub
  }, [user])

  const createPage = async (title: string) => {
    if (!user) return
    await addDoc(collection(db, 'free_pages'), {
      title,
      sections: [],
      userId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }

  const updatePage = async (id: string, data: Partial<FreePage>) => {
    await updateDoc(doc(db, 'free_pages', id), { ...data, updatedAt: Date.now() })
  }

  const deletePage = async (id: string) => {
    await deleteDoc(doc(db, 'free_pages', id))
  }

  const addSection = async (page: FreePage, type: FreeSectionType, title: string) => {
    const newSection: FreeSection = {
      id: Date.now().toString(),
      type,
      title,
      items: [],
      content: '',
      order: page.sections.length,
    }
    await updatePage(page.id, { sections: [...page.sections, newSection] })
  }

  const updateSection = async (page: FreePage, sectionId: string, data: Partial<FreeSection>) => {
    const sections = page.sections.map((s) => s.id === sectionId ? { ...s, ...data } : s)
    await updatePage(page.id, { sections })
  }

  const deleteSection = async (page: FreePage, sectionId: string) => {
    const sections = page.sections.filter((s) => s.id !== sectionId)
    await updatePage(page.id, { sections })
  }

  const moveSectionUp = async (page: FreePage, sectionId: string) => {
    const idx = page.sections.findIndex((s) => s.id === sectionId)
    if (idx <= 0) return
    const sections = [...page.sections]
    ;[sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]]
    await updatePage(page.id, { sections: sections.map((s, i) => ({ ...s, order: i })) })
  }

  const moveSectionDown = async (page: FreePage, sectionId: string) => {
    const idx = page.sections.findIndex((s) => s.id === sectionId)
    if (idx >= page.sections.length - 1) return
    const sections = [...page.sections]
    ;[sections[idx], sections[idx + 1]] = [sections[idx + 1], sections[idx]]
    await updatePage(page.id, { sections: sections.map((s, i) => ({ ...s, order: i })) })
  }

  const addItem = async (page: FreePage, sectionId: string, text: string) => {
    const sections = page.sections.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        items: [...s.items, { id: Date.now().toString(), text, done: false }],
      }
    })
    await updatePage(page.id, { sections })
  }

  const toggleItem = async (page: FreePage, sectionId: string, itemId: string) => {
    const sections = page.sections.map((s) => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        items: s.items.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item
        ),
      }
    })
    await updatePage(page.id, { sections })
  }

  const removeItem = async (page: FreePage, sectionId: string, itemId: string) => {
    const sections = page.sections.map((s) => {
      if (s.id !== sectionId) return s
      return { ...s, items: s.items.filter((item) => item.id !== itemId) }
    })
    await updatePage(page.id, { sections })
  }

  return {
    pages, loading,
    createPage, updatePage, deletePage,
    addSection, updateSection, deleteSection,
    moveSectionUp, moveSectionDown,
    addItem, toggleItem, removeItem,
  }
}
