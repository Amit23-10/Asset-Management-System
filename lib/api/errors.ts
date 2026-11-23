import { NextResponse } from 'next/server'

export class FrappeApiError extends Error {
  status: number

  constructor(message: string, status = 502) {
    super(message)
    this.name = 'FrappeApiError'
    this.status = status
  }
}

/**
 * Mirrors ensureOk() from workshop-builder-ui, but server-safe (no window).
 */
export async function parseFrappeError(response: Response, fallbackMessage: string): Promise<FrappeApiError> {
  let message = fallbackMessage

  try {
    const payload = (await response.json()) as {
      message?: unknown
      exception?: string
      _server_messages?: string
    }

    if (payload._server_messages) {
      try {
        const serverMessages = JSON.parse(payload._server_messages) as string[]
        if (serverMessages.length > 0) {
          const parsed = JSON.parse(serverMessages[0]) as { message?: string; title?: string }
          const title = parsed.title ? `${parsed.title}: ` : ''
          if (parsed.message) message = `${title}${parsed.message.trim()}`
        }
      } catch {
        // Malformed _server_messages; keep fallback.
      }
    } else if (typeof payload.message === 'string') {
      message = payload.message
    } else if (payload.exception) {
      const colonIndex = payload.exception.indexOf(':')
      message = colonIndex > -1 ? payload.exception.slice(colonIndex + 1).trim() : payload.exception
    }
  } catch {
    // Non-JSON response; keep fallback.
  }

  return new FrappeApiError(message, response.status || 502)
}

export async function readMessage<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { message: T }
  return payload.message
}

export function errorResponse(error: unknown, fallbackStatus = 502): NextResponse {
  if (error instanceof FrappeApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status >= 400 && error.status < 600 ? error.status : fallbackStatus },
    )
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Request failed' },
    { status: fallbackStatus },
  )
}
