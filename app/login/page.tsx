'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, signUp } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'register') {
        const { data, error } = await signUp(email, password)
        if (error) throw error
        setSuccess('注册成功！请查看邮箱验证链接后登录。')
        setMode('login')
      } else {
        const { data, error } = await signIn(email, password)
        if (error) throw error
        router.push('/')
      }
    } catch (err: any) {
      const msg = err.message || '操作失败'
      // Friendly error messages
      if (msg.includes('Invalid login credentials')) {
        setError('邮箱或密码错误')
      } else if (msg.includes('User already registered')) {
        setError('该邮箱已注册，请直接登录')
      } else if (msg.includes('Password should be at least 6')) {
        setError('密码至少需要 6 个字符')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">暗标检测系统</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">招投标暗标文档智能检测</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-[var(--border)]">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              注册
            </button>
          </div>

          {/* Error/Success */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--success-light)] text-[var(--success)] text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button className="text-sm text-[var(--primary)] hover:underline">忘记密码？</button>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ← 返回首页
          </Link>
        </div>

        <p className="text-center text-xs text-[var(--text-disabled)] mt-8">
          © 2026 暗标检测系统
        </p>
      </div>
    </div>
  )
}
