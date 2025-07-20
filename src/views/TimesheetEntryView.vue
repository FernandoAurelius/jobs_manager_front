<template>
  <AppLayout>
    <div class="bg-gray-50 min-h-screen flex flex-col">
      <div
        v-if="loading"
        class="sticky top-0 z-20 py-5 bg-white border-b border-gray-200 flex items-center justify-center min-h-[120px]"
      >
        <div class="flex flex-col items-center w-full">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-2"></div>
          <span class="text-gray-600 text-sm">Loading timesheet data...</span>
        </div>
      </div>
      <div v-else class="flex-1 flex flex-col">
        <div class="block lg:hidden pt-4">
          <div class="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
            <div class="flex items-center space-x-2">
              <Avatar class="h-8 w-8 ring-2 ring-gray-300">
                <AvatarFallback class="bg-gray-600 text-white font-bold text-xs">
                  {{ getStaffInitials(currentStaff) }}
                </AvatarFallback>
              </Avatar>

              <div class="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="navigateStaff(-1)"
                  :disabled="!canNavigateStaff(-1)"
                  class="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100"
                >
                  <ChevronLeft class="h-3 w-3" />
                </Button>

                <Select
                  v-model="selectedStaffId"
                  @update:model-value="(value) => handleStaffChange(value as string)"
                >
                  <SelectTrigger class="h-7 w-32 text-xs bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Staff..." />
                  </SelectTrigger>
                  <SelectContent class="bg-white border-gray-200">
                    <SelectItem
                      v-for="staff in timesheetStore.staff"
                      :key="staff.id"
                      :value="staff.id"
                      class="text-gray-900 hover:bg-gray-100 text-xs"
                    >
                      {{ staff.firstName }} {{ staff.lastName }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  @click="navigateStaff(1)"
                  :disabled="!canNavigateStaff(1)"
                  class="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100"
                >
                  <ChevronRight class="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div class="text-xs text-gray-700">
              <span class="font-semibold">{{ todayStats.totalHours.toFixed(1) }}h</span>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-white">
            <div class="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                @click="navigateDate(-1)"
                class="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100"
              >
                <ChevronLeft class="h-3 w-3" />
              </Button>

              <div
                class="text-gray-900 font-medium text-xs px-2 py-1 bg-gray-100 rounded border border-gray-300"
              >
                {{ formatShortDate(currentDate) }}
              </div>

              <Button
                variant="ghost"
                size="sm"
                @click="navigateDate(1)"
                class="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100"
              >
                <ChevronRight class="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                @click="goToToday"
                class="h-7 text-xs px-2 text-gray-600 hover:bg-gray-100"
              >
                Today
              </Button>

              <Button
                variant="ghost"
                size="sm"
                @click="goToDailyOverview"
                class="h-7 text-xs px-2 text-gray-600 hover:bg-gray-100"
              >
                Daily Overview
              </Button>
            </div>

            <div class="flex items-center space-x-1">
              <Button
                @click="addNewEntry"
                size="sm"
                variant="default"
                class="h-7 text-xs px-2 bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
              >
                <Plus class="h-3 w-3" />
              </Button>

              <Button
                @click="saveChanges"
                size="sm"
                variant="default"
                :disabled="!hasUnsavedChanges || loading"
                class="h-7 text-xs px-2 bg-green-600 hover:bg-green-700 text-white border-green-500"
              >
                <Save class="h-3 w-3" />
              </Button>

              <Button
                @click="refreshData"
                variant="ghost"
                size="sm"
                :disabled="loading"
                class="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100"
              >
                <RefreshCw :class="['h-3 w-3', { 'animate-spin': loading }]" />
              </Button>

              <Button
                @click="showHelpModal = true"
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0 text-gray-600 hover:bg-gray-100"
              >
                <HelpCircle class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div class="hidden lg:flex items-center h-16 px-6 pt-4 bg-white border-b border-gray-200">
          <div class="flex items-center space-x-4">
            <Avatar class="h-10 w-10 ring-2 ring-gray-300">
              <AvatarFallback class="bg-gray-600 text-white font-bold">
                {{ getStaffInitials(currentStaff) }}
              </AvatarFallback>
            </Avatar>

            <div class="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                @click="navigateStaff(-1)"
                :disabled="!canNavigateStaff(-1)"
                class="text-gray-600 hover:bg-gray-100"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>

              <Select
                v-model="selectedStaffId"
                @update:model-value="(value) => handleStaffChange(value as string)"
              >
                <SelectTrigger class="w-48 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent class="bg-white border-gray-200">
                  <SelectItem
                    v-for="staff in timesheetStore.staff"
                    :key="staff.id"
                    :value="staff.id"
                    class="text-gray-900 hover:bg-gray-100"
                  >
                    {{ staff.firstName }} {{ staff.lastName }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                @click="navigateStaff(1)"
                :disabled="!canNavigateStaff(1)"
                class="text-gray-600 hover:bg-gray-100"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="flex items-center space-x-2 mx-6">
            <Button
              variant="ghost"
              size="sm"
              @click="navigateDate(-1)"
              class="text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft class="h-4 w-4" />
            </Button>

            <div
              class="text-gray-900 font-semibold px-4 py-2 bg-gray-100 rounded-md border border-gray-300"
            >
              {{ formatDisplayDate(currentDate) }}
            </div>

            <Button
              variant="ghost"
              size="sm"
              @click="navigateDate(1)"
              class="text-gray-600 hover:bg-gray-100"
            >
              <ChevronRight class="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              @click="goToToday"
              class="text-gray-600 hover:bg-gray-100 ml-2"
            >
              Today
            </Button>

            <Button
              variant="ghost"
              size="sm"
              @click="goToDailyOverview"
              class="text-gray-600 hover:bg-gray-100 ml-2"
            >
              Daily Overview
            </Button>
          </div>

          <div class="flex items-center space-x-2 ml-auto">
            <div class="text-xs text-gray-700 mr-4">
              <span class="font-semibold">{{ todayStats.totalHours.toFixed(1) }}h</span> Total
            </div>

            <Button
              @click="addNewEntry"
              size="sm"
              variant="default"
              class="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
            >
              <Plus class="h-4 w-4 mr-1" />
              Add Entry
            </Button>

            <Button
              @click="saveChanges"
              size="sm"
              variant="default"
              :disabled="!hasUnsavedChanges || loading"
              class="bg-green-600 hover:bg-green-700 text-white border-green-500"
            >
              <Save class="h-4 w-4 mr-1" />
              {{ loading ? 'Saving...' : 'Save All' }}
            </Button>

            <Button
              @click="refreshData"
              variant="ghost"
              size="sm"
              :disabled="loading"
              class="text-gray-600 hover:bg-gray-100"
            >
              <RefreshCw :class="['h-4 w-4', { 'animate-spin': loading }]" />
            </Button>

            <Button
              @click="showHelpModal = true"
              variant="ghost"
              size="sm"
              class="text-gray-600 hover:bg-gray-100"
            >
              <HelpCircle class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          class="flex-1 flex flex-col overflow-hidden"
          :class="'h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)]'"
        >
          <div v-if="loading" class="flex-1 flex items-center justify-center bg-gray-50">
            <div class="text-center">
              <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"
              ></div>
              <p class="text-gray-600 text-sm lg:text-base">Loading timesheet...</p>
            </div>
          </div>

          <div v-else-if="error" class="flex-1 flex items-center justify-center">
            <div class="text-center px-4">
              <AlertTriangle class="h-8 w-8 lg:h-12 lg:w-12 text-red-500 mx-auto mb-4" />
              <h3 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                Error Loading Timesheet
              </h3>
              <p class="text-sm lg:text-base text-gray-600 mb-4">{{ error }}</p>
              <Button @click="reloadData" variant="outline" size="sm">
                <RefreshCw class="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>

          <div
            v-else
            class="flex-1 bg-white shadow-sm border border-gray-200 rounded-lg m-2 lg:m-4 overflow-hidden"
          >
            <div class="h-full">
              <AgGridVue
                ref="agGridRef"
                class="h-full ag-theme-custom ag-theme-responsive"
                :columnDefs="columnDefs"
                :rowData="gridData"
                :gridOptions="gridOptions"
                @grid-ready="onGridReady"
                @cell-value-changed="onCellValueChanged"
                @first-data-rendered="onFirstDataRendered"
              />
            </div>
          </div>

          <div class="bg-white border-t border-gray-200 p-2 lg:hidden">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-1">
                  <Clock class="h-3 w-3 text-gray-500" />
                  <span class="font-medium text-gray-700">
                    {{ todayStats.totalHours.toFixed(1) }}h
                  </span>
                </div>

                <div class="flex items-center space-x-1">
                  <DollarSign class="h-3 w-3 text-green-600" />
                  <span class="font-medium text-gray-700">
                    ${{ todayStats.totalBill.toFixed(0) }}
                  </span>
                </div>

                <div class="flex items-center space-x-1">
                  <TrendingUp class="h-3 w-3 text-gray-600" />
                  <span class="font-medium text-gray-700">
                    {{ todayStats.entryCount }}
                  </span>
                </div>
              </div>

              <div v-if="hasUnsavedChanges" class="flex items-center space-x-1 text-amber-600">
                <AlertCircle class="h-3 w-3" />
                <span class="font-medium">Unsaved</span>
              </div>
            </div>
          </div>

          <div
            class="hidden lg:flex h-16 bg-white border-t border-gray-200 items-center justify-between px-6"
          >
            <div class="flex items-center space-x-6">
              <div class="flex items-center space-x-2">
                <Clock class="h-4 w-4 text-gray-500" />
                <span class="text-sm font-medium text-gray-700">
                  Total: {{ todayStats.totalHours.toFixed(1) }}h
                </span>
              </div>

              <div class="flex items-center space-x-2">
                <DollarSign class="h-4 w-4 text-green-600" />
                <span class="text-sm font-medium text-gray-700">
                  Bill: ${{ todayStats.totalBill.toFixed(2) }}
                </span>
              </div>

              <div class="flex items-center space-x-2">
                <TrendingUp class="h-4 w-4 text-gray-600" />
                <span class="text-sm font-medium text-gray-700">
                  Entries: {{ todayStats.entryCount }}
                </span>
              </div>
            </div>
            <div v-if="hasUnsavedChanges" class="flex items-center space-x-2 text-amber-600">
              <AlertCircle class="h-4 w-4" />
              <span class="text-sm font-medium">Unsaved changes</span>
            </div>
          </div>
        </div>

        <Dialog v-model:open="showHelpModal">
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-slate-600">Add new entry</span>
                <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+N</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-slate-600">Save changes</span>
                <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+S</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-slate-600">Delete entry</span>
                <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Delete</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-slate-600">Navigate entries</span>
                <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Tab / Enter</kbd>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </AppLayout>
</template>

<script lang="ts" setup>
import { debugLog } from '@/utils/debug'

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import type { GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community'
import { v4 as uuidv4 } from 'uuid'

import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-vue-next'

import { useTimesheetEntryGrid } from '@/composables/useTimesheetEntryGrid'
import { useTimesheetStore } from '@/stores/timesheet'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import * as costlineService from '@/services/costline.service'

// Import types from generated API schemas
import type { Job, Staff, TimesheetCostLine, CostLine } from '@/api/generated/api'
// Import UI-specific types from local schemas
import type { TimesheetEntryWithMeta } from '@/api/local/schemas'

const router = useRouter()
const route = useRoute()
const timesheetStore = useTimesheetStore()
const companyDefaultsStore = useCompanyDefaultsStore()

const loading = ref(false)
const error = ref<string | null>(null)
const showHelpModal = ref(false)
const agGridRef = ref()

const todayDate = new Date().toISOString().split('T')[0]
debugLog('🗓️ Today is:', todayDate, 'Day of week:', new Date().getDay())

const initialDate = (route.query.date as string) || todayDate
const initialStaffId = (route.query.staffId as string) || ''

debugLog('🔗 URL params:', { date: route.query.date, staffId: route.query.staffId })
debugLog('📊 Using initial values:', { date: initialDate, staffId: initialStaffId })

const currentDate = ref<string>(initialDate)
const selectedStaffId = ref<string>(initialStaffId)
const isInitializing = ref(true)

const timeEntries = ref<TimesheetEntryWithMeta[]>([])

const currentStaff = computed(
  () => timesheetStore.staff.find((s) => s.id === selectedStaffId.value) || null,
)

const hasUnsavedChanges = ref(false)

const todayStats = computed(() => {
  const totalHours = timeEntries.value.reduce(
    (sum: number, entry: CostLine) => sum + entry.hours,
    0,
  )
  const totalBill = timeEntries.value.reduce((sum: number, entry: CostLine) => sum + entry.bill, 0)
  const entryCount = timeEntries.value.length

  return {
    totalHours,
    totalBill,
    entryCount,
  }
})

const {
  gridData,
  columnDefs,
  gridOptions,
  setGridApi,
  loadData,
  addNewRow,
  getGridData,
  handleKeyboardShortcut,
  handleCellValueChanged: gridHandleCellValueChanged,
} = useTimesheetEntryGrid(
  companyDefaultsStore.companyDefaults,
  timesheetStore.jobs, // Pass jobs from timesheet store
  handleSaveEntry,
  handleDeleteEntry,
)

const canNavigateStaff = (direction: number): boolean => {
  if (!timesheetStore.staff.length) return false
  const currentIndex = timesheetStore.staff.findIndex((s) => s.id === selectedStaffId.value)
  if (currentIndex === -1) return false

  const newIndex = currentIndex + direction
  return newIndex >= 0 && newIndex < timesheetStore.staff.length
}

const navigateStaff = (direction: number) => {
  if (!canNavigateStaff(direction)) return

  const currentIndex = timesheetStore.staff.findIndex((s) => s.id === selectedStaffId.value)
  const newIndex = currentIndex + direction
  const newStaff = timesheetStore.staff[newIndex]

  if (newStaff) {
    selectedStaffId.value = newStaff.id
    updateRoute()
  }
}

const navigateDate = (direction: number) => {
  const parts = currentDate.value.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])

  const date = new Date(year, month, day)

  do {
    date.setDate(date.getDate() + direction)
  } while (date.getDay() === 0 || date.getDay() === 6)

  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
  const newDay = date.getDate().toString().padStart(2, '0')

  currentDate.value = `${newYear}-${newMonth}-${newDay}`
  debugLog('📅 Navigated to:', currentDate.value, 'Day of week:', date.getDay())
  updateRoute()
}

const goToToday = () => {
  const today = new Date()

  if (today.getDay() === 0) {
    today.setDate(today.getDate() + 1)
  } else if (today.getDay() === 6) {
    today.setDate(today.getDate() + 2)
  }

  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')

  currentDate.value = `${year}-${month}-${day}`
  debugLog('📅 Going to today (or next workday):', currentDate.value)
  updateRoute()
}

const goToDailyOverview = () => {
  router.push({
    name: 'timesheet-daily',
    query: {
      date: currentDate.value,
    },
  })
}

const updateRoute = () => {
  router.push({
    query: {
      date: currentDate.value,
      staffId: selectedStaffId.value,
    },
  })
}

const getStaffInitials = (staff: Staff | null): string => {
  if (!staff) return 'U'
  const first = staff.firstName?.[0] || ''
  const last = staff.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'U'
}

const formatDisplayDate = (date: string): string => {
  const parts = date.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])

  const d = new Date(year, month, day)

  const formatted = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return formatted
}

const formatShortDate = (date: string): string => {
  const parts = date.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const day = parseInt(parts[2])

  const d = new Date(year, month, day)

  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return formatted
}

function syncGridState() {
  debugLog('🔄 Starting syncGridState...')

  const gridData = getGridData()

  debugLog('📋 Got grid data from composable:', gridData.length, 'entries')
  debugLog(
    '🔍 Raw grid data:',
    gridData.map((d) => ({
      jobId: d.jobId,
      jobNumber: d.jobNumber,
      client: d.client,
      jobName: d.jobName,
      hours: d.hours,
      isEmptyRow: d.isEmptyRow,
      isNewRow: d.isNewRow,
    })),
  )

  const filteredData = gridData.filter((d) => {
    const hasJob = d && !d.isEmptyRow && (d.jobId || d.jobNumber)
    debugLog('🔍 Filtering entry:', {
      jobId: d?.jobId,
      jobNumber: d?.jobNumber,
      isEmptyRow: d?.isEmptyRow,
      hasJob,
    })
    return hasJob
  })

  // Preserve modification flags when syncing
  const syncedEntries = filteredData.map((gridEntry) => {
    const existingEntry = timeEntries.value.find(
      (e: CostLine) =>
        e.id === gridEntry.id ||
        (e.jobId === gridEntry.jobId && e.description === gridEntry.description),
    )

    return {
      ...gridEntry,
      isModified: existingEntry?.isModified || gridEntry.isModified || false,
      isNewRow: existingEntry?.isNewRow || gridEntry.isNewRow || false,
    } as CostLine
  })

  timeEntries.value = syncedEntries

  debugLog('✅ Synced grid state with timeEntries:', timeEntries.value.length, 'entries')
  debugLog(
    '📊 Synced entries detail:',
    timeEntries.value.map((e: CostLine) => ({
      id: e.id,
      jobId: e.jobId,
      jobNumber: e.jobNumber,
      client: e.client,
      jobName: e.jobName,
      hours: e.hours,
    })),
  )
}

async function handleSaveEntry(entry: TimesheetEntryWithMeta): Promise<void> {
  const hasJob = entry.jobId || entry.jobNumber
  const hasDescription = entry.description && entry.description.trim().length > 0
  const hasHours = entry.hours > 0

  debugLog('🔍 VALIDATION CHECK:', {
    entryId: entry.id,
    jobId: entry.jobId,
    jobNumber: entry.jobNumber,
    hasJob,
    description: entry.description,
    hasDescription,
    hours: entry.hours,
    hasHours,
    validationPassed: hasJob && hasDescription && hasHours,
  })

  if (!hasJob || !hasDescription || !hasHours) {
    debugLog('❌ VALIDATION FAILED - Entry not saved:', {
      hasJob,
      hasDescription,
      hasHours,
      entry: {
        id: entry.id,
        jobId: entry.jobId,
        jobNumber: entry.jobNumber,
        description: entry.description,
        hours: entry.hours,
      },
    })
    return
  }

  if (entry._isSaving) return

  try {
    loading.value = true
    entry._isSaving = true

    if (!entry.id && !entry.tempId) {
      entry.tempId = uuidv4()
    }

    const staffId = selectedStaffId.value
    const date = currentDate.value

    let targetJobId = entry.jobId
    if (!targetJobId && entry.jobNumber) {
      const jobNumber = parseInt(entry.jobNumber, 10)
      const jobByNumber = timesheetStore.jobs.find((j: Job) => j.job_number === jobNumber)
      if (jobByNumber) {
        targetJobId = jobByNumber.id
        entry.jobId = targetJobId
        entry.client = jobByNumber.client_name || ''
        entry.jobName = jobByNumber.name || ''
        entry.chargeOutRate = parseFloat(jobByNumber.charge_out_rate) || 0
      }
    }

    const costLinePayload = {
      kind: 'time' as const,
      desc: entry.description,
      quantity: entry.hours.toString(),
      unit_cost: entry.wageRate.toString(),
      unit_rev: entry.chargeOutRate.toString(),
      meta: {
        staff_id: staffId,
        date: date,
        is_billable: entry.billable,
        rate_multiplier: entry.rateMultiplier,
        created_from_timesheet: true,
      },
    }

    let savedLine
    if (entry.id && typeof entry.id === 'number') {
      savedLine = await costlineService.updateCostLine(entry.id, costLinePayload)
    } else {
      const job = timesheetStore.jobs.find((j: Job) => j.id === targetJobId)
      if (!job) throw new Error('Job not found')
      savedLine = await costlineService.createCostLine(job.id, 'actual', costLinePayload)
      entry.id = savedLine.id
      delete entry.tempId
    }

    const entryIndex = timeEntries.value.findIndex((e: TimesheetEntryWithMeta) => {
      if (entry.id && e.id === entry.id) return true
      if (entry.tempId && e.tempId === entry.tempId) return true
      return false
    })
    if (entryIndex >= 0) {
      timeEntries.value[entryIndex] = { ...entry, ...savedLine, isNewRow: false, isModified: false }
    } else {
      timeEntries.value.push({ ...entry, ...savedLine, isNewRow: false, isModified: false })
    }
  } catch (err) {
    debugLog('❌ Error saving entry:', err)
    error.value = 'Failed to save entry'
  } finally {
    loading.value = false
    entry._isSaving = false
  }
}

async function handleDeleteEntry(id: number): Promise<void> {
  try {
    loading.value = true

    await costlineService.deleteCostLine(id)

    timeEntries.value = timeEntries.value.filter((e: CostLine) => e.id !== id)

    hasUnsavedChanges.value = false
    debugLog('✅ Entry deleted successfully:', id)
  } catch (err) {
    debugLog('❌ Error deleting entry:', err)
    error.value = 'Failed to delete entry'
  } finally {
    loading.value = false
  }
}

function handleCellValueChanged(event: CellValueChangedEvent) {
  debugLog('🔧 TimesheetEntryView handleCellValueChanged called:', {
    field: event.colDef.field,
    newValue: event.newValue,
    oldValue: event.oldValue,
  })

  gridHandleCellValueChanged(event)

  if (event.data && typeof event.data === 'object') {
    event.data.isModified = true
  }

  hasUnsavedChanges.value = true
}

function onGridReady(params: GridReadyEvent) {
  setGridApi(params.api)
}

function onCellValueChanged(event: CellValueChangedEvent) {
  handleCellValueChanged(event)
}

function onFirstDataRendered() {
  setTimeout(() => agGridRef.value?.api?.sizeColumnsToFit(), 100)
}

const addNewEntry = () => {
  debugLog('➕ Adding new entry for staff:', selectedStaffId.value)

  // Use the composable's addNewRow function which properly handles ag-Grid
  addNewRow(selectedStaffId.value, currentDate.value)

  hasUnsavedChanges.value = true

  debugLog('✅ Added new entry via composable')
}

const saveChanges = async () => {
  debugLog('💾 Starting saveChanges...')
  debugLog('🔍 agGridRef.value:', !!agGridRef.value)
  debugLog('🔍 agGridRef.value?.api:', !!agGridRef.value?.api)

  syncGridState()

  const changedEntries = timeEntries.value.filter(
    (entry: CostLine) => entry.isNewRow || entry.isModified,
  )

  debugLog('📊 Found', changedEntries.length, 'changed entries to save')
  debugLog(
    '🔍 Changed entries details:',
    changedEntries.map((e) => ({
      id: e.id,
      isNewRow: e.isNewRow,
      isModified: e.isModified,
      description: e.description,
      hours: e.hours,
    })),
  )

  if (changedEntries.length === 0) {
    debugLog('⚠️ No entries to save')
    return
  }

  const invalidEntries = changedEntries.filter((entry) => {
    const hasJob = entry.jobId || entry.jobNumber
    const hasDescription = entry.description && entry.description.trim().length > 0
    const hasHours = entry.hours > 0

    return !hasJob || !hasDescription || !hasHours
  })

  if (invalidEntries.length > 0) {
    debugLog('❌ Found invalid entries:', invalidEntries)
    const missingFields = invalidEntries
      .map((entry) => {
        const missing: string[] = []
        if (!entry.jobId && !entry.jobNumber) missing.push('Job')
        if (!entry.description || !entry.description.trim()) missing.push('Description')
        if (entry.hours <= 0) missing.push('Hours')
        return `Entry ${entry.id || 'new'}: Missing ${missing.join(', ')}`
      })
      .join('\n')

    error.value = `Cannot save entries with missing required fields:\n${missingFields}`
    return
  }

  for (const entry of changedEntries) {
    debugLog('🔄 Saving entry:', {
      id: entry.id,
      isNewRow: entry.isNewRow,
      isModified: entry.isModified,
      description: entry.description,
    })
    debugLog('Call-stack: ', new Error().stack)
    debugLog('Timestamp:', new Date().toISOString())
    await handleSaveEntry(entry)

    entry.isModified = false
  }

  hasUnsavedChanges.value = false
}

const reloadData = () => {
  error.value = null
  loadTimesheetData()
}

const refreshData = () => {
  reloadData()
}

const handleStaffChange = async (staffId: string | null) => {
  if (!staffId) {
    debugLog('⏭️ Skipping staff change - no staffId provided')
    return
  }

  if (staffId === selectedStaffId.value) {
    debugLog('⏭️ Skipping staff change - same staff selected')
    return
  }

  debugLog('👤 Staff changed:', { from: selectedStaffId.value, to: staffId })

  selectedStaffId.value = staffId
  updateRoute()

  await loadTimesheetData()
}

const loadTimesheetData = async () => {
  debugLog('function loadTimesheetData called with:', {
    staffId: selectedStaffId.value,
    date: currentDate.value,
    isInitializing: isInitializing.value,
  })

  debugLog('Call-stack: ', new Error().stack)
  debugLog('Timestamp:', new Date().toISOString())

  if (!selectedStaffId.value) {
    debugLog('⏭️ Skipping data load - no staff selected')
    return
  }

  if (!currentDate.value) {
    debugLog('⏭️ Skipping data load - no date selected')
    return
  }

  try {
    loading.value = true
    error.value = null

    debugLog('📊 Loading timesheet data for:', {
      staffId: selectedStaffId.value,
      date: currentDate.value,
    })

    const response = await costlineService.getTimesheetEntries(
      selectedStaffId.value,
      currentDate.value,
    )

    debugLog('📡 API Response:', response)
    debugLog('📄 Cost lines from API:', response.cost_lines)
    debugLog('📊 Number of cost lines:', response.cost_lines?.length || 0)

    timeEntries.value = response.cost_lines.map((line: TimesheetCostLine) => ({
      id: line.id,
      jobId: line.job_id || '',
      jobNumber: line.job_number || '',
      client: line.client_name || '',
      jobName: line.job_name || '',
      hours: parseFloat(line.quantity),
      billable: typeof line.meta?.is_billable === 'boolean' ? line.meta.is_billable : true,
      description: line.desc,
      rate: getRateTypeFromMultiplier(
        typeof line.meta?.rate_multiplier === 'number' ? line.meta.rate_multiplier : 1.0,
      ),
      wage: line.wage_rate || parseFloat(line.unit_cost), // Wage per hour (staff cost)
      bill: line.total_rev,
      staffId: selectedStaffId.value,
      date: currentDate.value,
      wageRate: line.wage_rate || parseFloat(line.unit_cost),
      chargeOutRate: parseFloat(line.charge_out_rate),
      rateMultiplier:
        typeof line.meta?.rate_multiplier === 'number' ? line.meta.rate_multiplier : 1.0,
      isNewRow: false,
      isModified: false,
    }))

    loadData(timeEntries.value, selectedStaffId.value)

    debugLog(`✅ Loaded ${timeEntries.value.length} timesheet entries`)
  } catch (err) {
    debugLog('❌ Error loading timesheet data:', err)
    error.value = 'Failed to load timesheet data'
  } finally {
    loading.value = false
  }
}

const getRateTypeFromMultiplier = (multiplier: number): string => {
  switch (multiplier) {
    case 1.0:
      return 'Ord'
    case 1.5:
      return '1.5'
    case 2.0:
      return '2.0'
    case 0.0:
      return 'Unpaid'
    default:
      return 'Ord'
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    return
  }

  if (handleKeyboardShortcut(event, selectedStaffId.value)) {
    return
  }

  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'n':
        event.preventDefault()
        addNewEntry()
        break
      case 's':
        event.preventDefault()
        if (hasUnsavedChanges.value) {
          saveChanges()
        }
        break
    }
  }

  if (event.shiftKey && event.key === 'N') {
    event.preventDefault()
    event.stopPropagation()
    debugLog('🎯 Shift+N pressed - adding new entry')
    addNewEntry()
  }
}

onMounted(async () => {
  try {
    loading.value = true

    debugLog('🚀 Initializing optimized timesheet...')

    await timesheetStore.initialize()
    await timesheetStore.loadStaff()
    await timesheetStore.loadJobs()
    await companyDefaultsStore.loadCompanyDefaults()

    let validStaffId = selectedStaffId.value

    if (
      (!validStaffId || !timesheetStore.staff.find((s: Staff) => s.id === validStaffId)) &&
      timesheetStore.staff.length > 0
    ) {
      validStaffId = timesheetStore.staff[0].id
      debugLog('📋 No valid staff from URL, using first available:', validStaffId)
    } else if (validStaffId && timesheetStore.staff.find((s: Staff) => s.id === validStaffId)) {
      debugLog('👤 Using staff from URL parameters:', validStaffId)
    }

    selectedStaffId.value = validStaffId

    const currentStaffData = timesheetStore.staff.find((s: Staff) => s.id === validStaffId)

    debugLog('📋 Available staff:', timesheetStore.staff.length)
    debugLog('💼 Available jobs:', timesheetStore.jobs.length)
    debugLog(
      '👤 Current staff for calculations:',
      currentStaffData?.name,
      'wage rate:',
      currentStaffData?.wageRate,
    )
    debugLog('💰 Company defaults for calculations:', companyDefaultsStore.companyDefaults)

    updateRoute()

    isInitializing.value = false

    debugLog('📊 Starting initial data load...')
    await loadTimesheetData()

    window.addEventListener('keydown', handleKeydown)

    debugLog('✅ Optimized timesheet initialized successfully')
  } catch (err) {
    debugLog('❌ Error initializing optimized timesheet:', err)
    error.value = 'Failed to initialize timesheet'
  }
})

watch(
  [selectedStaffId, currentDate],
  async ([newStaffId, newDate], [oldStaffId, oldDate]) => {
    if (!newStaffId || !newDate) {
      debugLog('⏭️ Skipping watcher - missing staffId or date')
      return
    }

    if (newStaffId === oldStaffId && newDate === oldDate) {
      debugLog('⏭️ Skipping watcher - no actual change')
      return
    }

    if (isInitializing.value) {
      debugLog('⏭️ Skipping watcher - still initializing')
      return
    }

    if (!oldStaffId || !oldDate) {
      debugLog('⏭️ Skipping watcher - initial setup detected')
      return
    }

    debugLog('📊 Loading data due to staff/date change:', {
      newStaffId,
      newDate,
      oldStaffId,
      oldDate,
    })
    await loadTimesheetData()
  },
  { immediate: false },
)

watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (isInitializing.value) {
      debugLog('⏭️ Skipping URL watcher - still initializing')
      return
    }

    debugLog('🔗 URL query changed:', { old: oldQuery, new: newQuery })

    let hasChanges = false

    if (newQuery.date && newQuery.date !== currentDate.value) {
      debugLog('📅 Updating date from URL:', newQuery.date)
      currentDate.value = newQuery.date as string
      hasChanges = true
    }

    if (newQuery.staffId && newQuery.staffId !== selectedStaffId.value) {
      const staffExists = timesheetStore.staff.find((s: Staff) => s.id === newQuery.staffId)
      if (staffExists) {
        debugLog('👤 Updating staff from URL:', newQuery.staffId)
        selectedStaffId.value = newQuery.staffId as string
        hasChanges = true
      } else {
        debugLog('⚠️ Staff ID from URL not found:', newQuery.staffId)
      }
    }

    if (hasChanges) {
      debugLog('🔄 Reloading data due to URL changes')
      loadTimesheetData()
    }
  },
  { immediate: false },
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
:deep(.ag-theme-custom) {
  --ag-header-height: 40px;
  --ag-row-height: 35px;
  --ag-header-background-color: #181f2a;
  --ag-header-foreground-color: #f3f4f6;
  --ag-odd-row-background-color: rgb(248, 250, 252);
  --ag-row-hover-color: rgb(241, 245, 249);
  --ag-selected-row-background-color: rgb(219, 234, 254);
  --ag-border-color: rgb(226, 232, 240);
  --ag-font-size: 13px;
}

@media (max-width: 1024px) {
  :deep(.ag-theme-custom) {
    --ag-header-height: 36px;
    --ag-row-height: 32px;
    --ag-font-size: 12px;
  }

  :deep(.ag-theme-custom .ag-header-cell) {
    padding: 0 4px;
  }

  :deep(.ag-theme-custom .ag-cell) {
    padding: 0 4px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='client_name']),
  :deep(.ag-theme-custom .ag-cell[col-id='client_name']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='rate']),
  :deep(.ag-theme-custom .ag-cell[col-id='rate']) {
    display: none;
  }
}

@media (max-width: 640px) {
  :deep(.ag-theme-custom) {
    --ag-header-height: 32px;
    --ag-row-height: 28px;
    --ag-font-size: 11px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='job_name']),
  :deep(.ag-theme-custom .ag-cell[col-id='job_name']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='wage']),
  :deep(.ag-theme-custom .ag-cell[col-id='wage']) {
    display: none;
  }
}

:deep(.ag-theme-custom .ag-header-cell) {
  font-weight: 700;
  background: var(--ag-header-background-color) !important;
  color: var(--ag-header-foreground-color) !important;
  border-bottom: 1.5px solid #334155;
}

:deep(.ag-theme-custom .ag-cell) {
  border-right: 1px solid var(--ag-border-color);
}

:deep(.ag-theme-custom .ag-row-selected) {
  border: 1px solid rgb(59, 130, 246);
}

:deep(.ag-theme-custom .ag-body-horizontal-scroll) {
  height: 14px !important;
}

:deep(.ag-theme-custom .ag-body-vertical-scroll) {
  width: 14px !important;
}

kbd {
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>
