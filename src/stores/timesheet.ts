import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { schemas, api } from '@/api/generated/api'
import { debugLog } from '@/utils/debug'
import type { z } from 'zod'

type CostLine = z.infer<typeof schemas.CostLine>
type Staff = z.infer<typeof schemas.ModernStaff>
type Job = z.infer<typeof schemas.ModernTimesheetJob>
type WeeklyOverviewData = z.infer<typeof schemas.WeeklyTimesheetData>
type CostLineCreateUpdate = z.infer<typeof schemas.CostLineCreateUpdate>
type PatchedCostLineCreateUpdate = z.infer<typeof schemas.PatchedCostLineCreateUpdate>

export const useTimesheetStore = defineStore('timesheet', () => {
  const lines = ref<CostLine[]>([])
  const loading = ref(false)
  const jobId = ref<string | null>(null)
  const kind = ref<'estimate' | 'quote' | 'actual'>('actual')

  const staff = ref<Staff[]>([])
  const jobs = ref<Job[]>([])
  const currentWeekData = ref<WeeklyOverviewData | null>(null)
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0])
  const selectedStaffId = ref<string>('')
  const currentView = ref<'staff-day' | 'weekly-kanban' | 'calendar-grid'>('staff-day')
  const attachedJobs = ref<Job[]>([])
  const error = ref<string | null>(null)

  const currentStaff = computed(
    () => staff.value.find((s) => s.id === selectedStaffId.value) || null,
  )

  const byDate = computed(() => {
    if (!lines.value.length) return {} as Record<string, CostLine[]>

    const groups: Record<string, CostLine[]> = {}
    for (const line of lines.value) {
      const dateKey = String(line.meta?.date || selectedDate.value)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(line)
    }
    return groups
  })

  const dailyTotals = computed(() => {
    if (!lines.value.length) return {}

    return Object.entries(byDate.value as Record<string, CostLine[]>).reduce(
      (totals, [date, dayLines]) => {
        totals[date] = {
          hours: dayLines.reduce((sum, line) => {
            return line.kind === 'time' ? sum + Number(line.quantity || 0) : sum
          }, 0),
          cost: dayLines.reduce((sum, line) => sum + line.total_cost, 0),
          revenue: dayLines.reduce((sum, line) => sum + line.total_rev, 0),
        }
        return totals
      },
      {} as Record<string, { hours: number; cost: number; revenue: number }>,
    )
  })

  // Time-based computed properties - using CostLine data
  const timeLinesForSelectedDate = computed(() =>
    lines.value.filter(
      (line: CostLine) =>
        line.kind === 'time' &&
        line.meta?.date === selectedDate.value &&
        line.meta?.staff_id === selectedStaffId.value,
    ),
  )

  const totalHoursForDate = computed(() =>
    timeLinesForSelectedDate.value.reduce(
      (sum: number, line: CostLine) => sum + Number(line.quantity || 0),
      0,
    ),
  )

  const billableHoursForDate = computed(() =>
    timeLinesForSelectedDate.value
      .filter((line: CostLine) => line.meta?.is_billable)
      .reduce((sum: number, line: CostLine) => sum + Number(line.quantity || 0), 0),
  )

  async function load(targetJobId: string, targetKind: 'estimate' | 'quote' | 'actual' = 'actual') {
    if (!targetJobId) {
      debugLog('Load called without jobId')
      return
    }

    loading.value = true
    error.value = null

    try {
      debugLog(`Loading cost lines for job ${targetJobId}, kind: ${targetKind}`)

      const costSet = await api.job_rest_jobs_cost_sets_retrieve()

      lines.value = costSet.cost_lines
      jobId.value = targetJobId
      kind.value = targetKind

      debugLog(`Loaded ${costSet.cost_lines.length} cost lines successfully`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cost lines'
      error.value = errorMessage
      debugLog('Error loading cost lines:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addLine(payload: CostLineCreateUpdate) {
    if (!jobId.value) {
      throw new Error('No job loaded. Call load() first.')
    }

    loading.value = true
    error.value = null

    try {
      const newLine = await api.job_rest_jobs_cost_sets_cost_lines_create({
        job_id: jobId.value,
        kind: kind.value,
        body: payload,
      })

      lines.value.push(newLine)

      debugLog('Cost line added successfully:', newLine.id)
      return newLine
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cost line'
      error.value = errorMessage
      debugLog('Error adding cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateLine(id: number, payload: PatchedCostLineCreateUpdate) {
    loading.value = true
    error.value = null

    try {
      const updatedLine = await api.job_rest_cost_lines_partial_update({
        cost_line_id: id.toString(),
        body: payload,
      })

      const lineIndex = lines.value.findIndex((line) => line.id === id)

      if (lineIndex === -1) {
        throw new Error(`Cost line with ID ${id} not found in current state`)
      }

      Object.assign(lines.value[lineIndex], updatedLine)

      debugLog('Cost line updated successfully:', id)
      return updatedLine
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cost line'
      error.value = errorMessage
      debugLog('Error updating cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteLine(id: number) {
    loading.value = true
    error.value = null

    try {
      await api.job_rest_cost_lines_delete_destroy({ cost_line_id: id.toString() })

      lines.value = lines.value.filter((line) => line.id !== id)

      debugLog('Cost line deleted successfully:', id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cost line'
      error.value = errorMessage
      debugLog('Error deleting cost line:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function initialize() {
    await Promise.all([loadStaff(), loadJobs(), loadCompanyDefaults()])

    if (staff.value.length > 0 && !selectedStaffId.value) {
      selectedStaffId.value = staff.value[0].id
    }
  }

  async function loadCompanyDefaults() {
    try {
      await api.api_company_defaults_retrieve()
    } catch (err) {
      debugLog('Error loading company defaults:', err)
    }
  }

  async function loadStaff() {
    loading.value = true
    error.value = null

    try {
      const response = await api.timesheets_api_staff_retrieve()
      staff.value = response.staff
    } catch (err) {
      error.value = 'Failed to load staff members'
      debugLog('Error loading staff:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadJobs() {
    loading.value = true
    error.value = null

    try {
      const response = await api.timesheets_api_jobs_retrieve()
      jobs.value = response.jobs
    } catch (err) {
      error.value = 'Failed to load jobs'
      debugLog('Error loading jobs:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadTimeLines() {
    if (!selectedStaffId.value || !jobId.value) return

    loading.value = true
    error.value = null

    try {
      // Load cost lines for the current job and filter by staff/date
      await load(jobId.value, 'actual')
    } catch (err) {
      error.value = 'Failed to load time lines'
      debugLog('Error loading time lines:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadWeeklyOverview(startDate?: string) {
    loading.value = true
    error.value = null

    try {
      // Use current date if no start date provided
      const weekStart = startDate || new Date().toISOString().split('T')[0]
      debugLog('📊 Loading weekly overview for:', weekStart)

      currentWeekData.value = await api.timesheets_api_weekly_retrieve({
        queries: { date: weekStart },
      })

      debugLog('✅ Weekly overview loaded successfully:', {
        staffCount: currentWeekData.value?.staff_data?.length || 0,
        startDate: currentWeekData.value?.start_date,
        endDate: currentWeekData.value?.end_date,
      })
    } catch (err) {
      error.value = 'Failed to load weekly overview'
      debugLog('❌ Error loading weekly overview:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTimeEntry(entryData: {
    description: string
    jobId: string
    hours: number
    isBillable: boolean
    notes?: string
    items?: number
    minsPerItem?: number
    wageRate?: number
    chargeOutRate?: number
    rateMultiplier?: number
  }) {
    if (!selectedStaffId.value) {
      throw new Error('No staff member selected')
    }

    loading.value = true
    error.value = null

    try {
      debugLog('📝 Creating new time entry:', entryData)

      // Use generated API to create time entry
      const costLineData = {
        kind: 'time' as const,
        desc: entryData.description,
        quantity: entryData.hours.toString(),
        unit_cost: (entryData.wageRate || 32.0).toString(),
        unit_rev: (entryData.chargeOutRate || 105.0).toString(),
        meta: {
          staff_id: selectedStaffId.value,
          date: selectedDate.value,
          is_billable: entryData.isBillable,
          rate_multiplier: entryData.rateMultiplier || 1.0,
        },
      }

      const newCostLine = await api.job_rest_jobs_cost_sets_actual_cost_lines_create({
        job_id: entryData.jobId,
        body: costLineData,
      })

      if (newCostLine) {
        // Add to lines if we're viewing the same job
        if (jobId.value === entryData.jobId && kind.value === 'actual') {
          lines.value.push(newCostLine)
        }

        debugLog('✅ Time entry created successfully:', newCostLine)

        // Reload cost lines to get updated data
        await loadTimeLines()
      }
    } catch (err) {
      error.value = 'Failed to create time entry'
      debugLog('❌ Error creating time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTimeEntry(
    entryId: string,
    updates: {
      description?: string
      hours?: number
      isBillable?: boolean
      notes?: string
      items?: number
      minsPerItem?: number
      wageRate?: number
      chargeOutRate?: number
      rateMultiplier?: number
      jobId?: string
    },
  ) {
    loading.value = true
    error.value = null

    try {
      debugLog('🔄 Updating time entry:', entryId, updates)

      // Use generated API to update time entry
      const updatePayload: PatchedCostLineCreateUpdate = {}

      if (updates.description !== undefined) updatePayload.desc = updates.description
      if (updates.hours !== undefined) updatePayload.quantity = updates.hours.toString()
      if (updates.wageRate !== undefined) updatePayload.unit_cost = updates.wageRate.toString()
      if (updates.chargeOutRate !== undefined)
        updatePayload.unit_rev = updates.chargeOutRate.toString()

      if (updates.isBillable !== undefined || updates.rateMultiplier !== undefined) {
        // Need to preserve existing meta and update specific fields
        const existingLine = lines.value.find((line) => line.id === parseInt(entryId))
        updatePayload.meta = {
          ...existingLine?.meta,
          ...(updates.isBillable !== undefined && { is_billable: updates.isBillable }),
          ...(updates.rateMultiplier !== undefined && { rate_multiplier: updates.rateMultiplier }),
        }
      }

      const updatedCostLine = await api.job_rest_cost_lines_partial_update({
        cost_line_id: entryId,
        body: updatePayload,
      })

      if (updatedCostLine) {
        // Update in local state
        const index = lines.value.findIndex((line) => line.id === parseInt(entryId))
        if (index !== -1) {
          lines.value[index] = updatedCostLine
        }

        debugLog('✅ Time entry updated successfully:', updatedCostLine)

        // Reload cost lines to get updated data
        await loadTimeLines()

        return updatedCostLine
      }
    } catch (err) {
      error.value = 'Failed to update time entry'
      debugLog('❌ Error updating time entry:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function setSelectedStaff(staffId: string) {
    selectedStaffId.value = staffId
    // Clear lines when changing staff
    lines.value = []
    loadTimeLines()
  }

  function setSelectedDate(date: string) {
    selectedDate.value = date
    loadTimeLines()
  }

  function setCurrentView(view: 'staff-day' | 'weekly-kanban' | 'calendar-grid') {
    currentView.value = view

    if (view === 'weekly-kanban' || view === 'calendar-grid') {
      loadWeeklyOverview()
    } else {
      loadTimeLines()
    }
  }

  function clearError() {
    error.value = null
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString()
  }

  function formatHours(hours: number): string {
    return hours.toFixed(2)
  }

  function addAttachedJob(job: Job) {
    const existingIndex = attachedJobs.value.findIndex((j) => j.id === job.id)
    if (existingIndex === -1) {
      attachedJobs.value.push(job)
      debugLog('Job attached to timesheet:', job.name)
    } else {
      debugLog('Job already attached:', job.name)
    }
  }

  function removeAttachedJob(jobId: string) {
    const index = attachedJobs.value.findIndex((j) => j.id === jobId)
    if (index !== -1) {
      const removedJob = attachedJobs.value[index]
      attachedJobs.value.splice(index, 1)
      debugLog('Job removed from timesheet:', removedJob.name)
    } else {
      debugLog('Job not found in attached jobs:', jobId)
    }
  }

  return {
    lines,
    jobId,
    kind,

    staff,
    jobs,
    currentWeekData,
    selectedDate,
    selectedStaffId,
    currentView,
    attachedJobs,
    loading,
    error,

    byDate,
    dailyTotals,

    currentStaff,
    timeLinesForSelectedDate,
    totalHoursForDate,
    billableHoursForDate,

    load,
    addLine,
    updateLine,
    deleteLine,

    initialize,
    loadStaff,
    loadJobs,
    loadCompanyDefaults,
    loadTimeLines,
    loadWeeklyOverview,
    createTimeEntry,
    updateTimeEntry,
    setSelectedStaff,
    setSelectedDate,
    setCurrentView,
    clearError,
    formatDate,
    formatHours,
    addAttachedJob,
    removeAttachedJob,
  }
})
