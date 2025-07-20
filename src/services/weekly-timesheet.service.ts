import { api } from '@/api/generated/api'
import type { WeeklyTimesheetData } from '@/api/generated/api'
import { dateService } from '@/services/date.service'

export const getWeeklyTimesheetOverview = async (
  startDate?: string,
  exportToIMS: boolean = false,
): Promise<WeeklyTimesheetData> => {
  const queryParams: Record<string, string> = {}

  if (startDate) {
    queryParams.start_date = startDate
  }

  if (exportToIMS) {
    queryParams.export_to_ims = 'true'
  }

  return await api.timesheets_api_weekly_retrieve({ queries: queryParams })
}

export const exportToIMS = async (startDate: string): Promise<WeeklyTimesheetData> => {
  const queryParams = {
    start_date: startDate,
    export_to_ims: 'true' as const,
  }

  return await api.timesheets_api_weekly_retrieve({ queries: queryParams })
}

export const submitPaidAbsence = async (data: {
  staff_id: string
  start_date: string
  end_date: string
  leave_type: 'annual' | 'sick' | 'other'
  hours_per_day?: number
  notes?: string
}): Promise<{ success: boolean; messages?: string[] }> => {
  const payload = {
    staff_id: data.staff_id,
    start_date: data.start_date,
    end_date: data.end_date,
    leave_type: data.leave_type,
    hours_per_day: data.hours_per_day || 8,
    description: data.notes || '',
  }

  const response = await api.timesheets_api_weekly_create({ body: payload })
  return response as { success: boolean; messages?: string[] }
}

export const getCurrentWeekRange = (): { startDate: string; endDate: string } => {
  const weekRange = dateService.getCurrentWeekRange()
  return {
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  }
}

export const getWeekRange = (date: Date): { startDate: string; endDate: string } => {
  const weekRange = dateService.getWeekRange(date)
  return {
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  }
}

export const formatDateRange = (startDate: string, endDate: string): string => {
  return dateService.formatDateRange(startDate, endDate)
}

export const formatHours = (hours: number): string => {
  return hours.toFixed(1)
}

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`
}

export default {
  getWeeklyTimesheetOverview,
  exportToIMS,
  submitPaidAbsence,
  getCurrentWeekRange,
  getWeekRange,
  formatDateRange,
  formatHours,
  formatPercentage,
}
