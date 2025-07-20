import { type Ref } from 'vue'
import { schemas } from '../api/generated/api'
import type {
  TimesheetEntryWithMeta,
  TimesheetEntryJobSelectionItem,
  TimesheetEntryStaffMember,
} from '../api/local/schemas'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'
import { jobService } from '@/services/job.service'
import { useJobsStore } from '../stores/jobs'

// Use the generated schemas
type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>
type CostLine = z.infer<typeof schemas.CostLine>

export function useTimesheetEntryCalculations(companyDefaults: Ref<CompanyDefaults | null>) {
  const getRateMultiplier = (rateType: string): number => {
    switch (rateType) {
      case '1.5':
        return 1.5
      case '2.0':
        return 2.0
      case 'Unpaid':
        return 0.0
      default:
        return 1.0
    }
  }

  const calculateWage = (hours: number, rateType: string, wageRate: number): number => {
    if (hours <= 0 || wageRate <= 0) return 0

    const multiplier = getRateMultiplier(rateType)
    return Math.round(hours * wageRate * multiplier * 100) / 100
  }

  const calculateBill = (hours: number, chargeOutRate: number, billable: boolean): number => {
    if (!billable || hours <= 0 || chargeOutRate <= 0) return 0

    return Math.round(hours * chargeOutRate * 100) / 100
  }

  const populateJobFields = (
    entry: TimesheetEntryWithMeta,
    job: TimesheetEntryJobSelectionItem,
  ): TimesheetEntryWithMeta => {
    debugLog('🔧 Populating job fields:', {
      entry: entry,
      job: job,
    })

    // Convert job selection item to the expected format for TimesheetEntryWithMeta
    const result = {
      ...entry,
      job_id: job.id,
      job_number: job.jobNumber,
      client_name: job.client,
      job_name: job.jobName,
      charge_out_rate: job.chargeOutRate.toString(),
    }

    debugLog('✨ Populated job fields result:', result)
    return result
  }

  const createNewRow = (
    staffMember: TimesheetEntryStaffMember,
    date: string,
  ): TimesheetEntryWithMeta => {
    const defaultWageRate = companyDefaults.value?.wage_rate || 32.0
    const defaultChargeOutRate = companyDefaults.value?.charge_out_rate || 105.0

    return {
      id: 0, // Will be set by backend
      kind: 'time' as const,
      desc: '',
      quantity: '0',
      unit_cost: defaultWageRate.toString(),
      unit_rev: defaultChargeOutRate.toString(),
      total_cost: 0,
      total_rev: 0,
      ext_refs: {},
      meta: {
        date,
        staff_id: staffMember.id,
        rate_type: 'Ord',
        is_billable: true,
      },
      job_id: '',
      job_number: '',
      job_name: '',
      client_name: '',
      charge_out_rate: defaultChargeOutRate.toString(),
      // Add UI-specific metadata fields
      tempId: `temp_${Date.now()}`,
      _isSaving: false,
      isNewRow: true,
      isModified: false,
    }
  }

  const recalculateEntry = (entry: TimesheetEntryWithMeta): TimesheetEntryWithMeta => {
    const updatedEntry = { ...entry }
    const hours = parseFloat(entry.quantity)
    const wageRate = parseFloat(entry.unit_cost)
    const chargeOutRate = parseFloat(entry.charge_out_rate)

    // Type-safe access to meta properties
    const meta = entry.meta as Record<string, unknown> | undefined
    const rateType = typeof meta?.rate_type === 'string' ? meta.rate_type : 'Ord'
    const billable = meta?.is_billable !== false

    updatedEntry.total_cost = calculateWage(hours, rateType, wageRate)
    updatedEntry.total_rev = calculateBill(hours, chargeOutRate, billable)

    return updatedEntry
  }

  const validateEntry = (entry: TimesheetEntryWithMeta): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    const hours = parseFloat(entry.quantity)

    if (!entry.job_number.trim()) {
      errors.push('Job is required')
    }

    if (hours <= 0) {
      errors.push('Hours must be greater than 0')
    }

    if (hours > 24) {
      errors.push('Hours cannot exceed 24 per day')
    }

    if (!entry.desc.trim()) {
      errors.push('Description is required')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const toCostLinePayload = (entry: TimesheetEntryWithMeta, jobId: string) => {
    // Type guard for meta object
    const metaObj = entry.meta && typeof entry.meta === 'object' ? entry.meta : {}
    const job = jobService.serachJobsLocal(useJobsStore().allKanbanJobs, entry.job_number)
    const billable = (() => {
      // Shop jobs are never billable
      if (job.shop_job) {
        return false
      }

      // Special status jobs are also not billable
      if (job.status === 'special') {
        return false
      }

      return true
    })()
    if ((metaObj as Record<string, unknown>).is_billable) {
      ;(metaObj as Record<string, unknown>).is_billable = billable
    }

    return {
      kind: 'time' as const,
      desc: entry.desc,
      quantity: entry.quantity,
      unit_cost: entry.unit_cost,
      unit_rev: entry.unit_rev,
      meta: {
        ...metaObj,
        job_id: jobId,
        client_name: entry.client_name,
        job_name: entry.job_name,
      },
    }
  }

  const fromCostLine = (costLine: CostLine, staffId: string): TimesheetEntryWithMeta => {
    if (!costLine || costLine.kind !== 'time') {
      throw new Error('Invalid cost line for time entry conversion')
    }

    // Type guard for meta object
    const metaObj = costLine.meta && typeof costLine.meta === 'object' ? costLine.meta : {}

    return {
      id: costLine.id || 0,
      kind: 'time' as const,
      desc: costLine.desc || '',
      quantity: costLine.quantity || '0',
      unit_cost: costLine.unit_cost || '0',
      unit_rev: costLine.unit_rev || '0',
      total_cost: costLine.total_cost || 0,
      total_rev: costLine.total_rev || 0,
      ext_refs: costLine.ext_refs || {},
      meta: {
        ...metaObj,
        staff_id: staffId,
      },
      job_id:
        metaObj && 'job_id' in metaObj && typeof metaObj.job_id === 'string' ? metaObj.job_id : '',
      job_number:
        metaObj && 'job_number' in metaObj && typeof metaObj.job_number === 'string'
          ? metaObj.job_number
          : '',
      job_name:
        metaObj && 'job_name' in metaObj && typeof metaObj.job_name === 'string'
          ? metaObj.job_name
          : '',
      client_name:
        metaObj && 'client_name' in metaObj && typeof metaObj.client_name === 'string'
          ? metaObj.client_name
          : '',
      charge_out_rate: costLine.unit_rev || '0',
      // Add UI-specific metadata fields
      tempId: undefined,
      _isSaving: false,
      isNewRow: false,
      isModified: false,
    }
  }

  return {
    calculateWage,
    calculateBill,
    recalculateEntry,

    populateJobFields,
    createNewRow,
    toCostLinePayload,
    fromCostLine,

    validateEntry,

    getRateMultiplier,
  }
}
