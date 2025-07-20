import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/plugins/axios'
import { api, schemas } from '@/api/generated/api'
import { debugLog } from '@/utils/debug'
import type { z } from 'zod'

type User = z.infer<typeof schemas.UserProfile>
type LoginCredentials = z.infer<typeof schemas.CustomTokenObtainPair>

interface ErrorResponse {
  detail?: string
  message?: string
  error?: string
  non_field_errors?: string[]
}

interface AxiosErrorResponse {
  status?: number
  data?: ErrorResponse
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`.trim()
  })

  const clearError = (): void => {
    error.value = null
  }

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string): void => {
    error.value = errorMessage
  }

  const userIsLogged = async (): Promise<boolean> => {
    try {
      const response = await api.accounts_me_retrieve()
      user.value = response
      return true
    } catch {
      user.value = null
      return false
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true)
    clearError()

    try {
      // Convert reactive object to plain object to avoid Zodios serialization issues
      const plainCredentials = JSON.parse(
        JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      )

      // Try different approaches to call the API
      try {
        await api.accounts_api_token_create(plainCredentials)
      } catch {
        await api.accounts_api_token_create({ body: plainCredentials })
      }

      const userResponse = await api.accounts_me_retrieve()
      user.value = userResponse

      return true
    } catch (err: unknown) {
      user.value = null
      let errorMessage = 'Login error. Check if the server is running.'

      // Handle AxiosError specifically
      if (typeof err === 'object' && err !== null) {
        // Check if it's an AxiosError with response
        if ('response' in err) {
          const axiosError = err as { response?: AxiosErrorResponse }
          const response = axiosError.response

          if (response?.status && response.status >= 400 && response.status < 500) {
            // Extract error message from various possible fields in response data
            const responseData = response.data || {}
            const originalError =
              responseData.detail ||
              responseData.message ||
              responseData.error ||
              responseData.non_field_errors?.[0] ||
              ''

            debugLog('Server error response:', originalError)

            // Replace authentication errors with user-friendly message
            if (
              originalError === 'Invalid credentials' ||
              originalError === 'Authentication credentials not provided' ||
              originalError.toLowerCase().includes('invalid') ||
              originalError.toLowerCase().includes('authentication') ||
              originalError.toLowerCase().includes('credentials') ||
              originalError.toLowerCase().includes('password') ||
              originalError.toLowerCase().includes('email')
            ) {
              errorMessage = 'Wrong e-mail or password, please try again'
            } else if (originalError) {
              errorMessage = originalError
            } else {
              errorMessage = 'Wrong e-mail or password, please try again'
            }
          } else {
            // Server error (5xx) or no status
            errorMessage = 'Login error. Check if the server is running.'
          }
        } else if ('code' in err && (err.code === 'NETWORK_ERROR' || err.code === 'ERR_NETWORK')) {
          errorMessage = 'Network error. Please check your internet connection.'
        }
      }

      setError(errorMessage)
      debugLog('Login error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Note: logout endpoint might not be available in generated API
      // Will need to implement via direct axios call if needed
      await axios.post('/accounts/logout/')
    } catch (err) {
      debugLog('Backend logout failed:', err)
    } finally {
      user.value = null
      clearError()
    }
  }

  const initializeAuth = async (): Promise<boolean> => {
    return await userIsLogged()
  }

  return {
    user,
    isLoading,
    error,

    isAuthenticated,
    fullName,

    login,
    logout,
    userIsLogged,
    initializeAuth,
  }
})
