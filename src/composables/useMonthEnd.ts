import api from '@/plugins/axios'

export interface JobHistoryEntry {
  date: string
  total_hours: number
  total_dollars: number
}

export interface MonthEndJob {
  job_id: string
  job_number: number
  job_name: string
  client_name: string
  history: JobHistoryEntry[]
  total_hours: number
  total_dollars: number
}

export interface StockJobHistoryEntry {
  date: string
  material_line_count: number
  material_cost: number
}

export interface StockJob {
  job_id: string
  job_number: number
  job_name: string
  history: StockJobHistoryEntry[]
}

export async function fetchMonthEnd(
  month: string,
): Promise<{ jobs: MonthEndJob[]; stockJob: StockJob }> {
  const res = await api.get('/job/rest/month-end/', { params: { month } })
  return { jobs: res.data.jobs, stockJob: res.data.stock_job }
}

export async function runMonthEnd(
  jobIds: string[],
): Promise<{ processed: string[]; errors: [string, string][] }> {
  const res = await api.post('/job/rest/month-end/', { job_ids: jobIds })
  return res.data
}
