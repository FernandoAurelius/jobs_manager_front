import { api } from '@/api/generated/api'
import type {
  JobQuoteChat,
  JobQuoteChatHistoryResponse,
  JobQuoteChatInteractionRequest,
} from '@/api/generated/api'
import type { VueChatMessage } from '@/api/local/schemas'
import { debugLog } from '@/utils/debug'

export class QuoteChatService {
  private static instance: QuoteChatService

  static getInstance(): QuoteChatService {
    if (!this.instance) {
      this.instance = new QuoteChatService()
    }
    return this.instance
  }

  async getChatHistory(jobId: string): Promise<JobQuoteChatHistoryResponse> {
    try {
      return await api.job_api_jobs_quote_chat_retrieve({ id: jobId })
    } catch (error) {
      debugLog('Failed to load chat history:', error)
      throw error
    }
  }

  async saveMessage(jobId: string, message: Omit<JobQuoteChat, 'id'>): Promise<JobQuoteChat> {
    try {
      return await api.job_api_jobs_quote_chat_create({
        id: jobId,
        body: message,
      })
    } catch (error) {
      debugLog('Failed to save chat message:', error)
      throw error
    }
  }

  async updateMessage(
    jobId: string,
    messageId: string,
    updates: Partial<JobQuoteChat>,
  ): Promise<JobQuoteChat> {
    try {
      return await api.job_api_jobs_quote_chat_partial_update({
        id: jobId,
        message_id: messageId,
        body: updates,
      })
    } catch (error) {
      debugLog('Failed to update chat message:', error)
      throw error
    }
  }

  async clearChatHistory(jobId: string): Promise<void> {
    try {
      await api.job_api_jobs_quote_chat_destroy({ id: jobId })
    } catch (error) {
      debugLog('Failed to clear chat history:', error)
      throw error
    }
  }

  convertToVueMessage(message: JobQuoteChat): VueChatMessage {
    return {
      _id: message.id?.toString() || '',
      content: message.content || '',
      senderId: message.role === 'user' ? 'user-1' : 'assistant-1',
      username: message.role === 'user' ? 'You' : 'Quoting Assistant',
      timestamp: message.created_at || new Date().toISOString(),
      system: false,
      metadata: message.metadata,
    }
  }

  convertFromVueMessage(
    vueMessage: VueChatMessage,
    role: 'user' | 'assistant',
  ): Omit<JobQuoteChat, 'id'> {
    return {
      role,
      content: vueMessage.content,
      metadata: vueMessage.metadata || {},
    }
  }

  async getAssistantResponse(jobId: string, message: string): Promise<JobQuoteChat> {
    try {
      const request: JobQuoteChatInteractionRequest = { message }
      return await api.job_api_jobs_quote_chat_interaction_create({
        id: jobId,
        body: request,
      })
    } catch (error) {
      debugLog('Failed to get assistant response:', error)
      throw error
    }
  }
}

export const quoteChatService = QuoteChatService.getInstance()
