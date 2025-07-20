import { api } from '@/api/generated/api'
import type { CompanyDefaults } from '@/api/generated/api'
import { debugLog } from '@/utils/debug'

let cachedDefaults: CompanyDefaults | null = null

export const CompanyDefaultsService = {
  async getDefaults(): Promise<CompanyDefaults> {
    if (cachedDefaults) {
      return cachedDefaults
    }
    try {
      debugLog('🔄 Loading company defaults from API...')
      cachedDefaults = await api.api_company_defaults_retrieve()
      debugLog('✅ Company defaults loaded successfully:', cachedDefaults)
      return cachedDefaults
    } catch (error) {
      debugLog('❌ Failed to load company defaults:', error)
      throw error
    }
  },
  clearCache(): void {
    cachedDefaults = null
  },

  getCached(): CompanyDefaults | null {
    return cachedDefaults
  },
}
