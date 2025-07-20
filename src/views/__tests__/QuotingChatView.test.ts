import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import QuotingChatView from '../QuotingChatView.vue'
import type { VueChatMessage } from '@/services/quote-chat.service'

// Mock the router
const mockRouter = {
  push: vi.fn(),
}

const mockRoute = {
  query: {
    jobId: 'test-job-id',
    jobName: 'Test Job',
    jobNumber: '2024-001',
    clientName: 'Test Client',
  },
}

// Mock the quote chat service
const mockQuoteChatService = {
  getInstance: vi.fn(() => ({
    getChatHistory: vi.fn(),
    saveMessage: vi.fn(),
    getAssistantResponse: vi.fn(),
    clearChatHistory: vi.fn(),
    convertToVueMessage: vi.fn(),
    convertFromVueMessage: vi.fn(),
  })),
}

// Mock components and services
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}))

vi.mock('@/services/quote-chat.service', () => ({
  QuoteChatService: mockQuoteChatService,
}))

vi.mock('@/utils/debug', () => ({
  debugLog: vi.fn(),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

describe('QuotingChatView MCP Integration', () => {
  const mockUserMessage: VueChatMessage = {
    _id: 'user-123',
    content: 'I need pricing for steel sheets',
    senderId: 'user-1',
    username: 'You',
    timestamp: new Date().toISOString(),
    system: false,
  }

  const mockAssistantMessage: VueChatMessage = {
    _id: 'assistant-456',
    content: 'I found several steel sheet options for you.',
    senderId: 'assistant-1',
    username: 'Quoting Assistant',
    timestamp: new Date().toISOString(),
    system: false,
    metadata: {
      tool_calls: [
        {
          name: 'search_products',
          arguments: { query: 'steel sheet', category: 'metal' },
          result_preview: 'Found 15 products matching your search criteria...',
        },
      ],
      model: 'gemini-1.5-pro',
    },
  }

  const mockAssistantMessageWithoutMetadata: VueChatMessage = {
    _id: 'assistant-789',
    content: 'Hello! How can I help you with your quote?',
    senderId: 'assistant-1',
    username: 'Quoting Assistant',
    timestamp: new Date().toISOString(),
    system: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('MCP tool details display', () => {
    it('shows tool details for assistant messages with metadata', async () => {
      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details">MCP Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Set messages with metadata
      wrapper.vm.messages = [mockUserMessage, mockAssistantMessage]
      await nextTick()

      // Should show MCP tool details for assistant message
      const toolDetails = wrapper.find('[data-testid="mcp-tool-details"]')
      expect(toolDetails.exists()).toBe(true)
    })

    it('does not show tool details for user messages', async () => {
      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details">MCP Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Set messages with user message having metadata (shouldn't happen but test edge case)
      const userMessageWithMetadata = {
        ...mockUserMessage,
        metadata: { tool_calls: [] },
      }
      wrapper.vm.messages = [userMessageWithMetadata]
      await nextTick()

      // Should not show MCP tool details for user message
      const toolDetails = wrapper.find('[data-testid="mcp-tool-details"]')
      expect(toolDetails.exists()).toBe(false)
    })

    it('does not show tool details for assistant messages without metadata', async () => {
      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details">MCP Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Set messages without metadata
      wrapper.vm.messages = [mockUserMessage, mockAssistantMessageWithoutMetadata]
      await nextTick()

      // Should not show MCP tool details
      const toolDetails = wrapper.find('[data-testid="mcp-tool-details"]')
      expect(toolDetails.exists()).toBe(false)
    })

    it('passes correct metadata to McpToolDetails component', async () => {
      const McpToolDetailsMock = {
        template: '<div data-testid="mcp-tool-details">{{ metadata.model }}</div>',
        props: ['metadata'],
      }

      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: McpToolDetailsMock,
          },
        },
      })

      // Set messages with metadata
      wrapper.vm.messages = [mockUserMessage, mockAssistantMessage]
      await nextTick()

      // Should pass metadata correctly
      const toolDetails = wrapper.find('[data-testid="mcp-tool-details"]')
      expect(toolDetails.exists()).toBe(true)
      expect(toolDetails.text()).toContain('gemini-1.5-pro')
    })
  })

  describe('chat message layout with MCP integration', () => {
    it('maintains proper message layout with tool details', async () => {
      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details" class="mt-3">Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Set messages
      wrapper.vm.messages = [mockUserMessage, mockAssistantMessage]
      await nextTick()

      // Check message structure
      const messageElements = wrapper.findAll('.space-y-4 > div')
      expect(messageElements).toHaveLength(2)

      // Check user message (should align right)
      const userMessage = messageElements[0]
      expect(userMessage.classes()).toContain('justify-end')

      // Check assistant message (should align left)
      const assistantMessage = messageElements[1]
      expect(assistantMessage.classes()).toContain('justify-start')

      // Check tool details are in the correct position
      const toolDetails = assistantMessage.find('[data-testid="mcp-tool-details"]')
      expect(toolDetails.exists()).toBe(true)
      expect(toolDetails.classes()).toContain('mt-3')
    })

    it('handles mixed messages with and without metadata', async () => {
      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details">Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Set mixed messages
      wrapper.vm.messages = [
        mockUserMessage,
        mockAssistantMessageWithoutMetadata,
        mockAssistantMessage,
      ]
      await nextTick()

      // Should have three messages
      const messageElements = wrapper.findAll('.space-y-4 > div')
      expect(messageElements).toHaveLength(3)

      // Only the last message should have tool details
      const toolDetails = wrapper.findAll('[data-testid="mcp-tool-details"]')
      expect(toolDetails).toHaveLength(1)
    })
  })

  describe('error handling for corrupted metadata', () => {
    it('handles corrupted metadata gracefully', async () => {
      const messageWithCorruptedMetadata: VueChatMessage = {
        ...mockAssistantMessage,
        metadata: {
          tool_calls: 'not-an-array', // Invalid data type
          model: 123, // Invalid data type
        },
      }

      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template:
                '<div data-testid="mcp-tool-details">{{ errorMessage || "Tool Details" }}</div>',
              props: ['metadata'],
              setup() {
                return {
                  errorMessage: 'Invalid metadata format',
                }
              },
            },
          },
        },
      })

      // Set messages with corrupted metadata
      wrapper.vm.messages = [mockUserMessage, messageWithCorruptedMetadata]
      await nextTick()

      // Should still render but show error
      const toolDetails = wrapper.find('[data-testid="mcp-tool-details"]')
      expect(toolDetails.exists()).toBe(true)
      expect(toolDetails.text()).toContain('Invalid metadata format')
    })

    it('does not crash with null metadata', async () => {
      const messageWithNullMetadata: VueChatMessage = {
        ...mockAssistantMessage,
        metadata: null as unknown,
      }

      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details">Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Set messages with null metadata
      wrapper.vm.messages = [mockUserMessage, messageWithNullMetadata]
      await nextTick()

      // Should not show tool details for null metadata
      const toolDetails = wrapper.find('[data-testid="mcp-tool-details"]')
      expect(toolDetails.exists()).toBe(false)
    })
  })

  describe('responsive design with tool details', () => {
    it('maintains max-width constraint with tool details', async () => {
      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details">Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Set messages
      wrapper.vm.messages = [mockUserMessage, mockAssistantMessage]
      await nextTick()

      // Check that message containers maintain max-width
      const messageContainers = wrapper.findAll('.max-w-md')
      expect(messageContainers.length).toBeGreaterThan(0)

      // Tool details should be inside the message container
      const assistantMessageContainer = messageContainers.find((container) =>
        container.find('[data-testid="mcp-tool-details"]').exists(),
      )
      expect(assistantMessageContainer).toBeTruthy()
    })
  })

  describe('performance considerations', () => {
    it('renders large number of messages with tool details efficiently', async () => {
      const wrapper = mount(QuotingChatView, {
        global: {
          stubs: {
            AppLayout: true,
            McpToolDetails: {
              template: '<div data-testid="mcp-tool-details">Tool Details</div>',
              props: ['metadata'],
            },
          },
        },
      })

      // Create many messages with metadata
      const manyMessages = Array.from({ length: 50 }, (_, i) => ({
        ...mockAssistantMessage,
        _id: `assistant-${i}`,
        content: `Message ${i}`,
      }))

      // Set messages
      wrapper.vm.messages = manyMessages
      await nextTick()

      // Should render all messages without performance issues
      const messageElements = wrapper.findAll('.space-y-4 > div')
      expect(messageElements).toHaveLength(50)

      // Should have tool details for all messages
      const toolDetails = wrapper.findAll('[data-testid="mcp-tool-details"]')
      expect(toolDetails).toHaveLength(50)
    })
  })
})
