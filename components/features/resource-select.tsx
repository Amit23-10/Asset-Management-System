'use client'

import { useEffect, useState } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import { listRows, type CrudListResult } from '@/lib/api/crud-shared'
import { getMasterApi } from '@/lib/resources/master-api'
import { type MasterField, type MasterRow } from '@/lib/resources/masters'
import { getResource } from '@/lib/resources/registry'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Option = { value: string; label: string }

const optionsCache = new Map<string, Promise<Option[]>>()

export function clearOptionsCache() {
  optionsCache.clear()
}

function optionLabel(row: MasterRow, searchable?: boolean) {
  const name = String(row.name ?? '')
  if (searchable && name) return `${row.id} — ${name}`
  return name || String(row.id)
}

function fetchOptions(field: MasterField): Promise<Option[]> {
  if (field.options) return Promise.resolve(field.options)

  const key = field.optionsResource ?? field.optionsEndpoint ?? ''
  const cached = optionsCache.get(key)
  if (cached) return cached

  const promise = (async () => {
    if (field.optionsResource) {
      const resource = getResource(field.optionsResource)
      if (!resource) return []
      const rows = await getMasterApi(resource.basePath).listAll()
      return rows.map((row) => ({
        value: String(row.id),
        label: optionLabel(row, field.searchable),
      }))
    }
    if (field.optionsEndpoint) {
      const result = await apiRequest<CrudListResult<MasterRow>>(field.optionsEndpoint, { silent: true })
      return listRows(result).map((row) => ({
        value: String(row.id),
        label: optionLabel(row, field.searchable),
      }))
    }
    return []
  })().catch((error) => {
    optionsCache.delete(key)
    throw error
  })

  optionsCache.set(key, promise)
  return promise
}

function SearchableSelect({
  options,
  value,
  onChange,
  disabled,
  invalid,
  id,
  placeholder,
}: {
  options: Option[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  id?: string
  placeholder: string
}) {
  const [typed, setTyped] = useState<string | null>(null)
  const items = Combobox.createItems(options, {
    getValue: (option: Option) => option.value,
    getLabel: (option: Option) => option.label,
  })
  const selectedLabel = options.find((option) => option.value === value)?.label ?? ''

  return (
    <Combobox.Root
      key={value || 'empty'}
      items={items}
      value={value === '' ? null : value}
      onValueChange={(next) => {
        setTyped(null)
        onChange(next ?? '')
      }}
      inputValue={typed ?? selectedLabel}
      onInputValueChange={(next) => setTyped(next)}
      filter={(option: Option, query) => {
        const needle = query.trim().toLowerCase()
        if (!needle) return true
        return (
          option.value.toLowerCase().includes(needle) ||
          option.label.toLowerCase().includes(needle)
        )
      }}
      disabled={disabled}
      autoHighlight
    >
      <Combobox.InputGroup
        data-slot="searchable-select"
        className="flex h-8 w-full items-center gap-1 rounded-lg border border-input bg-transparent py-0 pr-1.5 pl-2.5 text-sm transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
      >
        <Combobox.Input
          id={id}
          aria-invalid={invalid}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <Combobox.Trigger
          aria-label="Show options"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent"
        >
          <Combobox.Icon>
            <ChevronDownIcon className="size-4" />
          </Combobox.Icon>
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} align="center" className="isolate z-50">
          <Combobox.Popup
            data-slot="searchable-select-content"
            className="max-h-(--available-height) w-(--anchor-width) min-w-36 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            <Combobox.Empty className="px-2 py-1.5 text-sm text-muted-foreground">
              No matching records
            </Combobox.Empty>
            <Combobox.List className="max-h-72 overflow-y-auto p-1">
              {(option: Option) => (
                <Combobox.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-medium"
                >
                  <span className="truncate">{option.label}</span>
                  <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

export function ResourceSelect({
  field,
  value,
  onChange,
  disabled,
  invalid,
  id,
}: {
  field: MasterField
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  id?: string
}) {
  const [options, setOptions] = useState<Option[]>(field.options ?? [])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchOptions(field)
      .then((loaded) => {
        if (!cancelled) setOptions(loaded)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [field])

  const placeholder = failed ? 'Unavailable' : field.searchable ? 'Search asset ID or name' : 'Select'

  if (field.searchable) {
    return (
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        invalid={invalid}
        id={id}
        placeholder={placeholder}
      />
    )
  }

  const items = Object.fromEntries(options.map((option) => [option.value, option.label]))

  return (
    <Select
      items={items}
      value={value === '' ? null : value}
      onValueChange={(next) => onChange(next === null ? '' : String(next))}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
