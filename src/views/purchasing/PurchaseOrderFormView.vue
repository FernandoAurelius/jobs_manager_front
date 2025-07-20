<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="text-gray-600">Loading purchase order...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
        <Button @click="load" class="mt-2" variant="outline" size="sm"> Try Again </Button>
      </div>

      <!-- Main Content -->
      <div v-else class="flex flex-col lg:flex-row gap-6">
        <PoSummaryCard
          :po="po"
          :is-create-mode="false"
          :show-actions="canShowActions"
          :sync-enabled="canSync"
          :supplier-readonly="!canEditSupplier"
          :class="{
            'opacity-75': isPoDeleted,
            'opacity-90': isPoSubmitted,
          }"
          @update:supplier="canEditSupplier ? (po.supplier = $event) : null"
          @update:supplier_id="canEditSupplier ? (po.supplier_id = $event) : null"
          @update:reference="!isPoDeleted ? (po.reference = $event) : null"
          @update:expected_delivery="!isPoDeleted ? (po.expected_delivery = $event) : null"
          @update:status="canEditStatus ? (po.status = $event) : null"
          @save="saveSummary"
          @sync-xero="syncWithXero"
          @view-xero="viewInXero"
          @print="printPo"
          @email="emailPo"
        />
        <Card
          class="flex-1 flex flex-col"
          :class="{
            'opacity-75': isPoDeleted,
            'opacity-90': isPoSubmitted,
          }"
        >
          <CardHeader>
            <h2 class="font-semibold">Line Items</h2>
          </CardHeader>
          <CardContent class="flex-1 flex flex-col">
            <PoLinesTable
              :lines="po.lines"
              :items="xeroItemStore.items"
              :jobs="jobs"
              :read-only="!canEditLineItems"
              :jobs-read-only="!canEditJobs"
              @update:lines="canEditLineItems || canEditJobs ? (po.lines = $event) : null"
              @add-line="handleAddLineEvent"
              @delete-line="deleteLine"
            />
          </CardContent>
        </Card>
      </div>

      <!-- Deleted PO Warning Banner - Horizontal below cards -->
      <div v-if="isPoDeleted" class="w-full bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <span class="text-sm font-medium text-red-800">Purchase Order Deleted</span>
            <span class="text-sm text-red-700 ml-2"
              >This purchase order has been deleted. All editing functions are disabled - you can
              only view the details.</span
            >
          </div>
        </div>
      </div>

      <!-- Submitted PO Warning Banner - Horizontal below cards -->
      <div
        v-else-if="isPoSubmitted"
        class="w-full bg-blue-50 border border-blue-200 rounded-lg p-3"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <span class="text-sm font-medium text-blue-800"
              >Purchase Order Submitted to Supplier</span
            >
            <span class="text-sm text-blue-700 ml-2"
              >This purchase order has been submitted to the supplier. Supplier and line item
              changes are locked, but other details can still be updated.</span
            >
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 justify-end">
        <Button aria-label="Close" @click="close">Close</Button>
      </div>
    </div>

    <!-- PDF Dialog -->
    <PoPdfDialog
      :open="showPdfDialog"
      :purchase-order-id="orderId"
      :po-number="po.po_number"
      @update:open="showPdfDialog = $event"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, watch, onMounted, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PoSummaryCard from '@/components/purchasing/PoSummaryCard.vue'
import PoLinesTable from '@/components/purchasing/PoLinesTable.vue'
import PoPdfDialog from '@/components/purchasing/PoPdfDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { usePurchaseOrderStore } from '@/stores/purchaseOrderStore'
import { useXeroItemStore } from '@/stores/xeroItemStore'
import { extractErrorMessage, createErrorToast } from '@/utils/errorHandler'
import { toast } from 'vue-sonner'
import { api } from '@/api/generated/api'
import axios from 'axios'

// Import types from generated API schemas
import type { PurchaseOrderLine, PurchaseOrderDetail, JobForPurchasing } from '@/api/generated/api'

// Import UI-specific types from local schemas
import type { XeroSyncResponse } from '@/api/local/schemas'

// Use the generated interface instead of local type
type PurchaseOrder = PurchaseOrderDetail
type Job = JobForPurchasing

const route = useRoute()
const router = useRouter()
const orderId = route.params.id as string
const store = usePurchaseOrderStore()
const xeroItemStore = useXeroItemStore()
const originalLines = ref<PurchaseOrderLine[]>([])
const isSyncing = ref(false)
const showPdfDialog = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const jobs = ref<Job[]>([])
const isLoadingJobs = ref(false)

const po = ref<PurchaseOrder>({
  po_number: '',
  supplier: '',
  supplier_id: undefined,
  supplier_has_xero_id: false,
  reference: '',
  order_date: '',
  expected_delivery: '',
  status: 'draft',
  lines: [],
})

const linesToDelete = ref<string[]>([])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const isPoDeleted = computed(() => po.value.status === 'deleted')
const isPoSubmitted = computed(() => po.value.status === 'submitted')

// More granular permissions
const canEditSupplier = computed(() => !isPoDeleted.value && !isPoSubmitted.value)
const canEditLineItems = computed(() => !isPoDeleted.value && !isPoSubmitted.value)
const canEditJobs = computed(() => !isPoDeleted.value) // Jobs can be edited even when submitted
const canEditStatus = computed(() => !isPoDeleted.value) // Status can be changed even when submitted
const canShowActions = computed(() => !isPoDeleted.value) // Actions available except when deleted

async function fetchJobs() {
  if (isLoadingJobs.value) return

  isLoadingJobs.value = true
  error.value = null

  try {
    debugLog('📊 Loading jobs for purchase order...')
    // Use the all-jobs endpoint which returns the expected format with jobs array
    const response = await api.purchasing_rest_all_jobs_retrieve()
    debugLog('📊 Zodios response:', response)

    if (!response.success) {
      throw new Error('Failed to fetch jobs from server')
    }

    jobs.value = response.jobs || []
    debugLog(`✅ Loaded ${jobs.value.length} jobs for purchase order`)

    if (jobs.value.length === 0) {
      toast.warning('No jobs available for purchase order creation')
    } else {
      debugLog('🔧 First job sample:', jobs.value[0])
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs'
    debugLog('❌ Error loading jobs for purchasing:', err)
    toast.error(
      `Failed to load jobs: ${errorMessage}. Job selection is required for purchase orders.`,
    )

    jobs.value = []
  } finally {
    isLoadingJobs.value = false
  }
}

async function load() {
  if (!orderId) {
    error.value = 'Purchase order ID is required'
    return
  }

  debugLog('🔄 Loading PO data...')
  isLoading.value = true
  isReloading.value = true
  error.value = null

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    debugLog('⏰ Cancelled pending autosave during reload')
  }

  try {
    const data = await api.retrievePurchaseOrder({ params: { id: orderId } })
    po.value = data
    originalLines.value = JSON.parse(JSON.stringify(po.value.lines))

    debugLog('✅ PO loaded successfully. Lines:', po.value.lines.length)

    if (po.value.status === 'deleted') {
      toast.warning('This purchase order has been deleted and cannot be edited', {
        duration: 5000,
        description: 'You can view the details but all editing functions are disabled.',
      })
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load purchase order'
    error.value = errorMessage
    debugLog('Error loading purchase order:', err)

    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      toast.error('Purchase order not found')
      setTimeout(() => {
        router.push('/purchasing/po')
      }, 2000)
    } else {
      toast.error(`Failed to load purchase order: ${errorMessage}`)
    }
  } finally {
    isLoading.value = false
    setTimeout(() => {
      isReloading.value = false
      debugLog('🔓 Reload complete, watchers re-enabled')
    }, 200)
  }
}

async function saveSummary() {
  if (isPoDeleted.value) {
    toast.error('Cannot save changes - this purchase order has been deleted')
    return
  }

  const updateData = {
    reference: po.value.reference,
    expected_delivery: po.value.expected_delivery,
    status: po.value.status,
  } as Record<string, unknown>

  if (canEditSupplier.value) {
    if (po.value.supplier) {
      updateData.supplier = po.value.supplier
    }
    if (po.value.supplier_id) {
      updateData.supplier_id = po.value.supplier_id
    }
  }

  await store.patch(orderId, updateData)
  toast.success('Summary saved')
  await load()
}

const handleAddLineEvent = () => {
  debugLog('🎯 handleAddLineEvent triggered from PoLinesTable')
  debugLog('🔑 canEditLineItems:', canEditLineItems.value)

  if (!canEditLineItems.value) {
    debugLog('❌ Cannot edit line items - permission denied')
    return
  }

  addLine()
}

function addLine() {
  debugLog('🏗️ addLine function called')
  debugLog('📊 Current PO lines:', po.value.lines.length)
  debugLog('🔒 Is PO deleted:', isPoDeleted.value)
  debugLog('📤 Is PO submitted:', isPoSubmitted.value)

  if (isPoDeleted.value) {
    debugLog('❌ Blocked: PO is deleted')
    toast.error('Cannot add lines - this purchase order has been deleted')
    return
  }
  if (isPoSubmitted.value) {
    debugLog('❌ Blocked: PO is submitted')
    toast.error('Cannot add lines - this purchase order has been submitted to supplier')
    return
  }

  const newLine = {
    item_code: '',
    description: '',
    quantity: 1,
    unit_cost: 0,
    price_tbc: false,
    job_id: '',
    metal_type: undefined,
    alloy: undefined,
    specifics: undefined,
    location: undefined,
    dimensions: undefined,
  }

  debugLog('➕ Adding new line:', newLine)

  try {
    po.value.lines = [...po.value.lines, newLine]
    debugLog('✅ Line added successfully. New count:', po.value.lines.length)
  } catch (error) {
    debugLog('❌ Error adding line:', error)
    toast.error('Failed to add line: ' + error)
  }
}

function deleteLine(idOrIdx: string | number) {
  if (isPoDeleted.value) {
    toast.error('Cannot delete lines - this purchase order has been deleted')
    return
  }
  if (isPoSubmitted.value) {
    toast.error('Cannot delete lines - this purchase order has been submitted to supplier')
    return
  }

  debugLog('🗑️ Deleting line:', idOrIdx)

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    debugLog('⏰ Cancelled pending autosave timer')
  }

  isDeletingLine.value = true

  try {
    if (typeof idOrIdx === 'string') {
      const lineToDelete = po.value.lines.find((l: PurchaseOrderLine) => l.id === idOrIdx)

      if (lineToDelete && hasAnyContent(lineToDelete)) {
        linesToDelete.value.push(idOrIdx)
        debugLog('📝 Added line to delete list:', idOrIdx)
      }

      po.value.lines = po.value.lines.filter((l: PurchaseOrderLine) => l.id !== idOrIdx)
    } else {
      po.value.lines = po.value.lines.filter((_: PurchaseOrderLine, idx: number) => idx !== idOrIdx)
    }

    debugLog('✅ Line deleted. Remaining lines:', po.value.lines.length)
  } finally {
    setTimeout(() => {
      isDeletingLine.value = false
      debugLog('🔓 Deletion flag cleared, autosave re-enabled')

      // Trigger autosave after deletion if there are lines to delete
      if (linesToDelete.value.length > 0) {
        debugLog('🗑️ Triggering save for deleted lines')
        saveLines()
      }
    }, 500)
  }
}

function hasAnyContent(line: PurchaseOrderLine) {
  return (
    (line.item_code && line.item_code.trim() !== '') ||
    (line.description && line.description.trim() !== '') ||
    (line.unit_cost != null && Number(line.unit_cost) > 0) ||
    line.price_tbc === true ||
    line.quantity > 0 ||
    (line.job_id && line.job_id.trim() !== '')
  )
}

function lineChanged(line: PurchaseOrderLine) {
  if (!line.id) return true

  const orig = originalLines.value.find((o) => o.id === line.id)
  if (!orig) return true

  // If PO is submitted, only job changes are allowed
  if (isPoSubmitted.value) {
    return orig.job_id !== line.job_id
  }

  // For draft/other statuses, check all fields
  return (
    orig.item_code !== line.item_code ||
    orig.description !== line.description ||
    +orig.quantity !== +line.quantity ||
    +(orig.unit_cost ?? 0) !== +(line.unit_cost ?? 0) ||
    orig.price_tbc !== line.price_tbc ||
    orig.job_id !== line.job_id ||
    orig.metal_type !== line.metal_type ||
    orig.alloy !== line.alloy ||
    orig.specifics !== line.specifics ||
    orig.location !== line.location ||
    orig.dimensions !== line.dimensions
  )
}

function isValidLine(line: PurchaseOrderLine) {
  const hasContent =
    (line.item_code && line.item_code.trim() !== '') ||
    (line.description && line.description.trim() !== '')

  if (!hasContent) {
    return false
  }

  const hasPrice = (line.unit_cost != null && Number(line.unit_cost) > 0) || line.price_tbc === true

  return hasPrice
}

async function saveLines() {
  if (isPoDeleted.value) {
    debugLog('❌ Cannot save - PO is deleted')
    toast.error('Cannot save changes - this purchase order has been deleted')
    return
  }

  if (isReloading.value || isDeletingLine.value) {
    debugLog('⏸️ Skipping save - reloading:', isReloading.value, 'deleting:', isDeletingLine.value)
    return
  }

  linesToDelete.value = linesToDelete.value.filter((id) => {
    const l = po.value.lines.find((x: PurchaseOrderLine) => x.id === id)
    return l ? isValidLine(l) : true
  })

  // For submitted POs, we allow all existing lines with IDs (since they're already valid)
  // For draft POs, we validate using isValidLine
  const validLines = isPoSubmitted.value
    ? po.value.lines.filter((line) => line.id) // Submitted: only existing lines with IDs
    : po.value.lines.filter(isValidLine) // Draft: full validation

  // Skip incomplete line validation for submitted POs (only job changes allowed)
  if (!isPoSubmitted.value) {
    const incompleteLines = po.value.lines.filter((line) => {
      const hasContent =
        (line.item_code && line.item_code.trim() !== '') ||
        (line.description && line.description.trim() !== '')
      return hasContent && !isValidLine(line)
    })

    if (incompleteLines.length > 0) {
      const missingPrices = incompleteLines.filter(
        (line) => (!line.unit_cost || Number(line.unit_cost) <= 0) && !line.price_tbc,
      )

      if (missingPrices.length > 0) {
        toast.error(
          `${missingPrices.length} line(s) missing price information. Please set unit cost or mark as TBC.`,
        )
        return
      }
    }
  }

  if (!validLines.length && !linesToDelete.value.length) {
    debugLog('⏸️ No valid lines or deletes to save')
    return
  }

  const changedLines = validLines.filter(lineChanged)

  if (!changedLines.length && !linesToDelete.value.length) {
    debugLog('⏸️ No changes detected - skipping save')
    return
  }

  debugLog('💾 Saving lines...', {
    isSubmitted: isPoSubmitted.value,
    validLines: validLines.length,
    changedLines: changedLines.length,
    toDelete: linesToDelete.value.length,
    changedLinesDetails: changedLines.map((l) => ({ id: l.id, job_id: l.job_id })),
  })

  // Transform lines to match API schema requirements
  const transformedLines = changedLines.map((line) => {
    // If PO is submitted, only send job_id and id (minimal update)
    if (isPoSubmitted.value) {
      const transformed = {
        id: line.id, // Explicitly preserve the ID
        job_id: line.job_id && line.job_id.trim() !== '' ? line.job_id : null,
      }

      debugLog('🔧 Transformed line (submitted PO - job only):', {
        hasId: !!transformed.id,
        id: transformed.id,
        job_id: transformed.job_id,
      })

      return transformed
    }

    // For draft/other statuses, send all fields
    const transformed = {
      id: line.id, // Explicitly preserve the ID
      job_id: line.job_id && line.job_id.trim() !== '' ? line.job_id : null,
      description: line.description,
      quantity:
        typeof line.quantity === 'number'
          ? line.quantity.toFixed(2)
          : String(line.quantity || '0.00'),
      unit_cost:
        line.unit_cost != null
          ? typeof line.unit_cost === 'number'
            ? line.unit_cost.toFixed(2)
            : String(line.unit_cost)
          : null,
      price_tbc: line.price_tbc,
      item_code: line.item_code || '',
      metal_type: line.metal_type || '',
      alloy: line.alloy || '',
      specifics: line.specifics || '',
      location: line.location || '',
      dimensions: line.dimensions || '',
    }

    debugLog('🔧 Transformed line (full):', {
      hasId: !!transformed.id,
      id: transformed.id,
      description: transformed.description?.substring(0, 20),
      dimensions: transformed.dimensions,
      hasAllFields: {
        dimensions: 'dimensions' in transformed,
        alloy: 'alloy' in transformed,
        specifics: 'specifics' in transformed,
        location: 'location' in transformed,
      },
    })

    return transformed
  })

  try {
    const linesToDeleteBackup = [...linesToDelete.value]

    await store.patch(orderId, {
      lines: transformedLines,
      lines_to_delete: linesToDelete.value.length ? linesToDelete.value : undefined,
    })

    linesToDelete.value = []

    const needsReload = changedLines.some((line) => !line.id) || linesToDeleteBackup.length > 0

    if (needsReload) {
      debugLog('🔄 Reloading PO after save to ensure consistency...')
      await load()
    } else {
      originalLines.value = JSON.parse(JSON.stringify(po.value.lines))
      debugLog('✅ Updated original lines without reload')
    }

    toast.success('Lines saved')
  } catch (error) {
    debugLog('❌ Error saving lines:', error)
    toast.error('Failed to save lines: ' + extractErrorMessage(error, 'Unknown error'))
  }
}

async function syncWithXero() {
  if (isSyncing.value) return

  if (isPoDeleted.value) {
    toast.error('Cannot sync with Xero - this purchase order has been deleted')
    return
  }

  isSyncing.value = true
  toast.info('Syncing with Xero…', { id: 'po-sync-loading' })

  try {
    // TODO: Replace with Zodios endpoint when available in schema
    // This endpoint is not yet in the generated schema
    const { data } = await axios.post<XeroSyncResponse>(
      `/api/xero/create_purchase_order/${orderId}`,
    )

    switch (true) {
      case data.success:
        if (data.online_url) po.value.online_url = data.online_url
        if (data.xero_id) po.value.xero_id = data.xero_id
        toast.dismiss('po-sync-loading')
        toast.success('Synced with Xero successfully!')
        break
      case 'is_incomplete_po' in data &&
        (data as XeroSyncResponse & { is_incomplete_po?: boolean }).is_incomplete_po:
        toast.dismiss('po-sync-loading')
        toast.warning(data.error || 'Purchase order incomplete - missing required fields')
        break
      default:
        toast.dismiss('po-sync-loading')
        throw new Error(data.error || 'Unknown sync error')
    }
  } catch (err: unknown) {
    toast.dismiss('po-sync-loading')
    const errorMessage = extractErrorMessage(err, 'Sync failed')
    toast.error(`Xero sync failed: ${errorMessage}`, createErrorToast())
  } finally {
    isSyncing.value = false
  }
}

function viewInXero() {
  if (!po.value.online_url) {
    toast.error('No Xero URL available. Please sync with Xero first.')
    return
  }

  try {
    window.open(po.value.online_url, '_blank', 'noopener,noreferrer')
    toast.success('Opened Purchase Order in Xero')
  } catch (error) {
    debugLog('Failed to open Xero URL:', error)
    toast.error('Failed to open Xero. Please check if pop-ups are blocked.')
  }
}

function printPo() {
  showPdfDialog.value = true
}

function emailPo() {
  if (isPoDeleted.value) {
    toast.error('Cannot email - this purchase order has been deleted')
    return
  }
  emailPurchaseOrder()
}

async function emailPurchaseOrder() {
  if (isPoDeleted.value) {
    toast.error('Cannot email - this purchase order has been deleted')
    return
  }
  try {
    toast.info('Preparing email...', { id: 'po-email-loading' })

    const emailData = await store.emailPurchaseOrder(orderId)

    if (emailData.success && emailData.mailto_url) {
      // Open Gmail compose in new tab
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailData.email)}&su=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`
      window.open(gmailUrl, '_blank', 'noopener,noreferrer')

      toast.dismiss('po-email-loading')
      toast.success(`Gmail opened for ${emailData.email}`)
    } else {
      toast.dismiss('po-email-loading')
      throw new Error(emailData.error || 'Failed to prepare email')
    }
  } catch (error) {
    toast.dismiss('po-email-loading')
    const errorMessage = extractErrorMessage(error, 'Failed to prepare email')
    toast.error(`Email failed: ${errorMessage}`, createErrorToast())
    debugLog('Error preparing email:', error)
  }
}

async function close() {
  if (isPoDeleted.value) {
    debugLog('🚪 Closing without save - PO is deleted')
    router.push('/purchasing/po')
    return
  }

  let hasAuthError = false

  try {
    debugLog('🚪 Closing PO form - triggering autosave...')

    // Clear any pending debounce timers to force immediate save
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
      debugLog('⏰ Cleared pending autosave timer for immediate save')
    }

    // Always try to save lines (function will check for actual changes internally)
    debugLog('💾 Saving line changes before close...')
    await saveLines()

    // Always try to save summary to ensure consistency
    debugLog('💾 Saving summary changes before close...')
    await saveSummary()

    debugLog('✅ Autosave completed, navigating to PO list')
    toast.success('Changes saved automatically')
  } catch (error) {
    debugLog('❌ Error during autosave on close:', error)

    // Check if it's an authentication error
    const isAuthError =
      error?.response?.status === 401 ||
      (typeof error === 'object' && error?.message?.includes('auth')) ||
      (typeof error === 'string' && error.includes('auth'))

    if (isAuthError) {
      debugLog('🔒 Authentication error detected during save')
      toast.error('Session expired. Please login again.')
      hasAuthError = true
      return
    }

    toast.error('Failed to save changes: ' + extractErrorMessage(error, 'Unknown error'))
    // Still navigate to PO list even if save fails (non-auth errors)
  } finally {
    // Always navigate back to PO list unless there was an auth error
    if (!hasAuthError) {
      debugLog('🚪 Navigating to purchase orders list')
      router.push('/purchasing/po')
    }
  }
}

const canSync = computed(() => {
  if (!po.value.supplier_has_xero_id) return false

  return po.value.lines.some(
    (l: PurchaseOrderLine) => l.description && l.unit_cost !== null && l.unit_cost !== undefined,
  )
})

const isReloading = ref(false)
const isDeletingLine = ref(false)
const isEditingAdditionalFields = ref(false)

onMounted(async () => {
  try {
    await Promise.all([xeroItemStore.fetchItems(), fetchJobs(), load()])
  } catch (err) {
    debugLog('Error during component initialization:', err)
  }

  watch(
    () => po.value.lines,
    (newLines, oldLines) => {
      if (isReloading.value || isDeletingLine.value || isEditingAdditionalFields.value) {
        debugLog(
          '⏸️ Skipping autosave - reloading:',
          isReloading.value,
          'deleting:',
          isDeletingLine.value,
          'editing additional fields:',
          isEditingAdditionalFields.value,
        )
        return
      }

      if (!newLines || newLines.length === 0) {
        debugLog('⏸️ Skipping autosave - no lines to save')
        return
      }

      if (po.value.status !== 'draft' && oldLines) {
        const jobChanges = newLines.some((newLine, index) => {
          const oldLine = oldLines[index]
          return oldLine && newLine.job_id !== oldLine.job_id
        })

        if (jobChanges) {
          toast.warning(
            'Warning: Changing job assignments on a non-draft purchase order may affect cost tracking',
          )
        }
      }

      debugLog('⏱️ Lines changed, scheduling autosave in 500ms')
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debugLog('⏰ Cleared previous timer')
      }
      debounceTimer = setTimeout(() => {
        debugLog('💾 Executing scheduled autosave')
        saveLines()
      }, 500)
    },
    { deep: true, flush: 'post' },
  )

  watch(
    () => [po.value.supplier, po.value.supplier_id],
    (newVals, oldVals) => {
      if (newVals[0] && (newVals[0] !== oldVals?.[0] || newVals[1] !== oldVals?.[1])) {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          try {
            await store.patch(orderId, {
              supplier: po.value.supplier,
              supplier_id: po.value.supplier_id,
            })
            toast.success('Supplier updated')
            await load()
          } catch (error) {
            const errorMessage = extractErrorMessage(error, 'Failed to update supplier')
            toast.error(`Update failed: ${errorMessage}`)
          }
        }, 1000)
      }
    },
    { deep: true },
  )
})
</script>
