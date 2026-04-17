'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [dark, setDark] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    const isDark = document.documentElement.classList.contains('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    setDark(isDark)
  }

  const handleLogout = async () => {
    await signOut()
    setShowMenu(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-[var(--bg-card)] border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[var(--primary)]">暗标检测系统</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            检测
          </Link>
          <Link href="/profile" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            用户中心
          </Link>

          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-page)] transition-colors"
            title={dark ? '切换亮色模式' : '切换暗色模式'}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {loading ? (
            <div className="w-16 h-8 rounded-lg bg-[var(--bg-page)] animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center">
                  {(user.email?.[0] || 'U').toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{user.email}</span>
                <span>▾</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] shadow-lg py-1">
                  <Link
                    href="/profile"
                    onClick={() => setShowMenu(false)}
                    className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-page)] hover:text-[var(--text-primary)]"
                  >
                    用户中心
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-light)]"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
