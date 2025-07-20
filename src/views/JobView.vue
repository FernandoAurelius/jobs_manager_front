<template>
  <AppLayout>
    <div class="flex flex-col h-full min-h-0">
      <div class="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-6 md:px-6 md:py-8">
        <div class="md:hidden">
          <div class="flex items-center justify-between mb-3">
            <button
              @click="navigateBack"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
          </div>
          <div class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <h1 class="text-lg font-bold text-gray-900 leading-tight">
                {{ jobData?.name || 'Loading...' }}
              </h1>
              <span
                v-if="shouldShowQuoteWarning"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                :title="`Quote accepted on ${formatDate(jobDataWithPaid?.quote_acceptance_date || '')} - Create a revision to edit`"
              >
                Quote Accepted
              </span>
            </div>
            <p class="text-sm text-gray-500">
              Job #{{ jobData?.job_number }} • {{ jobData?.client_name }}
            </p>
          </div>
        </div>
        <div class="hidden md:flex items-center justify-between h-12">
          <div class="flex items-center space-x-4 h-full">
            <button
              @click="navigateBack"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors self-center"
              style="align-self: center"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div class="flex flex-col justify-center h-full">
              <div class="flex items-center gap-2">
                <h1 class="text-lg font-bold text-gray-900 leading-tight">
                  {{ jobData?.name || 'Loading...' }}
                </h1>
                <span
                  v-if="shouldShowQuoteWarning"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                  :title="`Quote accepted on ${formatDate(jobDataWithPaid?.quote_acceptance_date || '')} - Create a revision to edit`"
                >
                  Quote Accepted
                </span>
              </div>
              <p class="text-xs text-gray-500">
                Job #{{ jobData?.job_number }} • {{ jobData?.client_name }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="loadingJob || jobError"
        class="flex flex-1 items-center justify-center min-h-[200px]"
      >
        <span class="text-gray-500 text-lg font-medium">Loading...</span>
      </div>
      <template v-else>
        <JobViewTabs
          v-if="jobDataWithPaid && companyDefaults && activeTab"
          :active-tab="activeTab"
          @change-tab="setTab"
          :job-data="jobDataWithPaid"
          :company-defaults="companyDefaults"
          :latest-pricings="latestPricings"
          @open-settings="openSettingsModal"
          @open-workflow="openWorkflowModal"
          @open-history="openHistoryModal"
          @open-attachments="openAttachmentsModal"
          @open-pdf="openPdfDialog"
          @quote-imported="handleQuoteImported"
          @quote-created="handleQuoteCreated"
          @quote-accepted="handleQuoteAccepted"
          @invoice-created="handleInvoiceCreated"
          @quote-deleted="handleQuoteDeleted"
          @invoice-deleted="handleInvoiceDeleted"
          @reload-job="handleReloadJob"
        />
      </template>
      <div class="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <div class="md:hidden space-y-3">
          <div class="flex space-x-3">
            <DraggableButton
              variant="primary"
              @click="openPdfDialog"
              class="bg-blue-600 hover:bg-blue-700 flex-1"
              size="sm"
            >
              <Printer class="w-4 h-4 mr-2" />
              Print
            </DraggableButton>
            <DraggableButton
              variant="destructive"
              @click="confirmDeleteJob"
              class="bg-red-600 hover:bg-red-700 flex-1"
              size="sm"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              Delete
            </DraggableButton>
            <DraggableButton
              variant="secondary"
              @click="navigateBack"
              class="bg-gray-600 hover:bg-gray-700 w-full"
              size="sm"
            >
              <X class="w-4 h-4 mr-2" />
              Close
            </DraggableButton>
          </div>
        </div>
        <div class="hidden md:block">
          <div class="flex items-center justify-center space-x-3 mb-2">
            <DraggableButton
              variant="primary"
              @click="openPdfDialog"
              class="bg-blue-600 hover:bg-blue-700"
            >
              <Printer class="w-4 h-4 mr-2" />
              Print Job Sheet
            </DraggableButton>
            <DraggableButton
              variant="destructive"
              @click="confirmDeleteJob"
              class="bg-red-600 hover:bg-red-700"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              Delete Job
            </DraggableButton>
            <DraggableButton
              variant="secondary"
              @click="navigateBack"
              class="bg-gray-600 hover:bg-gray-700"
            >
              <X class="w-4 h-4 mr-2" />
              Close
            </DraggableButton>
          </div>
        </div>
      </div>
      <JobSettingsModal
        v-if="showSettingsModal && jobDataWithPaid"
        :job-data="jobDataWithPaid"
        :is-open="showSettingsModal"
        @close="showSettingsModal = false"
        @job-updated="handleJobUpdated"
      />
      <JobWorkflowModal
        v-if="showWorkflowModal && jobDataWithPaid"
        :job-data="jobDataWithPaid"
        :is-open="showWorkflowModal"
        @close="showWorkflowModal = false"
      />
      <JobHistoryModal
        v-if="showHistoryModal && jobDataWithPaid"
        :job-id="jobId"
        :events="jobEvents"
        :is-open="showHistoryModal"
        :loading="loadingJob || jobEventsLoading"
        @close="showHistoryModal = false"
        @event-added="handleEventAdded"
      />
      <JobAttachmentsModal
        v-if="showAttachmentsModal && jobDataWithPaid"
        :job-id="jobId"
        :job-number="jobDataWithPaid.job_number"
        :is-open="showAttachmentsModal"
        @close="showAttachmentsModal = false"
        @file-uploaded="handleFileUploaded"
        @file-deleted="handleFileDeleted"
      />
      <JobPdfDialog
        v-if="showPdfDialog && jobDataWithPaid"
        :job-id="jobId"
        :job-number="jobDataWithPaid.job_number"
        :open="showPdfDialog"
        @update:open="showPdfDialog = $event"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import JobViewTabs from '@/components/job/JobViewTabs.vue'
import JobSettingsModal from '@/components/job/JobSettingsModal.vue'
import JobWorkflowModal from '@/components/job/JobWorkflowModal.vue'
import JobHistoryModal from '@/components/job/JobHistoryModal.vue'
import JobAttachmentsModal from '@/components/job/JobAttachmentsModal.vue'
import JobPdfDialog from '@/components/job/JobPdfDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { useJobsStore } from '../stores/jobs'
import { useJobTabs } from '@/composables/useJobTabs'
import { useJobNotifications } from '@/composables/useJobNotifications'
import { useJobEvents } from '@/composables/useJobEvents'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import { api } from '../api/generated/api'
import { ArrowLeft, Printer, Trash2, X } from 'lucide-vue-next'
import DraggableButton from '@/components/job/DraggableButton.vue'

const route = useRoute()
const router = useRouter()
const jobsStore = useJobsStore()
const jobId = computed(() => route.params.id as string)
const jobData = computed(() => jobsStore.getJobById(jobId.value))
const loadingJob = computed(() => jobsStore.isLoadingJob)

onMounted(async () => {
  jobsStore.setCurrentJobId(jobId.value)
  await jobsStore.fetchJob(jobId.value)
})

const { jobEvents, addEvent, loading: jobEventsLoading } = useJobEvents(jobId)
const { activeTab, setTab } = useJobTabs('actual')
const notifications = useJobNotifications()

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)

const latestPricings = computed(() => jobData.value?.latestPricings || {})
const jobDataWithPaid = computed(() => {
  if (!jobData.value) return undefined
  return {
    ...jobData.value,
    paid: Boolean(jobData.value.paid),
  }
})
const jobError = computed(() => !loadingJob.value && !jobData.value)

// Quote status computed properties
const isQuoteAccepted = computed(() => {
  return !!jobDataWithPaid.value?.quote_acceptance_date
})

// Check if there are any quote revisions available
const hasQuoteRevisions = computed(() => {
  if (!quoteRevisionsData.value) return false
  return quoteRevisionsData.value.total_revisions > 0
})

// Show warning only if quote is accepted AND there are no revisions
const shouldShowQuoteWarning = computed(() => {
  return isQuoteAccepted.value && !hasQuoteRevisions.value
})

// Format date function
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const showSettingsModal = ref(false)
const showWorkflowModal = ref(false)
const showHistoryModal = ref(false)
const showAttachmentsModal = ref(false)
const showPdfDialog = ref(false)

// Store quote revisions data to check if edits should be blocked
const quoteRevisionsData = ref<{ total_revisions: number } | null>(null)

// Fetch quote revisions to determine if edits should be blocked
async function fetchQuoteRevisions() {
  if (!jobId.value) return
  try {
    const response = await api.job_rest_jobs_cost_sets_quote_revise_retrieve({
      params: { job_id: jobId.value },
    })
    quoteRevisionsData.value = response
  } catch {
    // Silently fail - if we can't fetch revisions, assume no revisions exist
    quoteRevisionsData.value = { total_revisions: 0 }
  }
}

// Watch for quote acceptance to fetch revisions data
watch(
  () => jobDataWithPaid.value?.quote_acceptance_date,
  (acceptanceDate) => {
    if (acceptanceDate) {
      fetchQuoteRevisions()
    }
  },
  { immediate: true },
)

function openSettingsModal() {
  showSettingsModal.value = true
}
function openWorkflowModal() {
  showWorkflowModal.value = true
}
function openHistoryModal() {
  showHistoryModal.value = true
}
function openAttachmentsModal() {
  showAttachmentsModal.value = true
}
function openPdfDialog() {
  showPdfDialog.value = true
}

function handleJobUpdated(updatedJob) {
  jobsStore.setDetailedJob(updatedJob)
  notifications.notifyJobUpdated(updatedJob?.name || 'Job')
}

async function handleEventAdded(event) {
  if (event?.description) {
    await addEvent(event.description)
    await jobsStore.fetchJob(jobId.value)
    notifications.notifyEventAdded(event.event_type || 'Event')
  }
}

function navigateBack() {
  router.push({ name: 'kanban' })
}
function confirmDeleteJob() {
  if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
    deleteJob()
  }
}

async function deleteJob() {
  if (!jobId.value) return
  const jobName = jobData.value?.name || `Job #${jobData.value?.job_number}` || 'job'
  try {
    notifications.notifyDeleteStart(jobName)
    const { jobService } = await import('@/services/job.service')
    const result = await jobService.deleteJob(jobId.value)
    if (result.success) {
      notifications.notifyDeleteSuccess(jobName)
      navigateBack()
    } else {
      throw new Error(result.error || 'Failed to delete job')
    }
  } catch (err: unknown) {
    notifications.notifyDeleteError(
      (err as Error)?.message || 'Unexpected error when trying to delete job ',
      jobName,
    )
    debugLog('JobView - Error deleting job:', err)
  }
}

function handleQuoteImported() {
  notifications.notifyJobUpdated('Quote imported')
  // Reload job data to show the imported quote
  jobsStore.fetchJob(jobId.value)
}
function handleQuoteCreated() {
  notifications.notifyJobUpdated('Quote created')
  // Reload job data to show the newly created quote
  jobsStore.fetchJob(jobId.value)
}
function handleQuoteAccepted() {
  notifications.notifyJobUpdated('Quote accepted')
  // Reload job data to reflect quote acceptance
  jobsStore.fetchJob(jobId.value)
}
function handleInvoiceCreated() {
  notifications.notifyJobUpdated('Invoice created')
  // Reload job data to show the newly created invoice
  jobsStore.fetchJob(jobId.value)
}
function handleQuoteDeleted() {
  notifications.notifyJobUpdated('Quote deleted')
  // Reload job data to reflect quote deletion
  jobsStore.fetchJob(jobId.value)
}
function handleInvoiceDeleted() {
  notifications.notifyJobUpdated('Invoice deleted')
  // Reload job data to reflect invoice deletion
  jobsStore.fetchJob(jobId.value)
}
function handleFileUploaded() {
  notifications.notifyJobUpdated('File uploaded')
  // Reload job data to update file list
  jobsStore.fetchJob(jobId.value)
}
function handleFileDeleted() {
  notifications.notifyJobUpdated('File deleted')
  // Reload job data to update file list
  jobsStore.fetchJob(jobId.value)
}

function handleReloadJob() {
  // Simple job reload when cost lines are changed
  jobsStore.fetchJob(jobId.value)
}

debugLog('JobView - jobId:', jobId.value)

watch(jobData, (val) => {
  debugLog('JobView - jobData changed:', val)
})
</script>

<style scoped>
.h-screen {
  height: 100vh;
}
.max-h-screen {
  max-height: 100vh;
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
