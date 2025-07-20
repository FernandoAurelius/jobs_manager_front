<template>
  <div class="quote-import-dialog">
    <div class="upload-section">
      <div class="mb-4">
        <label for="file-input" class="block text-sm font-medium text-gray-700 mb-2">
          Select Quote Spreadsheet
        </label>
        <input
          id="file-input"
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          @change="handleFileSelect"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p class="mt-1 text-xs text-gray-500">Supported formats: .xlsx, .xls</p>
      </div>

      <div class="flex gap-2">
        <button
          @click="handlePreview"
          :disabled="!selectedFile || isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isLoading ? 'Loading...' : 'Preview Import' }}
        </button>

        <button
          @click="reset"
          :disabled="isLoading"
          class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
    </div>

    <div v-if="error" class="error-section mb-4">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="previewData" class="preview-section">
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Import Preview</h3>

        <div v-if="hasValidationIssues" class="validation-issues mb-6">
          <h4 class="text-md font-medium text-gray-800 mb-3">Validation Issues</h4>
          <div class="space-y-2">
            <div
              v-for="(issue, index) in previewData.preview.validation_report.issues"
              :key="index"
              :class="[
                'p-3 rounded-md border-l-4 text-sm',
                issue.severity === 'error'
                  ? 'bg-red-50 border-red-400 text-red-700'
                  : 'bg-yellow-50 border-yellow-400 text-yellow-700',
              ]"
            >
              <div class="flex items-start">
                <svg
                  :class="[
                    'h-4 w-4 mt-0.5 mr-2',
                    issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400',
                  ]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    v-if="issue.severity === 'error'"
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                  <path
                    v-else
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <span class="font-medium capitalize">{{ issue.severity }}:</span>
                  {{ issue.message }}
                  <span v-if="issue.line_number" class="text-xs opacity-75">
                    (Line {{ issue.line_number }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="previewData.preview.diff_preview" class="changes-summary mb-6">
          <h4 class="text-md font-medium text-gray-800 mb-3">Changes Summary</h4>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">
                  {{ previewData.preview.diff_preview.next_revision }}
                </div>
                <div class="text-sm text-gray-600">Next Revision</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">
                  {{ previewData.preview.diff_preview.total_changes }}
                </div>
                <div class="text-sm text-gray-600">Total Changes</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">
                  +{{ previewData.preview.diff_preview.additions_count }}
                </div>
                <div class="text-sm text-gray-600">Additions</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-600">
                  ~{{ previewData.preview.diff_preview.updates_count }}
                </div>
                <div class="text-sm text-gray-600">Updates</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">
                  -{{ previewData.preview.diff_preview.deletions_count }}
                </div>
                <div class="text-sm text-gray-600">Deletions</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="previewData.preview.draft_lines?.length > 0" class="draft-lines mb-6">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-md font-medium text-gray-800">
              Import Lines ({{ previewData.preview.draft_lines.length }} total)
            </h4>
            <button
              v-if="previewData.preview.draft_lines.length > 5"
              @click="showAllLines = !showAllLines"
              class="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <span>{{
                showAllLines ? 'Show Less' : `Show All (${previewData.preview.draft_lines.length})`
              }}</span>
              <svg
                :class="['w-4 h-4 transition-transform', { 'rotate-180': showAllLines }]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-gray-900">Kind</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-900">Description</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-900">Qty</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-900">Unit Cost</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(line, index) in displayedLines" :key="index" class="hover:bg-gray-50">
                    <td class="px-3 py-2 text-gray-900">{{ line.kind }}</td>
                    <td class="px-3 py-2 text-gray-900">{{ line.desc }}</td>
                    <td class="px-3 py-2 text-right text-gray-900">{{ line.quantity }}</td>
                    <td class="px-3 py-2 text-right text-gray-900">
                      ${{ line.unit_cost.toFixed(2) }}
                    </td>
                    <td class="px-3 py-2 text-right font-medium text-gray-900">
                      ${{ line.total_cost.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="import-actions flex gap-3">
          <button
            @click="handleImport"
            :disabled="!canProceed || isLoading"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="isLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isLoading ? 'Importing...' : 'Execute Import' }}
          </button>

          <button
            v-if="hasValidationIssues && !hasErrors"
            @click="handleForceImport"
            :disabled="isLoading"
            class="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Force Import (Skip Validation)
          </button>
        </div>
      </div>
    </div>

    <div v-if="importResult" class="result-section">
      <div
        v-if="importResult.success"
        class="success bg-green-50 border border-green-200 rounded-lg p-6"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg
              class="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-green-800">Import Successful!</h3>
            <div class="mt-2 text-sm text-green-700">
              <p>Quote has been imported successfully.</p>
              <div v-if="importResult.cost_set" class="mt-3 space-y-1">
                <p><strong>Revision:</strong> {{ importResult.cost_set.rev }}</p>
                <p>
                  <strong>Total Cost:</strong> ${{
                    importResult.cost_set.summary.cost.toLocaleString()
                  }}
                </p>
                <p v-if="importResult.changes">
                  <strong>Changes:</strong>
                  +{{ importResult.changes.additions }} ~{{ importResult.changes.updates }} -{{
                    importResult.changes.deletions
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="error bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-red-800">Import Failed</h3>
            <p class="mt-1 text-sm text-red-700">
              {{ importResult.error || 'Unknown error occurred' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuoteImport } from '@/composables/useQuoteImport'
import type { QuoteImportResponse } from '@/api/local/schemas'

const props = defineProps<{
  jobId: string
}>()

const emit = defineEmits<{
  (e: 'success', result: QuoteImportResponse): void
  (e: 'cancel'): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const showAllLines = ref(false)

const {
  isLoading,
  previewData,
  importResult,
  error,
  canProceed,
  hasValidationIssues,
  hasErrors,
  previewImport,
  executeImport,
  reset,
  clearError,
} = useQuoteImport()

const displayedLines = computed(() => {
  if (!previewData.value?.preview?.draft_lines) return []

  const lines = previewData.value.preview.draft_lines
  return showAllLines.value ? lines : lines.slice(0, 5)
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
  showAllLines.value = false
  reset()
  clearError()
}

async function handlePreview() {
  if (!selectedFile.value) return
  await previewImport(props.jobId, selectedFile.value)
}

async function handleImport() {
  if (!selectedFile.value) return
  await executeImport(props.jobId, selectedFile.value, false)

  if (importResult.value?.success) {
    emit('success', importResult.value)
  }
}

async function handleForceImport() {
  if (!selectedFile.value) return
  await executeImport(props.jobId, selectedFile.value, true)

  if (importResult.value?.success) {
    emit('success', importResult.value)
  }
}
</script>

<style scoped></style>
