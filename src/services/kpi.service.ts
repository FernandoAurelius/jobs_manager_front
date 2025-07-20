import { api } from '@/api/generated/api'
import type {
  KPICalendarData,
  KPIDayData,
  KPIDetails,
  KPIJobBreakdown,
  KPIMonthlyTotals,
  KPIThresholds,
} from '@/api/generated/api'
import { debugLog } from '@/utils/debug'

// Types for params - keeping as local since they're for input validation
export interface KPICalendarParams {
  start_date: string
  mode?: 'timesheet' | 'ims'
}

export interface KPIAccountingParams {
  year?: number
  month?: number
}

// Type aliases for generated types (for backward compatibility)
export type KPIDay = KPIDayData
export type DayKPI = KPIDayData
export type DayDetails = KPIDetails
export type JobBreakdown = KPIJobBreakdown
export type MonthlyTotals = KPIMonthlyTotals
export type Thresholds = KPIThresholds
export type KPICalendarResponse = KPICalendarData

class KPIService {
  private baseUrl = '/timesheet/api'
  private accountingBaseUrl = '/accounting/api'

  async getKPICalendarData(params: KPICalendarParams): Promise<KPICalendarData> {
    try {
      // Use the generated API
      return await api.accounting_api_reports_calendar_retrieve({
        start_date: params.start_date,
        mode: params.mode,
      })
    } catch (error) {
      debugLog('❌ Error fetching KPI calendar data:', error)
      throw error
    }
  }

  async getAccountingKPICalendarData(
    params: KPIAccountingParams = {},
  ): Promise<KPICalendarResponse> {
    try {
      debugLog('🔍 Fetching KPI data with params:', params)

      // Use the generated Zodios client with query parameters
      const response = await api.accounting_api_reports_calendar_retrieve({
        queries: {
          year: params.year,
          month: params.month,
        },
      })

      debugLog('✅ KPI data fetched successfully:', {
        year: response.year,
        month: response.month,
        daysCount: Object.keys(response.calendar_data).length,
      })

      return response
    } catch (error) {
      debugLog('❌ Error fetching accounting KPI calendar data:', error)
      throw error
    }
  }

  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
    }).format(value)
  }

  formatHours(hours: number): string {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`
  }

  getPerformanceRating(daysGreen: number, daysAmber: number, daysRed: number): string {
    const totalDays = daysGreen + daysAmber + daysRed
    if (totalDays === 0) return '0'
    const greenPercentage = (daysGreen / totalDays) * 100
    return Math.round(greenPercentage).toString()
  }

  getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    return months[month - 1] || 'Unknown'
  }

  getWeekStart(date: Date): Date {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    return weekStart
  }

  getWeekDays(startDate: Date): Date[] {
    const days: Date[] = []
    for (let i = 0; i < 5; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  getIMSWeekDays(startDate: Date): Date[] {
    const days: Date[] = []

    const tuesday = new Date(startDate)
    const dayOfWeek = tuesday.getDay()
    const daysToTuesday = dayOfWeek === 0 ? 2 : (2 - dayOfWeek + 7) % 7
    tuesday.setDate(tuesday.getDate() + daysToTuesday)

    for (let i = 0; i < 4; i++) {
      const day = new Date(tuesday)
      day.setDate(tuesday.getDate() + i)
      days.push(day)
    }

    const nextMonday = new Date(tuesday)
    nextMonday.setDate(tuesday.getDate() + 5)
    days.push(nextMonday)

    return days
  }
}

export const kpiService = new KPIService()
export default kpiService
