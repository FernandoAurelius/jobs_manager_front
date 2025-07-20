import { api } from '../api/generated/api'
import { debugLog } from '../utils/debug'
import { schemas } from '../api/generated/api'
import { z } from 'zod'

// Use generated schemas
export type Client = z.infer<typeof schemas.ClientSearchResult>
export type CreateClientData = z.infer<typeof schemas.ClientCreateRequest>
import type { CreateClientResponse } from '../api/local/schemas'

export class ClientService {
  private static instance: ClientService

  static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService()
    }
    return ClientService.instance
  }

  async createClient(data: CreateClientData): Promise<CreateClientResponse> {
    try {
      const response = await api.clients_create_create(data)
      return {
        success: true,
        client: response,
      }
    } catch (error: unknown) {
      debugLog('Error creating client:', error)
      return {
        success: false,
        error: 'Failed to create client',
      }
    }
  }

  async getAllClients(): Promise<Client[]> {
    try {
      const response = await api.clients_all_retrieve()
      return Array.isArray(response) ? response : []
    } catch (error) {
      debugLog('Error fetching clients:', error)
      throw new Error('Failed to load clients')
    }
  }

  searchClients(clientList: Client[], searchTerm: string): Client[] {
    if (!searchTerm.trim()) {
      return clientList
    }

    const term = searchTerm.toLowerCase()
    return clientList.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.contact_person?.toLowerCase().includes(term),
    )
  }
}

export const clientService = ClientService.getInstance()
