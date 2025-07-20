import { api, schemas } from '@/api/generated/api'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'

type Staff = z.infer<typeof schemas.ModernStaff>
type Job = z.infer<typeof schemas.ModernTimesheetJob>
type WeeklyOverviewData = z.infer<typeof schemas.WeeklyTimesheetData>
type CostLine = z.infer<typeof schemas.CostLine>

export class TimesheetService {
  static async getStaff(): Promise<Staff[]> {
    try {
      const staff = await api.timesheets_api_staff_retrieve()

      // Get company defaults for fallback wage rate
      let defaultWageRate = 32
      try {
        const defaults = await api.api_company_defaults_retrieve()
        defaultWageRate = parseFloat(defaults.wage_rate || '32') || 32
      } catch {
        debugLog('Could not fetch company defaults, using fallback wage rate:', defaultWageRate)
      }

      // Normalize staff data to ensure consistent field names
      const normalizedStaff = staff.map(
        (staff: {
          id: string
          firstName?: string
          first_name?: string
          lastName?: string
          last_name?: string
          wageRate?: string | number
          wage_rate?: string | number
          fullName?: string
          full_name?: string
          name?: string
          avatarUrl?: string
          avatar_url?: string
        }) => ({
          id: staff.id,
          firstName: staff.firstName || staff.first_name || 'Unknown',
          lastName: staff.lastName || staff.last_name || '',
          wageRate:
            parseFloat(String(staff.wageRate || staff.wage_rate || defaultWageRate)) ||
            defaultWageRate,
          fullName:
            staff.fullName ||
            staff.full_name ||
            `${staff.firstName || staff.first_name || 'Unknown'} ${staff.lastName || staff.last_name || ''}`.trim(),
          name:
            staff.name ||
            staff.fullName ||
            staff.full_name ||
            `${staff.firstName || staff.first_name || 'Unknown'} ${staff.lastName || staff.last_name || ''}`.trim(),
          avatarUrl: staff.avatarUrl || staff.avatar_url,
        }),
      )

      debugLog('👥 Staff normalized for timesheet:', {
        count: normalizedStaff.length,
        sample: normalizedStaff[0],
        defaultWageRate,
        keys: normalizedStaff[0] ? Object.keys(normalizedStaff[0]) : [],
      })

      return normalizedStaff
    } catch (error) {
      debugLog('Error fetching staff:', error)
      throw error
    }
  }

  // Legacy method - use CostLine queries instead
  static async getTimeEntries(staffId: string, date: string): Promise<CostLine[]> {
    try {
      // Use generated API to get timesheet entries
      const response = await api.job_rest_timesheet_day_retrieve({
        staff_id: staffId,
        date: date,
      })
      return response.entries || []
    } catch (error) {
      debugLog('Error fetching cost lines:', error)
      throw error
    }
  }

  static async getJobs(): Promise<Job[]> {
    try {
      const jobs = await api.timesheets_api_jobs_retrieve()
      return jobs
    } catch (error) {
      debugLog('Error fetching jobs:', error)
      throw error
    }
  }

  static async getWeeklyOverview(startDate: string): Promise<WeeklyOverviewData> {
    try {
      const response = await api.job_rest_timesheet_weekly_retrieve({ date: startDate })
      return response
    } catch (error) {
      debugLog('Error fetching weekly overview:', error)
      throw error
    }
  }

  static getCurrentWeekRange(): { startDate: string; endDate: string } {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    }
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-NZ', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  static formatHours(hours: number): string {
    return hours.toFixed(2)
  }

  static async getStaffList(): Promise<Staff[]> {
    return this.getStaff()
  }

  static async getAvailableJobs(): Promise<Job[]> {
    return this.getJobs()
  }

  static async exportToIMS(weekStart: Date): Promise<string> {
    debugLog('IMS export not yet implemented for:', weekStart)
    return 'IMS export functionality coming soon'
  }
}
