'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useDetectionStore } from '@/lib/store'
import { API_BASE } from '@/lib/config'
import { cn } from '@/lib/utils'

export default function ResultsPage() {
  const router = useRouter()
  const { result, file, region } = useDetectionStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)

  // Auto-expand failed categories
  useEffect(() => {
    if (result?.modification_suggestions) {
      const failed = new Set<string>()
      for (const [category, items] of Object.entries(result.modification_suggestions)) {
        if (Array.isArray(items) && items.length > 0 && category !== '系统提示') {
          failed.add(category)
        }
      }
      setExpandedCategories(failed)
    }
  }, [result])

  // Redirect if no result
  useEffect(() => {
    if (!result) {
      router.push('/')
    }
  }, [result, router])

  if (!result) return null

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const handleFix = async () => {
    if (!file) return
    setFixing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('region', region)

      const res = await fetch(`${API_BASE}/api/fix`, { method: 'POST', body: formData })
      const data = await res.json()

      if (data.success) {
        setFixResult(data)
      } else {
        alert('修复失败: ' + (data.error || '未知错误'))
      }
    } catch (err: any) {
      alert('修复出错: ' + err.message)
    } finally {
      setFixing(false)
    }
  }

  const handleDownloadFixed = () => {
    if (!fixResult?.fixed_file) return
    const bytes = Uint8Array.from(atob(fixResult.fixed_file), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `修复后_${file?.name || 'document.docx'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allSuggestions = result.modification_suggestions || {}
  const totalIssues = Object.values(allSuggestions)
    .filter((v): v is any[] => Array.isArray(v))
    .reduce((sum, items) => sum + items.filter(i => i.category !== '系统提示').length, 0)
  const isPass = result.overall_result === 'pass'

  const categoryLabels: Record<string, string> = {
    '页面格式问题': '页面格式',
    '字体格式问题': '字体格式',
    '标题格式问题': '标题格式',
    '内容合规问题': '内容检查',
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回 + 操作 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-[var(--primary)] hover:underline">
            ← 返回首页
          </Link>
          <div className="flex gap-2">
            {totalIssues > 0 && !fixResult && (
              <button
                onClick={handleFix}
                disabled={fixing}
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {fixing ? '修复中...' : `🔧 一键修复`}
              </button>
            )}
          </div>
        </div>

        {/* 总体结果 */}
        <div className={cn(
          'rounded-xl border p-6 mb-6 text-center',
          isPass
            ? 'bg-[var(--success-light)] border-[var(--success)]/20'
            : 'bg-[var(--danger-light)] border-[var(--danger)]/20'
        )}>
          <div className="text-4xl mb-2">{isPass ? '✅' : '❌'}</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {isPass ? '检测通过' : '检测未通过'}
          </h2>
          {!isPass && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              发现 {totalIssues} 个问题
            </p>
          )}
        </div>

        {/* 分类汇总卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(allSuggestions).filter(([k]) => k !== '系统提示').map(([category, items]) => {
            const count = Array.isArray(items) ? items.length : 0
            const pass = count === 0
            return (
              <div
                key={category}
                onClick={() => toggleCategory(category)}
                className={cn(
                  'rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm',
                  pass
                    ? 'bg-[var(--success-light)] border-[var(--success)]/20'
                    : 'bg-[var(--danger-light)] border-[var(--danger)]/20'
                )}
              >
                <div className="text-2xl mb-1">{pass ? '✓' : '✗'}</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {categoryLabels[category] || category}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {pass ? '通过' : `${count} 个问题`}
                </div>
              </div>
            )
          })}
        </div>

        {/* 修复结果 */}
        {fixResult && (
          <div className="bg-[var(--success-light)] rounded-xl border border-[var(--success)]/20 p-6 mb-6">
            <h3 className="text-base font-semibold text-[var(--success)] mb-3">✅ 修复完成</h3>
            {fixResult.fix_report && (
              <div className="text-sm text-[var(--text-secondary)] space-y-1 mb-4">
                {fixResult.fix_report.map((item: any, i: number) => (
                  <div key={i}>
                    {item.type}: {item.message}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleDownloadFixed}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)]"
            >
              📥 下载修复后的文件
            </button>
          </div>
        )}

        {/* 详细问题列表 */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">详细检测结果</h3>

          {Object.entries(allSuggestions).filter(([k]) => k !== '系统提示').map(([category, items]) => {
            if (!Array.isArray(items) || items.length === 0) return null
            const expanded = expandedCategories.has(category)

            return (
              <div key={category} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--bg-page)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      items.length > 0 ? 'bg-[var(--danger)]' : 'bg-[var(--success)]'
                    )} />
                    <span className="font-medium text-[var(--text-primary)]">
                      {categoryLabels[category] || category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--danger-light)] text-[var(--danger)]">
                      {items.length} 个问题
                    </span>
                  </div>
                  <span className={cn(
                    'text-[var(--text-secondary)] transition-transform',
                    expanded && 'rotate-180'
                  )}>▼</span>
                </button>

                {/* Content */}
                {expanded && (
                  <div className="border-t border-[var(--border)]">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="px-5 py-4 border-b border-[var(--border)] last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded font-medium',
                              item.severity === '严重' && 'bg-[var(--danger)] text-white',
                              item.severity === '高' && 'bg-[var(--warning)] text-white',
                              item.severity === '中' && 'bg-[var(--warning-light)] text-[var(--warning)]',
                              (!item.severity || item.severity === '低') && 'bg-[var(--bg-page)] text-[var(--text-secondary)]'
                            )}>
                              {item.severity || '低'}
                            </span>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {item.type || item.description}
                            </span>
                          </div>
                          {item.fixable && (
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)]">
                              可修复
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] space-y-1 ml-1">
                          {item.description && <p>{item.description}</p>}
                          {item.location && <p>位置：{item.location}</p>}
                          {item.current_setting && <p>当前：{item.current_setting}</p>}
                          {item.should_setting && <p>要求：{item.should_setting}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 底部操作 */}
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-card)] transition-colors"
          >
            重新检测
          </Link>
          {totalIssues > 0 && !fixResult && (
            <button
              onClick={handleFix}
              disabled={fixing}
              className="px-6 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              {fixing ? '修复中...' : '🔧 一键修复'}
            </button>
          )}
        </div>
      </main>
    </>
  )
}
