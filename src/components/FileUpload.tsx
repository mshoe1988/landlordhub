'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  selectedFile?: File | null
  accept?: string
  maxSize?: number
  error?: string
  disabled?: boolean
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  maxSize = 5 * 1024 * 1024, // 5MB
  error,
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    onFileSelect(file)
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />
    } else if (type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    } else {
      return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-2">
      {selectedFile ? (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile)}
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {onFileRemove && (
              <button
                type="button"
                onClick={onFileRemove}
                className="text-red-500 hover:text-red-700"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, DOC, DOCX, JPG, PNG up to {Math.round(maxSize / 1024 / 1024)}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
