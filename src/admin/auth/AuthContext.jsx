import { createContext, useContext, useMemo, useState } from 'react'

const AUTH_KEY = 'carnalysis_auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const v = window.localStorage.getItem(AUTH_KEY)
      return v === '1'
    } catch {
      return false
    }
  })

  const login = () => {
    try {
      window.localStorage.setItem(AUTH_KEY, '1')
    } catch {
      // ignore
    }
    setIsAuthenticated(true)
  }

  const logout = () => {
    try {
      window.localStorage.removeItem(AUTH_KEY)
    } catch {
      // ignore
    }
    setIsAuthenticated(false)
  }

  const value = useMemo(() => ({ isAuthenticated, login, logout }), [isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
