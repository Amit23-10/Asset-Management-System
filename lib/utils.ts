export { cn } from "cn"

export function safeNextPath(value?: string | null, fallback = "/"): string {
  if (!value) return fallback
  if (!value.startsWith("/") || value.startsWith("//")) return fallback
  return value
}

export function initials(name: string, fallback = "MM"): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || fallback
  )
}
