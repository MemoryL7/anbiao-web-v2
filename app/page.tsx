'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import FileUpload from '@/components/FileUpload'
import { useDetectionStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const {
    file, setFile, region, setRegion,
    customWords, setCustomWords,
    checkImages, setCheckImages,
    setLoading, setError
  } = useDetectionStore()

  const [agreed, setAgreed] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setLocalError] = useState<string | null>(null)

  const handleDetect = async () => {
    if (!file) {
      setLocalError('请先上传 .docx 文件')
      return
    }
    if (!agreed) {
      setLocalError('请先同意用户协议和免责声明')
      return
    }

    setDetecting(true)
    setLocalError(null)
    setProgress('正在上传文件...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('region', region)
      formData.append('check_images', String(checkImages))
      if (customWords.trim()) {
        formData.append('custom_sensitive_words', customWords.trim())
      }

      setProgress('正在检测中，请稍候...')

      const res = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        // Store result and navigate
        useDetectionStore.getState().setResult(data.data)
        useDetectionStore.getState().setLoading(false)
        router.push('/results')
      } else {
        setLocalError(data.error || '检测失败')
      }
    } catch (err: any) {
      setLocalError(`检测出错: ${err.message}`)
    } finally {
      setDetecting(false)
      setProgress('')
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 检测中遮罩 */}
        {detecting && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-[var(--bg-card)] rounded-xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-lg font-medium text-[var(--text-primary)]">检测中...</p>
              <p className="text-sm text-[var(--text-secondary)]">{progress}</p>
              <p className="text-xs text-[var(--text-disabled)]">
                {file?.name} · {region === 'luoyang' ? '洛阳市规则' : '自定义规则'}
              </p>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)]/20 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">暗标文档检测</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            上传 .docx 文件，自动检测是否符合暗标编制规则
          </p>
        </div>

        {/* 文件上传 */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6 mb-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">上传文件</h2>
          <FileUpload onFileSelect={setFile} disabled={detecting} />
          {file && (
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--success)]">✓</span>
              <span>{file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
              <button
                onClick={() => setFile(null)}
                className="ml-auto text-[var(--danger)] hover:underline text-xs"
              >
                移除
              </button>
            </div>
          )}
        </div>

        {/* 检测配置 */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6 mb-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">检测配置</h2>

          <div className="space-y-4">
            {/* 地区规则 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">地区规则</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="luoyang">洛阳市规则</option>
                <option value="custom">自定义规则</option>
              </select>
            </div>

            {/* 自定义敏感词 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                自定义敏感词 <span className="text-[var(--text-disabled)]">（可选，英文逗号分隔）</span>
              </label>
              <textarea
                value={customWords}
                onChange={(e) => setCustomWords(e.target.value)}
                placeholder="例如：公司，投标人，联系电话"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
              />
            </div>

            {/* 检测图片 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkImages}
                onChange={(e) => setCheckImages(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">检测图片内容</span>
            </label>
          </div>
        </div>

        {/* 协议 + 提交 */}
        <div className="space-y-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              我已阅读并同意
              <button onClick={(e) => { e.preventDefault(); setShowAgreement(true) }} className="text-[var(--primary)] hover:underline mx-1">《用户协议》</button>
              和
              <button onClick={(e) => { e.preventDefault(); setShowDisclaimer(true) }} className="text-[var(--primary)] hover:underline mx-1">《免责声明》</button>
            </span>
          </label>

          <button
            onClick={handleDetect}
            disabled={detecting || !file || !agreed}
            className={cn(
              'w-full h-12 rounded-xl font-medium text-white transition-all duration-200',
              'bg-[var(--primary)] hover:bg-[var(--primary-hover)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {detecting ? '检测中...' : '开始检测'}
          </button>
        </div>

        {/* 用户协议弹窗 */}
        {showAgreement && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAgreement(false)}>
            <div className="bg-[var(--bg-card)] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">用户协议</h3>
                <button onClick={() => setShowAgreement(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
              </div>
              <div className="prose prose-sm max-w-none text-[var(--text-secondary)] space-y-3">
                <h4>1. 协议接受</h4>
                <p>欢迎使用暗标检测系统。您通过点击"开始检测"按钮或实际使用本系统，即表示您已接受本协议的全部条款。</p>
                <h4>2. 系统使用</h4>
                <p>本系统仅用于检测Word文档是否符合暗标规则，不得用于任何非法或未经授权的目的。</p>
                <h4>3. 隐私保护</h4>
                <p>本系统仅在服务端临时处理您上传的文档用于检测，检测完成后立即删除，不会永久保存您的文档内容。</p>
                <h4>4. 责任限制</h4>
                <p>本系统提供"暗标规则格式检测"的技术服务，因规则多样性和文档格式复杂性，不保证检测结果100%准确，您需自行核实。</p>
              </div>
              <button onClick={() => setShowAgreement(false)} className="mt-6 w-full h-10 rounded-lg bg-[var(--primary)] text-white font-medium">关闭</button>
            </div>
          </div>
        )}

        {/* 免责声明弹窗 */}
        {showDisclaimer && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDisclaimer(false)}>
            <div className="bg-[var(--bg-card)] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">免责声明</h3>
                <button onClick={() => setShowDisclaimer(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
              </div>
              <div className="prose prose-sm max-w-none text-[var(--text-secondary)] space-y-3">
                <h4>1. 检测结果使用声明</h4>
                <p>检测结果仅为技术参考，<strong>不构成对"符合招标要求"的承诺或保证</strong>。用户应自行核实检测结果的准确性，并独立承担因依赖检测结果而产生的全部风险。</p>
                <h4>2. 文档安全</h4>
                <p>系统仅在服务端临时处理文档，检测完成后立即删除。请确保上传文档不包含国家秘密或商业机密。</p>
                <h4>3. 系统稳定性</h4>
                <p>开发者尽力确保系统稳定可用，但不保证任何时间都能正常运行。</p>
              </div>
              <button onClick={() => setShowDisclaimer(false)} className="mt-6 w-full h-10 rounded-lg bg-[var(--primary)] text-white font-medium">关闭</button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
