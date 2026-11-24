'use client'

import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type ImportResult = {
  created?: number
  failed?: number
  error?: string
  details?: string[]
  errors?: string[]
}

export function BulkAssetActions({
  resourceKey,
  onImported,
}: {
  resourceKey: string
  onImported: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const download = () => {
    setNotice('Format downloaded. Fill it and upload the completed file.')
    setErrors([])
    const link = document.createElement('a')
    link.href = `/api/bulk-assets/template?resource=${encodeURIComponent(resourceKey)}`
    link.download = `${resourceKey}-template.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const upload = async (file: File) => {
    setUploading(true)
    setNotice(null)
    setErrors([])
    try {
      const formData = new FormData()
      formData.append('resource', resourceKey)
      formData.append('file', file)
      const response = await fetch('/api/bulk-assets/import', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      })
      const result = (await response.json()) as ImportResult
      if (!response.ok && response.status !== 207) {
        throw new Error(result.error ?? 'Upload failed')
      }
      const created = result.created ?? 0
      const failed = result.failed ?? 0
      const details = [...(result.details ?? []), ...(result.errors ?? [])]
      setErrors(details)
      if (created > 0) {
        setNotice(`${created} asset(s) created${failed ? `, ${failed} row(s) failed` : ''}.`)
        onImported()
      } else if (details.length === 0) {
        setErrors([result.error ?? 'Upload failed'])
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Upload failed'])
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={download}>
          <Download data-icon="inline-start" />
          Download Format
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button type="button" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Spinner /> : <Upload data-icon="inline-start" />}
          {uploading ? 'Uploading…' : 'Upload Excel'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Only the downloaded Excel format is accepted. Asset ID is generated automatically.
      </p>
      {notice ? (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {errors.length > 0 ? (
        <Alert variant="destructive">
          <AlertDescription className="text-destructive">
            <ul className="list-disc pl-4">
              {errors.map((message, index) => (
                <li key={`${index}-${message}`}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
