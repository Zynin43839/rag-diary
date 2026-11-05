'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  type AuthResult,
  type AuthUser,
} from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    fetchMe()
      .then((u) => {
        if (active) setUser(u)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password)
    queryClient.clear()
    setUser(result.user)
    return result
  }, [queryClient])

  const register = useCallback(async (email: string, password: string) => {
    const result = await apiRegister(email, password)
    if (result.user) {
      queryClient.clear()
      setUser(result.user)
    }
    return result
  }, [queryClient])

  const logout = useCallback(() => {
    apiLogout()
    // Drop any cached data belonging to the previous user so it can never be
    // shown to the next person who signs in on this device.
    queryClient.clear()
    setUser(null)
  }, [queryClient])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

/**
 * Call before performing a protected action (write / search / chat).
 * Sends guests to the login page and returns false so the caller can bail out.
 */
export function useRequireAuth(): () => boolean {
  const { user } = useAuth()
  const router = useRouter()
  return useCallback(() => {
    if (!user) {
      const next = window.location.pathname + window.location.search
      const safeNext =
        next.startsWith('/') && !next.startsWith('//') ? next : '/'
      router.push(`/login?next=${encodeURIComponent(safeNext)}`)
      return false
    }
    return true
  }, [user, router])
}
