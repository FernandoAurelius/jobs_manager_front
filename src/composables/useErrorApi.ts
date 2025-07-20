import { ref } from 'vue'
import { z } from 'zod'
import { api, schemas } from '../api/generated/api'
import { getApiBaseUrl } from '../plugins/axios'

type XeroError = z.infer<typeof schemas.XeroError>

interface DateRange {
  start: string | null
  end: string | null
}

export function useErrorApi() {
  const error = ref<string | null>(null)

  async function fetchErrors(
    type: 'xero' | 'system',
    page: number,
    search: string,
    range: DateRange,
  ): Promise<{ results: XeroError[]; pageCount: number }> {
    error.value = null
    try {
      if (type === 'xero') {
        // Use Zodios API for xero errors
        // Note: search and date filtering not available in current API, would need backend update
        if (page > 1) {
          const response = await api.xero_errors_list({ queries: { page } })
          return {
            results: response.results || [],
            pageCount: response.count
              ? Math.ceil(response.count / (response.results?.length || 50))
              : 0,
          }
        } else {
          const response = await api.xero_errors_list()
          return {
            results: response.results || [],
            pageCount: response.count
              ? Math.ceil(response.count / (response.results?.length || 50))
              : 0,
          }
        }
      } else {
        // TODO: System errors endpoint not available in generated API yet
        // This should be migrated when the system errors endpoint is added to the OpenAPI spec
        const axios = (await import('axios')).default
        const params: Record<string, unknown> = { page }
        if (search.trim()) params.search = search.trim()
        if (range.start) params.date_from = range.start
        if (range.end) params.date_to = range.end
        const base = getApiBaseUrl()
        const res = await axios.get(`${base}/system-errors/`, { params })
        return {
          results: res.data.results,
          pageCount: Math.ceil(res.data.count / 50),
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) error.value = e.message
      else error.value = 'Failed to fetch errors.'
      return { results: [], pageCount: 0 }
    }
  }

  return { fetchErrors, error }
}
