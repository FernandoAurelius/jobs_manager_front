import { type ApiError } from '@/api/local/schemas'

export function extractErrorMessage(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (!error) {
    return fallbackMessage
  }

  if (typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiError
    const responseData = apiError.response?.data

    if (responseData) {
      return responseData.error || responseData.message || responseData.details || fallbackMessage
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && 'message' in error) {
    const messageError = error as { message: unknown }
    if (typeof messageError.message === 'string') {
      return messageError.message
    }
  }

  if (typeof error === 'string') {
    return error
  }

  return fallbackMessage
}

export function createErrorToast() {
  return {
    duration: 0,
    action: {
      label: 'Dismiss',
      onClick: () => {},
    },
  }
}
