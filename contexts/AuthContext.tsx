'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  credits: number
  refreshCredits: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)

  const supabase = useMemo(() => createClient(), [])

  const fetchCredits = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()
    if (data) setCredits(data.credits ?? 0)
  }, [supabase])

  /**
   * Redis-first 크레딧 갱신.
   * deductCredits의 async Supabase sync 완료 전에도 Redis 캐시에서 정확한 잔액을 읽는다.
   */
  const refreshCredits = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/credits')
      if (res.ok) {
        const { credits } = await res.json()
        setCredits(credits)
      }
    } catch {
      // 네트워크 오류 시 Supabase 직접 조회로 폴백
      await fetchCredits(user.id)
    }
  }, [user, fetchCredits])

  useEffect(() => {
    // 초기 세션 로드
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchCredits(session.user.id)
      setLoading(false)
    })

    // 로그인/로그아웃 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchCredits(session.user.id)
      else setCredits(0)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchCredits])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, credits, refreshCredits, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
