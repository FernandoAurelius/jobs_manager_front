import { api } from '../api/generated/api'
import type {
  MonthEndJob,
  MonthEndStockJob,
  MonthEndGetResponse,
  MonthEndPostResponse,
} from '@/api/generated/api'

export async function fetchMonthEnd(): Promise<{
  jobs: MonthEndJob[]
  stockJob: MonthEndStockJob
}> {
  // Note: Month parameter might need to be handled differently - check if endpoint supports query params
  const response: MonthEndGetResponse = await api.job_rest_month_end_retrieve()
  return { jobs: response.jobs, stockJob: response.stock_job }
}

export async function runMonthEnd(
  jobIds: string[],
): Promise<{ processed: string[]; errors: string[] }> {
  // Using proper request body format for month-end processing
  const response: MonthEndPostResponse = await api.job_rest_month_end_create({
    processed: jobIds,
    errors: [],
  })
  return { processed: response.processed, errors: response.errors }
}
