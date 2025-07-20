// Use Vite's built-in environment access
const isDevelopment = import.meta.env.MODE === 'development'
const debugEnabled = import.meta.env.VITE_DEBUG === 'true' || isDevelopment

export function debugLog(...args: unknown[]): void {
  if (debugEnabled) {
    console.log('[DEBUG]', ...args)
  }
}

export const debug = {
  log: (...args: unknown[]) => {
    if (debugEnabled) {
      debugLog('[DEBUG]', ...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (debugEnabled) {
      debugLog('[DEBUG-WARN]', ...args)
    }
  },

  error: (...args: unknown[]) => {
    if (debugEnabled) {
      debugLog('[DEBUG-ERROR]', ...args)
    }
  },

  group: (label: string) => {
    if (debugEnabled) {
      console.group(`[DEBUG] ${label}`)
    }
  },

  groupEnd: () => {
    if (debugEnabled) {
      console.groupEnd()
    }
  },

  table: (data: Record<string, unknown> | unknown[]) => {
    if (debugEnabled) {
      console.table(data)
    }
  },
}

export const isDebugEnabled = () => debugEnabled
