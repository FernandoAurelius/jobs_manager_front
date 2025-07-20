export interface StaffPerformanceReportParams {
  start_date: string
  end_date: string
}

export interface StaffPerformanceData {
  id: number
  name: string
  total_hours: number
  billable_hours: number
  billable_percentage: number
  revenue_per_hour: number
  profit_per_hour: number
  jobs_worked: number
  total_revenue: number
  profit: number
}

export interface TeamAverages {
  billable_percentage: number
  revenue_per_hour: number
  profit_per_hour: number
  jobs_per_person: number
  total_hours: number
  billable_hours: number
  total_revenue: number
  total_profit: number
}

export interface StaffPerformanceReportResponse {
  staff: StaffPerformanceData[]
  team_averages: TeamAverages
  period_summary: {
    start_date: string
    end_date: string
    total_staff: number
    period_description: string
  }
}
