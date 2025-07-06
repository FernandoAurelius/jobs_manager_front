import api from '@/plugins/axios'
import '@/types/global.d.ts'
import { debugLog } from '@/utils/debug'

export interface CompanyDefaults {
  materials_markup: number
  time_markup: number
  charge_out_rate: number
  wage_rate: number
}

let cachedDefaults: CompanyDefaults | null = null

export const CompanyDefaultsService = {
  async getDefaults(): Promise<CompanyDefaults> {
    if (cachedDefaults) {
      return cachedDefaults
    }
    try {
      debugLog('🔄 Loading company defaults from API...')
      const response = await api.get<CompanyDefaults>('/job/api/company_defaults/')
      cachedDefaults = response.data

      debugLog('✅ Company defaults loaded successfully:', cachedDefaults)

      window.companyDefaults = cachedDefaults

      return cachedDefaults
    } catch (error: unknown) {
      const errorObj = error as {
        response?: { status?: number }
        message?: string
        config?: { url?: string }
      }
      debugLog('⚠️ Failed to load company defaults from API:', {
        status: errorObj.response?.status,
        message: errorObj.message,
        url: errorObj.config?.url,
      })

      const fallback: CompanyDefaults = {
        materials_markup: 0.2,
        time_markup: 0.3,
        charge_out_rate: 105.0,
        wage_rate: 32.0,
      }

      debugLog('📋 Using fallback company defaults:', fallback)
      window.companyDefaults = fallback
      cachedDefaults = fallback
      return fallback
    }
  },

  clearCache(): void {
    cachedDefaults = null
    window.companyDefaults = null
  },

  getCached(): CompanyDefaults | null {
    return cachedDefaults
  },
}
