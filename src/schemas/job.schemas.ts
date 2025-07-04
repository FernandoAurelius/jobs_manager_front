import { z } from 'zod'
import { CostSetSchema } from './costing.schemas'

export const QuoteSheetSchema = z.object({
  id: z.string(),
  sheet_id: z.string(),
  sheet_url: z.string(),
  tab: z.string(),
  job_id: z.string(),
  job_number: z.string(),
  job_name: z.string(),
})

export const JobPricingSchema = z.object({
  id: z.string(),
  pricing_stage: z.enum(['estimate', 'quote', 'reality']),
  revision_number: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  time_entries: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        items: z.number(),
        minutes_per_item: z.string().transform((val) => parseFloat(val)),
        wage_rate: z.string().transform((val) => parseFloat(val)),
        charge_out_rate: z.string().transform((val) => parseFloat(val)),
        total_minutes: z.number(),
        revenue: z.number(),
        cost: z.number(),
        staff_id: z.string().nullable(),
        timesheet_date: z.string().nullable(),
        staff_name: z.string().nullable(),
      }),
    )
    .default([]),
  material_entries: z
    .array(
      z.object({
        id: z.string(),
        item_code: z.string().optional(),
        description: z.string(),
        quantity: z.string().transform((val) => parseFloat(val)),
        unit_cost: z.string().transform((val) => parseFloat(val)),
        unit_revenue: z.string().transform((val) => parseFloat(val)),
        revenue: z.number(),
        cost: z.number(),
        comments: z.string().optional(),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    )
    .default([]),
  adjustment_entries: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        cost_adjustment: z.string().transform((val) => parseFloat(val)),
        price_adjustment: z.string().transform((val) => parseFloat(val)),
        revenue: z.number(),
        cost: z.number(),
        comments: z.string().optional(),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    )
    .default([]),
  total_cost: z.number(),
  total_revenue: z.number(),
})

export const CompanyDefaultsSchema = z.object({
  materials_markup: z.number(),
  time_markup: z.number(),
  charge_out_rate: z.number(),
  wage_rate: z.number(),
})

export const JobEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  event_type: z.string(),
  description: z.string(),
  staff: z.string().nullable(),
})

export const InvoiceSchema = z.object({
  id: z.string(),
  xero_id: z.string(),
  number: z.string(),
  status: z.string(),
  date: z.string(),
  due_date: z.string().nullable(),
  total_excl_tax: z.number(),
  total_incl_tax: z.number(),
  amount_due: z.number(),
  online_url: z.string().nullable().optional(),
})

export const QuoteSchema = z.object({
  id: z.string(),
  xero_id: z.string(),
  status: z.string(),
  date: z.string(),
  total_excl_tax: z.number(),
  total_incl_tax: z.number(),
  online_url: z.string().nullable().optional(),
})

export const JobDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  job_number: z.number(),
  client_id: z.string(),
  client_name: z.string(),
  description: z.string().nullable().optional(),
  order_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  contact_id: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  job_status: z.string(),
  complex_job: z.boolean().optional(),
  pricing_methodology: z.enum(['fixed_price', 'time_materials']),
  created_at: z.string(),
  updated_at: z.string(),
  delivery_date: z.string().nullable().optional(),
  quote_acceptance_date: z.string().nullable().optional(),
  quoted: z.boolean().optional(),
  invoiced: z.boolean().optional(),
  paid: z.boolean().optional(),
  charge_out_rate: z.string().optional(),

  latest_estimate_pricing: JobPricingSchema.optional(),
  latest_quote_pricing: JobPricingSchema.optional(),
  latest_reality_pricing: JobPricingSchema.optional(),

  latest_estimate: CostSetSchema.nullable().optional(),
  latest_quote: CostSetSchema.nullable().optional(),
  latest_actual: CostSetSchema.nullable().optional(),

  quote_sheet: QuoteSheetSchema.nullable().optional(),

  latest_pricings: z
    .object({
      estimate: JobPricingSchema.nullable().optional(),
      quote: JobPricingSchema.nullable().optional(),
      reality: JobPricingSchema.nullable().optional(),
    })
    .optional(),

  company_defaults: z
    .object({
      materials_markup: z.number(),
      time_markup: z.number(),
      charge_out_rate: z.number(),
      wage_rate: z.number(),
    })
    .nullable()
    .optional(),
  events: z.array(JobEventSchema).optional(),
  invoice: InvoiceSchema.nullable().optional(),
  quote: QuoteSchema.nullable().optional(),
})

export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
})

export const JobUpdateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    job: JobDetailSchema,
    latest_pricings: z
      .object({
        estimate: JobPricingSchema.nullable().optional(),
        quote: JobPricingSchema.nullable().optional(),
        reality: JobPricingSchema.nullable().optional(),
      })
      .optional(),
    events: z.array(JobEventSchema).optional(),
    company_defaults: z
      .object({
        materials_markup: z.number(),
        time_markup: z.number(),
        charge_out_rate: z.number(),
        wage_rate: z.number(),
      })
      .optional(),
  }),
  message: z.string().optional(),
})

export const TimeEntryCreateSchema = z.object({
  job_pricing_id: z.string(),
  description: z.string(),
  items: z.number().positive().default(1),
  minutes_per_item: z.number().positive(),
  wage_rate: z.number().nonnegative().optional(),
  charge_out_rate: z.number().nonnegative().optional(),
  staff_id: z.string().optional(),
})

export const MaterialEntryCreateSchema = z.object({
  job_pricing_id: z.string(),
  description: z.string(),
  quantity: z.number().positive(),
  unit_cost: z.number().nonnegative(),
  unit_revenue: z.number().nonnegative(),
  item_code: z.string().optional(),
  comments: z.string().optional(),
})

export const AdjustmentEntryCreateSchema = z.object({
  job_pricing_id: z.string(),
  description: z.string(),
  cost_adjustment: z.number(),
  price_adjustment: z.number(),
  comments: z.string().optional(),
})

export const JobFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  size: z.number().nullable(),
  mime_type: z.string().nullable(),
  uploaded_at: z.string(),
  print_on_jobsheet: z.boolean(),
  download_url: z.string().url(),
  thumbnail_url: z.string().url().nullable(),
  status: z.enum(['active', 'deleted']),
})

export const FileListResponseSchema = z
  .array(JobFileSchema)
  .describe('List of files associated with a job')

export const UploadFilesResponseSchema = z
  .object({
    status: z.string(),
    uploaded: z.array(JobFileSchema),
    message: z.string().optional(),
    errors: z.array(z.string()).optional(),
  })
  .describe('Response from file upload endpoint')

export type QuoteSheet = z.infer<typeof QuoteSheetSchema>
export type JobPricing = z.infer<typeof JobPricingSchema>
export type CompanyDefaults = z.infer<typeof CompanyDefaultsSchema>
export type JobDetail = z.infer<typeof JobDetailSchema>
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>
export type JobUpdateResponse = z.infer<typeof JobUpdateResponseSchema>
export type TimeEntryCreate = z.infer<typeof TimeEntryCreateSchema>
export type MaterialEntryCreate = z.infer<typeof MaterialEntryCreateSchema>
export type AdjustmentEntryCreate = z.infer<typeof AdjustmentEntryCreateSchema>
export type JobEvent = z.infer<typeof JobEventSchema>
export type FileListResponse = z.infer<typeof FileListResponseSchema>
export type JobFile = z.infer<typeof JobFileSchema>
