import { api, schemas } from '../api/generated/api'
import type { z } from 'zod'

// Use inferred types from Zod schemas
type DailyTimesheetSummary = z.infer<typeof schemas.DailyTimesheetSummary>
type StaffDailyData = z.infer<typeof schemas.StaffDailyData>

// All interfaces migrated to generated types from ../api/generated/api
// - JobBreakdown (now from generated API)
// - StaffDailyData (now from generated API)
// - DailyTotals (now from generated API)
// - SummaryStats (now from generated API)
// - DailyTimesheetSummary (now from generated API)

export const getDailyTimesheetSummary = async (date?: string): Promise<DailyTimesheetSummary> => {
  if (date) {
    return await api.getDailyTimesheetSummaryByDate_2({ params: { target_date: date } })
  } else {
    return await api.getDailyTimesheetSummaryByDate()
  }
}

export const getStaffDailyDetail = async (
  staffId: string,
  date?: string,
): Promise<StaffDailyData> => {
  if (date) {
    // Backend returns single StaffDailyData object, not full DailyTimesheetSummary
    const response = (await api.getStaffDailyTimesheetDetailByDate_2({
      params: {
        staff_id: staffId,
        target_date: date,
      },
    })) as unknown as StaffDailyData
    return response
  } else {
    const response = (await api.getStaffDailyTimesheetDetailByDate({
      params: { staff_id: staffId },
    })) as unknown as StaffDailyData
    return response
  }
}

export const formatHours = (hours: number): string => {
  return hours.toFixed(1)
}

export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`
}

export const getStatusVariant = (statusClass: string): string => {
  const variants: Record<string, string> = {
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
    secondary: 'secondary',
  }
  return variants[statusClass] || 'secondary'
}

export default {
  getDailyTimesheetSummary,
  getStaffDailyDetail,
  formatHours,
  formatCurrency,
  getStatusVariant,
}
