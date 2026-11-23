'use client'

import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()
const cache = new Map<string, unknown>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  if (cache.has(key)) return cache.get(key) as T

  let value = fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw !== null) value = JSON.parse(raw) as T
  } catch {
    // Keep fallback for malformed values.
  }

  cache.set(key, value)
  return value
}

/**
 * LocalStorage-backed state with a stable server snapshot. Safe for client
 * components that are still server-rendered by Next.js.
 */
export function useLocalStorageState<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  )

  function setValue(next: T | ((previous: T) => T)) {
    const current = read(key, fallback)
    const resolved = typeof next === 'function' ? (next as (previous: T) => T)(current) : next

    cache.set(key, resolved)
    try {
      window.localStorage.setItem(key, JSON.stringify(resolved))
    } catch {
      // Ignore storage failures.
    }
    emit()
  }

  return [value, setValue] as const
}
