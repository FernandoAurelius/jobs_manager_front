import { api, schemas } from '@/api/generated/api'
import type { z } from 'zod'

type CostSet = z.infer<typeof schemas.CostSet>

export const fetchCostSet = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual' = 'estimate',
): Promise<CostSet> => {
  const response = await api.job_rest_jobs_cost_sets_retrieve({
    params: {
      id: jobId.toString(),
      kind,
    },
  })

  return response
}
