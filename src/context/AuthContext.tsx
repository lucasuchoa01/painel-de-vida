import { createContext, useContext, useEffect, useState } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextType {
  user: User | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u)
      } else {
        signInWithEmailAndPassword(auth, 'lucasuchoa197@gmail.com', '64972201')
          .then(({ user }) => setUser(user))
          .catch(console.error)
      }
    })
    return unsub
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {user ? children : null}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
