"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, File, AlertCircle } from "lucide-react"

interface UploadedDocument {
  fileId: string
  name: string
  size: number
  mimeType: string
  base64Content: string
}

interface DocumentUploadProps {
  onDocumentsChange: (documents: UploadedDocument[]) => void
  disabled: boolean
}

export default function DocumentUpload({ onDocumentsChange, disabled }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    setUploadError("")
    setIsUploading(true)

    const validFiles = Array.from(files).filter((file) => {
      const maxSize = 20 * 1024 * 1024 // 20MB limit
      if (file.size > maxSize) {
        setUploadError(`File "${file.name}" is too large (max 20MB)`)
        return false
      }
      return true
    })

    try {
      const uploadedDocs: UploadedDocument[] = []

      for (const file of validFiles) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const uploadedFile = await response.json()
        uploadedDocs.push(uploadedFile)
      }

      const updatedDocs = [...documents, ...uploadedDocs]
      setDocuments(updatedDocs)
      onDocumentsChange(updatedDocs)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload files")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeDocument = (id: string) => {
    const updated = documents.filter((doc) => doc.fileId !== id)
    setDocuments(updated)
    onDocumentsChange(updated)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="space-y-3">
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        } ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          disabled={disabled || isUploading}
          accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.csv"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full flex flex-col items-center gap-2 py-4 hover:opacity-80 transition-opacity disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium text-foreground">{isUploading ? "Uploading..." : "Click to upload"}</span>
            <span className="text-muted-foreground"> or drag and drop</span>
          </div>
          <span className="text-xs text-muted-foreground">PDF, TXT, DOC, DOCX, XLS, XLSX, CSV (max 20MB)</span>
        </button>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Uploaded Documents ({documents.length})</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.fileId}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(doc.fileId)}
                  disabled={disabled}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
