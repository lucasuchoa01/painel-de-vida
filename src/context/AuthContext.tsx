import { createContext, useContext, useEffect, useState } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextType {
  user: User | null
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_KEY = 'pdv_session_date'

function getTodayString() {
  return new Date().toISOString().slice(0, 10) // "2026-04-08"
}

function isSessionValid() {
  const saved = localStorage.getItem(SESSION_KEY)
  return saved === getTodayString()
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, getTodayString())
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && isSessionValid()) {
        setUser(u)
      } else {
        if (u) await signOut(auth)
        clearSession()
        setUser(null)
      }
      setReady(true)
    })
    return unsub
  }, [])

  const login = async (password: string) => {
    const { user } = await signInWithEmailAndPassword(
      auth, 'lucasuchoa197@gmail.com', password
    )
    saveSession()
    setUser(user)
  }

  const logout = async () => {
    clearSession()
    await signOut(auth)
    setUser(null)
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
