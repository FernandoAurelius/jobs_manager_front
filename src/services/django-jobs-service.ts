import { api } from '@/api/generated/api'
import type { DjangoJob, DjangoJobExecution } from '@/api/generated/api'

export async function getDjangoJobs(): Promise<DjangoJob[]> {
  return await api.quoting_api_django_jobs_list()
}

export async function createDjangoJob(data: DjangoJob): Promise<DjangoJob> {
  return await api.quoting_api_django_jobs_create(data)
}

export async function updateDjangoJob(id: string, data: Partial<DjangoJob>): Promise<DjangoJob> {
  return await api.quoting_api_django_jobs_update({ id, ...data })
}

export async function deleteDjangoJob(id: string): Promise<void> {
  await api.quoting_api_django_jobs_destroy({ id })
}

export async function getDjangoJobExecutions(search?: string): Promise<DjangoJobExecution[]> {
  return await api.quoting_api_django_job_executions_list(search ? { search } : {})
}
