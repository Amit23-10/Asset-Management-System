'use client'

import { Fragment, useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { apiRequest } from '@/lib/api/client'
import { todayIso } from '@/lib/format'
import { getMasterApi } from '@/lib/resources/master-api'
import { getResource } from '@/lib/resources/registry'
import type { MasterField, MasterRow } from '@/lib/resources/masters'
import { clearOptionsCache, ResourceSelect } from '@/components/features/resource-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

const NO_FIELDS: MasterField[] = []

function buildSchema(fields: MasterField[]) {
  const shape: Record<string, z.ZodType<string>> = {}
  for (const field of fields) {
    if (field.readOnly) continue
    let schema = z.string()
    if (field.required) schema = schema.min(1, `${field.label} is required`)
    if (field.maxLength) schema = schema.max(field.maxLength, `Max ${field.maxLength} characters`)
    if (field.digits) {
      schema = schema.regex(new RegExp(`^\\d{1,${field.digits}}$`), `Max ${field.digits} digits`)
    }
    if (field.type === 'number') {
      schema = schema.refine((value) => value === '' || !Number.isNaN(Number(value)), 'Must be a number')
    }
    if (field.type === 'date') {
      schema = schema.refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Invalid date')
    }
    shape[field.name] = schema
  }
  return z.object(shape)
}

function initialValues(fields: MasterField[]): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of fields) {
    values[field.name] = field.defaultToday ? todayIso() : (field.defaultValue ?? '')
  }
  return values
}

function recordValues(fields: MasterField[], record: MasterRow): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of fields) {
    const raw = record[field.name]
    if (raw === undefined || raw === null) {
      values[field.name] = ''
    } else if (field.type === 'date') {
      values[field.name] = String(raw).slice(0, 10)
    } else {
      values[field.name] = String(raw)
    }
  }
  return values
}

function editablePayload(fields: MasterField[], values: Record<string, string>) {
  const payload: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.readOnly) continue
    const value = values[field.name]
    if (value === '') continue
    payload[field.name] = field.type === 'number' ? Number(value) : value
  }
  return payload
}

export function ResourceForm({ resourceKey, id }: { resourceKey: string; id?: string }) {
  const router = useRouter()
  const resource = getResource(resourceKey)
  const fields = resource ? resource.fields : NO_FIELDS
  const schema = buildSchema(fields)
  const api = getMasterApi(resource?.basePath ?? '')

  const [recordId, setRecordId] = useState<string | undefined>(id)
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields))
  const [baseline, setBaseline] = useState<Record<string, string>>(() => initialValues(fields))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [pending, startTransition] = useTransition()

  const load = useCallback(() => {
    if (!id || !resource) return undefined
    let cancelled = false
    api
      .get(id)
      .then((record) => {
        if (cancelled) return
        const loaded = recordValues(fields, record)
        setValues(loaded)
        setBaseline(loaded)
      })
      .catch((cause) => {
        if (!cancelled) setServerError(cause instanceof Error ? cause.message : 'Failed to load record')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, id, resource, fields])

  useEffect(() => load(), [load])

  useEffect(() => {
    const previewPath = resource?.previewPath
    if (!previewPath) return undefined
    const timer = setTimeout(() => {
      const trigger =
        resource.group === 'Entry'
          ? values.cost !== '' || values.group !== ''
          : values.asset !== ''
      if (!trigger || loading) return
      apiRequest<Record<string, unknown>>(previewPath, {
        method: 'POST',
        body: editablePayload(fields, values),
        silent: true,
      })
        .then((partial) => {
          setValues((current) => {
            const next = { ...current }
            for (const field of fields) {
              if (!field.readOnly) continue
              const value = partial[field.name]
              if (value !== undefined && value !== null) next[field.name] = String(value)
            }
            return next
          })
        })
        .catch(() => undefined)
    }, 400)
    return () => clearTimeout(timer)
  }, [values, resource, fields, loading])

  if (!resource) return null

  const setValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })

    const field = fields.find((item) => item.name === name)
    if (!field?.snapshot || !field.optionsResource) return
    const source = getResource(field.optionsResource)
    if (!source) return
    if (value === '') {
      setValues((current) => {
        const next = { ...current }
        for (const item of fields) {
          if (item.source) next[item.name] = ''
        }
        return next
      })
      return
    }
    getMasterApi(source.basePath)
      .get(value)
      .then((record) => {
        setValues((current) => {
          const next = { ...current }
          for (const item of fields) {
            if (!item.source) continue
            const raw = record[item.source]
            next[item.name] = raw === undefined || raw === null ? '' : String(raw)
          }
          return next
        })
      })
      .catch(() => undefined)
  }

  const submit = (mode: 'stay' | 'close') => {
    setServerError(null)
    setNotice(null)
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    const payload = { ...editablePayload(fields, values), ...resource.extraBody }

    startTransition(async () => {
      try {
        if (recordId) {
          await api.update(recordId, payload)
        } else {
          const created = await api.create(payload)
          setRecordId(String(created.id))
          setValues((current) => ({ ...current, id: String(created.id) }))
          setBaseline((current) => ({ ...current, id: String(created.id) }))
        }
        clearOptionsCache()
        if (mode === 'close') {
          router.push(resource.href)
        } else {
          setBaseline(values)
          setNotice('Saved.')
        }
      } catch (cause) {
        setServerError(cause instanceof Error ? cause.message : 'Save failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            {resource.group ?? 'Master'}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {recordId ? `Edit ${resource.singular}` : `Add ${resource.singular}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">All red marked fields are required.</p>
        </div>
        <Link
          href={resource.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to List
        </Link>
      </div>

      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription className="text-destructive">{serverError}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit('stay')
        }}
        className="space-y-5"
      >
        <div className="grid gap-x-6 gap-y-5 rounded-xl border border-border bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {fields.map((field, index) => {
            const previousSection = index > 0 ? fields[index - 1].section : undefined
            const heading = field.section && field.section !== previousSection ? field.section : null
            return (
              <Fragment key={field.name}>
                {heading ? (
                  <h2 className="col-span-full border-b border-slate-100 pb-2 text-sm font-bold text-slate-950">
                    {heading}
                  </h2>
                ) : null}
                <Field>
                  <FieldLabel htmlFor={`field-${field.name}`}>
                    {field.label}
                    {field.required ? (
                      <span aria-hidden className="text-destructive">
                        *
                      </span>
                    ) : null}
                  </FieldLabel>
                  {field.type === 'select' ? (
                    <ResourceSelect
                      id={`field-${field.name}`}
                      field={field}
                      value={values[field.name] ?? ''}
                      onChange={(value) => setValue(field.name, value)}
                      disabled={pending || loading || field.readOnly}
                      invalid={Boolean(errors[field.name])}
                    />
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      id={`field-${field.name}`}
                      value={values[field.name] ?? ''}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      disabled={pending || loading || field.readOnly}
                      aria-invalid={Boolean(errors[field.name])}
                      aria-required={field.required}
                    />
                  ) : (
                    <Input
                      id={`field-${field.name}`}
                      type={field.type === 'date' ? 'date' : 'text'}
                      inputMode={field.type === 'number' || field.digits ? 'numeric' : undefined}
                      value={values[field.name] ?? ''}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      disabled={pending || loading || field.readOnly}
                      aria-invalid={Boolean(errors[field.name])}
                      aria-required={field.required}
                    />
                  )}
                  {errors[field.name] ? <FieldError errors={[{ message: errors[field.name] }]} /> : null}
                </Field>
              </Fragment>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || loading}
            onClick={() => {
              setValues(baseline)
              setErrors({})
              setNotice(null)
              setServerError(null)
            }}
          >
            Clear
          </Button>
          <Button type="submit" disabled={pending || loading}>
            {pending ? <Spinner /> : null}
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending || loading}
            onClick={() => submit('close')}
          >
            Save & Close
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => router.push(resource.href)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
