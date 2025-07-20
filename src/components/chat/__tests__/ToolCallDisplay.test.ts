import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToolCallDisplay from '../ToolCallDisplay.vue'
import type { ToolCall } from '@/schemas/mcp-tool-metadata.schema'

describe('ToolCallDisplay', () => {
  const mockToolCall: ToolCall = {
    name: 'search_products',
    arguments: {
      query: 'steel sheet',
      category: 'metal',
      limit: 10,
    },
    result_preview:
      'Found 15 products matching your search criteria. Top results include: 1. Steel Sheet 2mm - $12.50/sq ft, 2. Steel Sheet 3mm - $15.00/sq ft...',
  }

  describe('basic rendering', () => {
    it('displays tool name correctly', () => {
      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: mockToolCall,
        },
      })

      expect(wrapper.text()).toContain('search_products')
      expect(wrapper.text()).toContain('Tool Call')
    })

    it('starts collapsed by default', () => {
      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: mockToolCall,
        },
      })

      // Details should be hidden initially
      expect(wrapper.find('[data-testid="tool-arguments"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="tool-result"]').exists()).toBe(false)
    })

    it('expands when clicked', async () => {
      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: mockToolCall,
        },
      })

      // Click the expand button
      await wrapper.find('button').trigger('click')

      // Details should now be visible
      expect(wrapper.text()).toContain('Arguments')
      expect(wrapper.text()).toContain('Result Preview')
    })

    it('toggles chevron icon on expand/collapse', async () => {
      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: mockToolCall,
        },
      })

      const chevron = wrapper.find('[data-lucide="chevron-down"]')

      // Initially not rotated
      expect(chevron.classes()).not.toContain('rotate-180')

      // Click to expand
      await wrapper.find('button').trigger('click')
      expect(chevron.classes()).toContain('rotate-180')

      // Click to collapse
      await wrapper.find('button').trigger('click')
      expect(chevron.classes()).not.toContain('rotate-180')
    })
  })

  describe('arguments display', () => {
    it('displays formatted arguments correctly', async () => {
      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: mockToolCall,
        },
      })

      await wrapper.find('button').trigger('click')

      const argumentsSection = wrapper.find('pre')
      expect(argumentsSection.exists()).toBe(true)

      // Check that JSON is formatted
      expect(argumentsSection.text()).toContain('"query": "steel sheet"')
      expect(argumentsSection.text()).toContain('"category": "metal"')
      expect(argumentsSection.text()).toContain('"limit": 10')
    })

    it('handles empty arguments', async () => {
      const toolCallWithEmptyArgs: ToolCall = {
        name: 'no_args_tool',
        arguments: {},
        result_preview: 'Some result',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: toolCallWithEmptyArgs,
        },
      })

      await wrapper.find('button').trigger('click')

      // Should still show the result section
      expect(wrapper.text()).toContain('Result Preview')
      expect(wrapper.text()).toContain('Some result')
    })

    it('handles malformed arguments gracefully', async () => {
      const toolCallWithBadArgs: ToolCall = {
        name: 'bad_args_tool',
        arguments: { circular: null } as Record<string, unknown>,
        result_preview: 'Some result',
      }

      // Create circular reference to test JSON.stringify error handling
      toolCallWithBadArgs.arguments.circular = toolCallWithBadArgs.arguments

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: toolCallWithBadArgs,
        },
      })

      await wrapper.find('button').trigger('click')

      // Should not crash and should show something
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('result preview display', () => {
    it('displays result preview correctly', async () => {
      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: mockToolCall,
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('Result Preview')
      expect(wrapper.text()).toContain('Found 15 products matching your search criteria')
    })

    it('shows truncation indicator for long results', async () => {
      const longResult = 'A'.repeat(200) // Exactly 200 characters
      const toolCallWithLongResult: ToolCall = {
        name: 'long_result_tool',
        arguments: {},
        result_preview: longResult,
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: toolCallWithLongResult,
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('Result truncated to 200 characters')
    })

    it('does not show truncation indicator for short results', async () => {
      const shortResult = 'Short result'
      const toolCallWithShortResult: ToolCall = {
        name: 'short_result_tool',
        arguments: {},
        result_preview: shortResult,
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: toolCallWithShortResult,
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).not.toContain('Result truncated')
    })

    it('handles empty result preview', async () => {
      const toolCallWithEmptyResult: ToolCall = {
        name: 'empty_result_tool',
        arguments: { query: 'test' },
        result_preview: '',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: toolCallWithEmptyResult,
        },
      })

      await wrapper.find('button').trigger('click')

      // Should show arguments but handle empty result gracefully
      expect(wrapper.text()).toContain('Arguments')
      expect(wrapper.text()).toContain('"query": "test"')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles tool call with minimal data', () => {
      const minimalToolCall: ToolCall = {
        name: 'minimal_tool',
        arguments: {},
        result_preview: '',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: minimalToolCall,
        },
      })

      expect(wrapper.text()).toContain('minimal_tool')
      expect(wrapper.exists()).toBe(true)
    })

    it('displays no data message when no arguments or results', async () => {
      const emptyToolCall: ToolCall = {
        name: 'empty_tool',
        arguments: {},
        result_preview: '',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: emptyToolCall,
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('No additional details available')
    })

    it('handles very long tool names', () => {
      const longNameToolCall: ToolCall = {
        name: 'very_long_tool_name_that_should_be_handled_gracefully_without_breaking_the_layout_or_causing_overflow_issues',
        arguments: {},
        result_preview: 'Result',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: longNameToolCall,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('very_long_tool_name')
    })
  })

  describe('XSS prevention', () => {
    it('prevents XSS in result preview', async () => {
      const xssToolCall: ToolCall = {
        name: 'xss_tool',
        arguments: {},
        result_preview:
          '<script>alert("xss")</script><img src="x" onerror="alert(1)">Malicious content',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: xssToolCall,
        },
      })

      await wrapper.find('button').trigger('click')

      // Should not contain script tags or HTML
      expect(wrapper.html()).not.toContain('<script>')
      expect(wrapper.html()).not.toContain('<img')
      expect(wrapper.html()).not.toContain('alert("xss")')
      expect(wrapper.html()).not.toContain('onerror')

      // Should contain safe text content
      expect(wrapper.text()).toContain('Malicious content')
    })

    it('prevents XSS in tool name', () => {
      const xssToolCall: ToolCall = {
        name: '<script>alert("xss")</script>dangerous_tool',
        arguments: {},
        result_preview: 'Safe result',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: xssToolCall,
        },
      })

      // Should not contain script tags
      expect(wrapper.html()).not.toContain('<script>')
      expect(wrapper.html()).not.toContain('alert("xss")')
    })

    it('handles Unicode and special characters safely', async () => {
      const unicodeToolCall: ToolCall = {
        name: 'unicode_tool_测试',
        arguments: {
          query: '测试中文字符',
          symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          emoji: '🔧⚙️🛠️',
        },
        result_preview: 'Results with émojis 🔧⚙️🛠️ and symbols !@#$%^&*()',
      }

      const wrapper = mount(ToolCallDisplay, {
        props: {
          toolCall: unicodeToolCall,
        },
      })

      await wrapper.find('button').trigger('click')

      // Should handle Unicode characters properly
      expect(wrapper.text()).toContain('unicode_tool_测试')
      expect(wrapper.text()).toContain('测试中文字符')
      expect(wrapper.text()).toContain('🔧⚙️🛠️')
      expect(wrapper.text()).toContain('!@#$%^&*()')
    })
  })
})
