import { ref, computed } from 'vue'
import { quoteService } from '@/services/quote.service'
import type {
  QuoteImportPreviewResponse,
  QuoteImportResponse,
  QuoteStatusResponse,
} from '@/api/local/schemas'
import { debugLog } from '@/utils/debug'

export function useQuoteImport() {
  const isLoading = ref(false)
  const previewData = ref<QuoteImportPreviewResponse | null>(null)
  const importResult = ref<QuoteImportResponse | null>(null)
  const currentQuote = ref<QuoteStatusResponse | null>(null)
  const error = ref<string | null>(null)

  const canProceed = computed(() => {
    return previewData.value?.preview?.can_proceed === true
  })

  const hasValidationIssues = computed(() => {
    const issues = previewData.value?.preview?.validation_report?.issues
    return issues && issues.length > 0
  })

  const hasErrors = computed(() => {
    const issues = previewData.value?.preview?.validation_report?.issues
    return issues && issues.some((issue) => issue.severity === 'error')
  })

  const hasWarnings = computed(() => {
    const issues = previewData.value?.preview?.validation_report?.issues
    return issues && issues.some((issue) => issue.severity === 'warning')
  })

  const totalChanges = computed(() => {
    return previewData.value?.preview?.diff_preview?.total_changes || 0
  })

  const nextRevision = computed(() => {
    return previewData.value?.preview?.diff_preview?.next_revision || 1
  })

  const importWasSuccessful = computed(() => {
    return importResult.value?.success === true
  })

  async function loadQuoteStatus(jobId: string) {
    isLoading.value = true
    error.value = null

    try {
      debugLog('🔍 [useQuoteImport] Loading quote status for jobId:', jobId)
      currentQuote.value = await quoteService.getQuoteStatus(jobId)
      debugLog('✅ [useQuoteImport] Quote status loaded:', currentQuote.value)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load quote status'
      debugLog('❌ [useQuoteImport] Failed to load quote status:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function previewImport(jobId: string, file: File) {
    isLoading.value = true
    error.value = null
    previewData.value = null

    try {
      previewData.value = await quoteService.previewQuoteImport(jobId, file)

      if (previewData.value.preview.error) {
        error.value = previewData.value.preview.error
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Preview failed'
      previewData.value = null
      debugLog('Preview import failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function executeImport(jobId: string, file: File, skipValidation = false) {
    isLoading.value = true
    error.value = null
    importResult.value = null

    try {
      importResult.value = await quoteService.importQuote(jobId, file, skipValidation)

      if (!importResult.value.success && importResult.value.error) {
        error.value = importResult.value.error
      }

      if (importResult.value.success) {
        await loadQuoteStatus(jobId)
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Import failed'
      importResult.value = null
      debugLog('Execute import failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    previewData.value = null
    importResult.value = null
    error.value = null
    isLoading.value = false
  }

  function clearError() {
    error.value = null
  }

  return {
    isLoading,
    previewData,
    importResult,
    currentQuote,
    error,

    canProceed,
    hasValidationIssues,
    hasErrors,
    hasWarnings,
    totalChanges,
    nextRevision,
    importWasSuccessful,

    loadQuoteStatus,
    previewImport,
    executeImport,
    reset,
    clearError,
  }
}
