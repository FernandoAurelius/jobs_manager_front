import { api, schemas } from '@/api/generated/api'
import { debugLog } from '@/utils/debug'
import { z } from 'zod'

type AIProvider = z.infer<typeof schemas.AIProvider>
type AIProviderCreateUpdate = z.infer<typeof schemas.AIProviderCreateUpdate>

export class AIProviderService {
  private static instance: AIProviderService

  public static getInstance(): AIProviderService {
    if (!AIProviderService.instance) {
      AIProviderService.instance = new AIProviderService()
    }
    return AIProviderService.instance
  }

  private constructor() {}

  async getProviders(): Promise<AIProvider[]> {
    try {
      return await api.api_workflow_ai_providers_list()
    } catch (error) {
      debugLog('Failed to fetch AI providers:', error)
      throw error
    }
  }

  async createProvider(providerData: AIProviderCreateUpdate): Promise<AIProvider> {
    try {
      return await api.api_workflow_ai_providers_create(providerData)
    } catch (error) {
      debugLog('Failed to create AI provider:', error)
      throw error
    }
  }

  async updateProvider(
    id: number,
    providerData: Partial<AIProviderCreateUpdate>,
  ): Promise<AIProvider> {
    try {
      return await api.api_workflow_ai_providers_partial_update(providerData, {
        params: { id: id.toString() },
      })
    } catch (error) {
      debugLog(`Failed to update AI provider ${id}:`, error)
      throw error
    }
  }

  async deleteProvider(id: number): Promise<void> {
    try {
      await api.api_workflow_ai_providers_destroy(undefined, { params: { id: id.toString() } })
    } catch (error) {
      debugLog(`Failed to delete AI provider ${id}:`, error)
      throw error
    }
  }

  async getProvider(id: number): Promise<AIProvider> {
    try {
      return await api.api_workflow_ai_providers_retrieve({ params: { id: id.toString() } })
    } catch (error) {
      debugLog(`Failed to get AI provider ${id}:`, error)
      throw error
    }
  }

  async setDefaultProvider(id: number, providerData: AIProvider): Promise<AIProvider> {
    try {
      return await api.api_workflow_ai_providers_set_default_create(providerData, {
        params: { id: id.toString() },
      })
    } catch (error) {
      debugLog(`Failed to set default AI provider ${id}:`, error)
      throw error
    }
  }
}

export const aiProviderService = AIProviderService.getInstance()
