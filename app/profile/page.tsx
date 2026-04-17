'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function ProfilePage() {
  const [activationCode, setActivationCode] = useState('')
  const [tab, setTab] = useState<'info' | 'history' | 'rules'>('info')

  // Placeholder data
  const userInfo = {
    email: 'user@example.com',
    activated: false,
    mode: null as string | null,
    remaining: null as number | null,
    expireDate: null as string | null,
  }

  const mockHistory = [
    { id: '1', fileName: '招标文件_v3.docx', region: '洛阳市', result: 'fail', issues: 4, date: '2026-04-17' },
    { id: '2', fileName: '投标书_最终版.docx', region: '洛阳市', result: 'pass', issues: 0, date: '2026-04-16' },
    { id: '3', fileName: '技术方案.docx', region: '自定义', result: 'fail', issues: 7, date: '2026-04-15' },
  ]

  const mockRules = [
    { id: '1', name: '我的自定义规则', createdAt: '2026-04-10' },
  ]

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">用户中心</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
          {[
            { key: 'info', label: '账户信息' },
            { key: 'history', label: '检测历史' },
            { key: 'rules', label: '自定义规则' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: 账户信息 */}
        {tab === 'info' && (
          <div className="space-y-6">
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">账户信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">邮箱</span>
                  <span className="text-sm text-[var(--text-primary)]">{userInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">激活状态</span>
                  <span className="text-sm">
                    {userInfo.activated ? (
                      <span className="text-[var(--success)]">✓ 已激活</span>
                    ) : (
                      <span className="text-[var(--warning)]">未激活</span>
                    )}
                  </span>
                </div>
                {userInfo.activated && userInfo.mode === 'time' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">有效期至</span>
                    <span className="text-sm text-[var(--text-primary)]">{userInfo.expireDate}</span>
                  </div>
                )}
                {userInfo.activated && userInfo.mode === 'count' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">剩余次数</span>
                    <span className="text-sm text-[var(--text-primary)]">{userInfo.remaining} 次</span>
                  </div>
                )}
              </div>
            </div>

            {/* 激活码输入 */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">输入激活码</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="请输入激活码"
                  className="flex-1 h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button className="px-4 h-10 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)]">
                  激活
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: 检测历史 */}
        {tab === 'history' && (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-page)]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">日期</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">文件名</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">地区</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">结果</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">问题数</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map(h => (
                  <tr key={h.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-page)]">
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{h.date}</td>
                    <td className="px-4 py-3 text-sm text-[var(--primary)]">{h.fileName}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{h.region}</td>
                    <td className="px-4 py-3 text-sm">
                      {h.result === 'pass'
                        ? <span className="text-[var(--success)]">✓ 通过</span>
                        : <span className="text-[var(--danger)]">✗ 未通过</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{h.issues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: 自定义规则 */}
        {tab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-page)]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">规则名称</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">创建时间</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRules.map(r => (
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-b-0">
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{r.name}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{r.createdAt}</td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <button className="text-[var(--primary)] hover:underline">编辑</button>
                        <button className="text-[var(--danger)] hover:underline">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="px-4 py-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-sm font-medium hover:bg-[var(--primary-light)] transition-colors">
              + 新建规则
            </button>
          </div>
        )}
      </main>
    </>
  )
}
