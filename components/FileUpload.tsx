'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
    setDragActive(false)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 16 * 1024 * 1024,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
        'hover:border-[var(--primary)] hover:bg-[var(--primary-light)]',
        isDragAccept && 'border-[var(--primary)] bg-[var(--primary-light)]',
        isDragReject && 'border-[var(--danger)] bg-[var(--danger-light)]',
        disabled && 'opacity-50 cursor-not-allowed',
        !isDragAccept && !isDragReject && 'border-[var(--border)]'
      )}
    >
      <input {...getInputProps()} />
      <div className="space-y-3">
        <div className="text-4xl">📄</div>
        <div>
          <p className="text-lg font-medium text-[var(--text-primary)]">
            拖拽 .docx 文件到此处
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            或点击选择文件
          </p>
        </div>
        <p className="text-xs text-[var(--text-disabled)]">
          支持 .docx 格式，最大 16MB
        </p>
      </div>
    </div>
  )
}
