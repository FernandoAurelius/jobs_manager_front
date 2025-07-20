import { api } from '@/api/generated/api'
import type { CostLineCreateUpdate, ModernTimesheetEntryGetResponse } from '@/api/generated/api'
import { debugLog } from '@/utils/debug'

// Local types for create/update payloads (simplified interfaces for UI)
export interface CostLineCreatePayload {
  kind: 'time' | 'material' | 'adjust'
  desc: string
  quantity: string
  unit_cost: string
  unit_rev: string
  ext_refs?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export interface CostLineUpdatePayload {
  desc?: string
  quantity?: string
  unit_cost?: string
  unit_rev?: string
  ext_refs?: Record<string, unknown>
  meta?: Record<string, unknown>
}

// Use generated response type for timesheet entries
export type TimesheetEntriesResponse = ModernTimesheetEntryGetResponse

export const getTimesheetEntries = async (
  staffId: string,
  date: string,
): Promise<TimesheetEntriesResponse> => {
  try {
    return await api.job_rest_timesheet_entries_retrieve({
      queries: {
        staff_id: staffId,
        date: date,
      },
    })
  } catch (error) {
    console.error('Error fetching timesheet entries:', error)
    throw error
  }
}

export const createCostLine = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual',
  payload: CostLineCreatePayload,
): Promise<CostLineCreateUpdate> => {
  if (kind === 'actual') {
    return await api.job_rest_jobs_cost_sets_actual_cost_lines_create(
      payload as CostLineCreateUpdate,
      {
        params: { job_id: String(jobId) },
      },
    )
  } else {
    return await api.job_rest_jobs_cost_sets_cost_lines_create(payload as CostLineCreateUpdate, {
      params: { job_id: String(jobId), kind },
    })
  }
}

export const updateCostLine = async (
  id: number,
  payload: CostLineUpdatePayload,
): Promise<CostLineCreateUpdate> => {
  // Ensure id is a number
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id

  return await api.job_rest_cost_lines_partial_update(payload as CostLineCreateUpdate, {
    params: { cost_line_id: numericId },
  })
}

export const deleteCostLine = async (id: number): Promise<void> => {
  debugLog('🚀 SERVICE: Starting DELETE request for cost line ID:', id)

  try {
    // Ensure id is a number
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id

    await api.job_rest_cost_lines_delete_destroy(undefined, {
      params: { cost_line_id: numericId },
    })
    debugLog('✅ SERVICE: DELETE request completed successfully')
  } catch (error) {
    debugLog('❌ SERVICE: DELETE request failed:', error)
    throw error
  }
}

export const costlineService = {
  createCostLine,
  updateCostLine,
  deleteCostLine,
}
