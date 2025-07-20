import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'
import axios from 'axios'

// Import configured axios instance
import '@/plugins/axios'

// Get API base URL without importing plugins to avoid circular dependency
function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  return 'http://localhost:8001'
}

const KPIProfitBreakdown = z
  .object({ labor_profit: z.number(), material_profit: z.number(), adjustment_profit: z.number() })
  .passthrough()
const KPIJobBreakdown = z
  .object({
    job_id: z.string(),
    job_number: z.string(),
    job_name: z.string(),
    client_name: z.string(),
    billable_hours: z.number(),
    revenue: z.number(),
    cost: z.number(),
    profit: z.number(),
  })
  .passthrough()
const KPIDetails = z
  .object({
    time_revenue: z.number(),
    material_revenue: z.number(),
    adjustment_revenue: z.number(),
    total_revenue: z.number(),
    staff_cost: z.number(),
    material_cost: z.number(),
    adjustment_cost: z.number(),
    total_cost: z.number(),
    profit_breakdown: KPIProfitBreakdown,
    job_breakdown: z.array(KPIJobBreakdown),
  })
  .passthrough()
const KPIDayData = z
  .object({
    date: z.string(),
    day: z.number().int(),
    holiday: z.boolean(),
    holiday_name: z.string().optional(),
    billable_hours: z.number(),
    total_hours: z.number(),
    shop_hours: z.number(),
    shop_percentage: z.number(),
    gross_profit: z.number(),
    color: z.string(),
    gp_target_achievement: z.number(),
    details: KPIDetails,
  })
  .passthrough()
const KPIMonthlyTotals = z
  .object({
    billable_hours: z.number(),
    total_hours: z.number(),
    shop_hours: z.number(),
    gross_profit: z.number(),
    days_green: z.number().int(),
    days_amber: z.number().int(),
    days_red: z.number().int(),
    labour_green_days: z.number().int(),
    labour_amber_days: z.number().int(),
    labour_red_days: z.number().int(),
    profit_green_days: z.number().int(),
    profit_amber_days: z.number().int(),
    profit_red_days: z.number().int(),
    working_days: z.number().int(),
    elapsed_workdays: z.number().int(),
    remaining_workdays: z.number().int(),
    time_revenue: z.number(),
    material_revenue: z.number(),
    adjustment_revenue: z.number(),
    staff_cost: z.number(),
    material_cost: z.number(),
    adjustment_cost: z.number(),
    material_profit: z.number(),
    adjustment_profit: z.number(),
    total_revenue: z.number(),
    total_cost: z.number(),
    elapsed_target: z.number(),
    net_profit: z.number(),
    billable_percentage: z.number(),
    shop_percentage: z.number(),
    avg_daily_gp: z.number(),
    avg_daily_gp_so_far: z.number(),
    avg_billable_hours_so_far: z.number(),
    color_hours: z.string(),
    color_gp: z.string(),
    color_shop: z.string(),
  })
  .passthrough()
const KPIThresholds = z
  .object({
    billable_threshold_green: z.number(),
    billable_threshold_amber: z.number(),
    daily_gp_target: z.number(),
    shop_hours_target: z.number(),
  })
  .passthrough()
const KPICalendarData = z
  .object({
    calendar_data: z.record(KPIDayData),
    monthly_totals: KPIMonthlyTotals,
    thresholds: KPIThresholds,
    year: z.number().int(),
    month: z.number().int(),
  })
  .passthrough()
const JobAgingFinancialData = z
  .object({ estimate_total: z.number(), quote_total: z.number(), actual_total: z.number() })
  .passthrough()
const JobAgingTimingData = z
  .object({
    created_date: z.string(),
    created_days_ago: z.number().int(),
    days_in_current_status: z.number().int(),
    last_activity_date: z.string().datetime({ offset: true }).nullable(),
    last_activity_days_ago: z.number().int().nullable(),
    last_activity_type: z.string().nullish(),
    last_activity_description: z.string().nullish(),
  })
  .passthrough()
const JobAgingJobData = z
  .object({
    id: z.string(),
    job_number: z.string(),
    name: z.string(),
    client_name: z.string(),
    status: z.string(),
    status_display: z.string(),
    financial_data: JobAgingFinancialData,
    timing_data: JobAgingTimingData,
  })
  .passthrough()
const JobAgingResponse = z.object({ jobs: z.array(JobAgingJobData) }).passthrough()
const Staff = z
  .object({
    id: z.string().uuid(),
    password: z.string().max(128).optional(),
    last_login: z.string().datetime({ offset: true }).nullish(),
    is_superuser: z.boolean().optional(),
    icon: z.string().url().nullish(),
    password_needs_reset: z.boolean().optional(),
    email: z.string().max(254).email(),
    first_name: z.string().max(30),
    last_name: z.string().max(30),
    preferred_name: z.string().max(30).nullish(),
    wage_rate: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    ims_payroll_id: z.string().max(100).nullish(),
    raw_ims_data: z.unknown().nullish(),
    is_active: z.boolean().optional(),
    is_staff: z.boolean().optional(),
    date_joined: z.string().datetime({ offset: true }).optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
    updated_at: z.string().datetime({ offset: true }),
    hours_mon: z
      .string()
      .regex(/^-?\d{0,2}(?:\.\d{0,2})?$/)
      .optional(),
    hours_tue: z
      .string()
      .regex(/^-?\d{0,2}(?:\.\d{0,2})?$/)
      .optional(),
    hours_wed: z
      .string()
      .regex(/^-?\d{0,2}(?:\.\d{0,2})?$/)
      .optional(),
    hours_thu: z
      .string()
      .regex(/^-?\d{0,2}(?:\.\d{0,2})?$/)
      .optional(),
    hours_fri: z
      .string()
      .regex(/^-?\d{0,2}(?:\.\d{0,2})?$/)
      .optional(),
    hours_sat: z
      .string()
      .regex(/^-?\d{0,2}(?:\.\d{0,2})?$/)
      .optional(),
    hours_sun: z
      .string()
      .regex(/^-?\d{0,2}(?:\.\d{0,2})?$/)
      .optional(),
    groups: z.array(z.number().int()).optional(),
    user_permissions: z.array(z.number().int()).optional(),
  })
  .passthrough()
const PatchedStaff = z
  .object({
    id: z.string().uuid(),
    password: z.string().max(128),
    last_login: z.string().datetime({ offset: true }).nullable(),
    is_superuser: z.boolean(),
    icon: z.string().url().nullable(),
    password_needs_reset: z.boolean(),
    email: z.string().max(254).email(),
    first_name: z.string().max(30),
    last_name: z.string().max(30),
    preferred_name: z.string().max(30).nullable(),
    wage_rate: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    ims_payroll_id: z.string().max(100).nullable(),
    raw_ims_data: z.unknown().nullable(),
    is_active: z.boolean(),
    is_staff: z.boolean(),
    date_joined: z.string().datetime({ offset: true }),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    hours_mon: z.string().regex(/^-?\d{0,2}(?:\.\d{0,2})?$/),
    hours_tue: z.string().regex(/^-?\d{0,2}(?:\.\d{0,2})?$/),
    hours_wed: z.string().regex(/^-?\d{0,2}(?:\.\d{0,2})?$/),
    hours_thu: z.string().regex(/^-?\d{0,2}(?:\.\d{0,2})?$/),
    hours_fri: z.string().regex(/^-?\d{0,2}(?:\.\d{0,2})?$/),
    hours_sat: z.string().regex(/^-?\d{0,2}(?:\.\d{0,2})?$/),
    hours_sun: z.string().regex(/^-?\d{0,2}(?:\.\d{0,2})?$/),
    groups: z.array(z.number().int()),
    user_permissions: z.array(z.number().int()),
  })
  .partial()
  .passthrough()
const KanbanStaff = z
  .object({
    id: z.string().uuid(),
    first_name: z.string().max(30),
    last_name: z.string().max(30),
    icon: z.string().nullable(),
    display_name: z.string(),
  })
  .passthrough()
const CustomTokenObtainPair = z
  .object({ username: z.string().nullish(), password: z.string().nullish() })
  .passthrough()
const TokenRefresh = z.object({ access: z.string(), refresh: z.string() }).passthrough()
const TokenVerify = z.object({ token: z.string() }).passthrough()
const UserProfile = z
  .object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    preferred_name: z.string().nullable(),
    fullName: z.string(),
    is_active: z.boolean(),
    is_staff: z.boolean(),
  })
  .passthrough()
const ProviderTypeEnum = z.enum(['Claude', 'Gemini', 'Mistral'])
const AIProvider = z
  .object({
    id: z.number().int(),
    name: z.string().max(100),
    provider_type: ProviderTypeEnum,
    model_name: z.string().max(100).optional(),
    default: z.boolean().optional(),
  })
  .passthrough()
const CompanyDefaults = z
  .object({
    company_name: z.string().max(255),
    ai_providers: z.array(AIProvider),
    is_primary: z.boolean().optional(),
    time_markup: z
      .string()
      .regex(/^-?\d{0,3}(?:\.\d{0,2})?$/)
      .optional(),
    materials_markup: z
      .string()
      .regex(/^-?\d{0,3}(?:\.\d{0,2})?$/)
      .optional(),
    charge_out_rate: z
      .string()
      .regex(/^-?\d{0,4}(?:\.\d{0,2})?$/)
      .optional(),
    wage_rate: z
      .string()
      .regex(/^-?\d{0,4}(?:\.\d{0,2})?$/)
      .optional(),
    starting_job_number: z.number().int().gte(-2147483648).lte(2147483647).optional(),
    starting_po_number: z.number().int().gte(-2147483648).lte(2147483647).optional(),
    po_prefix: z.string().max(10).optional(),
    master_quote_template_url: z.string().max(200).url().nullish(),
    master_quote_template_id: z.string().max(100).nullish(),
    gdrive_quotes_folder_url: z.string().max(200).url().nullish(),
    gdrive_quotes_folder_id: z.string().max(100).nullish(),
    xero_tenant_id: z.string().max(100).nullish(),
    mon_start: z.string().optional(),
    mon_end: z.string().optional(),
    tue_start: z.string().optional(),
    tue_end: z.string().optional(),
    wed_start: z.string().optional(),
    wed_end: z.string().optional(),
    thu_start: z.string().optional(),
    thu_end: z.string().optional(),
    fri_start: z.string().optional(),
    fri_end: z.string().optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    last_xero_sync: z.string().datetime({ offset: true }).nullish(),
    last_xero_deep_sync: z.string().datetime({ offset: true }).nullish(),
    shop_client_name: z.string().max(255).nullish(),
    billable_threshold_green: z
      .string()
      .regex(/^-?\d{0,3}(?:\.\d{0,2})?$/)
      .optional(),
    billable_threshold_amber: z
      .string()
      .regex(/^-?\d{0,3}(?:\.\d{0,2})?$/)
      .optional(),
    daily_gp_target: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    shop_hours_target_percentage: z
      .string()
      .regex(/^-?\d{0,3}(?:\.\d{0,2})?$/)
      .optional(),
  })
  .passthrough()
const PatchedCompanyDefaults = z
  .object({
    company_name: z.string().max(255),
    ai_providers: z.array(AIProvider),
    is_primary: z.boolean(),
    time_markup: z.string().regex(/^-?\d{0,3}(?:\.\d{0,2})?$/),
    materials_markup: z.string().regex(/^-?\d{0,3}(?:\.\d{0,2})?$/),
    charge_out_rate: z.string().regex(/^-?\d{0,4}(?:\.\d{0,2})?$/),
    wage_rate: z.string().regex(/^-?\d{0,4}(?:\.\d{0,2})?$/),
    starting_job_number: z.number().int().gte(-2147483648).lte(2147483647),
    starting_po_number: z.number().int().gte(-2147483648).lte(2147483647),
    po_prefix: z.string().max(10),
    master_quote_template_url: z.string().max(200).url().nullable(),
    master_quote_template_id: z.string().max(100).nullable(),
    gdrive_quotes_folder_url: z.string().max(200).url().nullable(),
    gdrive_quotes_folder_id: z.string().max(100).nullable(),
    xero_tenant_id: z.string().max(100).nullable(),
    mon_start: z.string(),
    mon_end: z.string(),
    tue_start: z.string(),
    tue_end: z.string(),
    wed_start: z.string(),
    wed_end: z.string(),
    thu_start: z.string(),
    thu_end: z.string(),
    fri_start: z.string(),
    fri_end: z.string(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    last_xero_sync: z.string().datetime({ offset: true }).nullable(),
    last_xero_deep_sync: z.string().datetime({ offset: true }).nullable(),
    shop_client_name: z.string().max(255).nullable(),
    billable_threshold_green: z.string().regex(/^-?\d{0,3}(?:\.\d{0,2})?$/),
    billable_threshold_amber: z.string().regex(/^-?\d{0,3}(?:\.\d{0,2})?$/),
    daily_gp_target: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    shop_hours_target_percentage: z.string().regex(/^-?\d{0,3}(?:\.\d{0,2})?$/),
  })
  .partial()
  .passthrough()
const AIProviderCreateUpdate = z
  .object({
    id: z.number().int(),
    name: z.string().max(100),
    provider_type: ProviderTypeEnum,
    model_name: z.string().max(100).optional(),
    default: z.boolean().optional(),
    api_key: z.string().optional(),
    company: z.string(),
  })
  .passthrough()
const PatchedAIProviderCreateUpdate = z
  .object({
    id: z.number().int(),
    name: z.string().max(100),
    provider_type: ProviderTypeEnum,
    model_name: z.string().max(100),
    default: z.boolean(),
    api_key: z.string(),
    company: z.string(),
  })
  .partial()
  .passthrough()
const ClientContactResult = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    position: z.string(),
    is_primary: z.boolean(),
  })
  .passthrough()
const ClientContactsResponse = z.object({ results: z.array(ClientContactResult) }).passthrough()
const ClientListResponse = z.object({ id: z.string(), name: z.string() }).passthrough()
const ClientContactCreateRequest = z
  .object({
    client_id: z.string().uuid(),
    name: z.string().max(255),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    position: z.string().max(255).optional(),
    is_primary: z.boolean().optional().default(false),
    notes: z.string().optional(),
  })
  .passthrough()
const ClientContactCreateResponse = z
  .object({
    success: z.boolean(),
    contact: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      position: z.string().optional(),
      is_primary: z.boolean(),
      notes: z.string().optional(),
    }),
    message: z.string(),
  })
  .passthrough()
const ClientCreateRequest = z
  .object({
    name: z.string().max(255),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    is_account_customer: z.boolean().optional().default(true),
  })
  .passthrough()
const ClientSearchResult = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    is_account_customer: z.boolean(),
    xero_contact_id: z.string(),
    last_invoice_date: z.string(),
    total_spend: z.string(),
    raw_json: z.unknown().optional(),
  })
  .passthrough()
const ClientSearchResponse = z.object({ results: z.array(ClientSearchResult) }).passthrough()
const ClientCreateResponse = z
  .object({
    success: z.boolean(),
    client: ClientSearchResult,
    message: z.string(),
  })
  .passthrough()
const JobFileStatusEnum = z.enum(['active', 'deleted'])
const JobFile = z
  .object({
    id: z.string().uuid(),
    filename: z.string().max(255),
    size: z.number().int().nullable(),
    mime_type: z.string().max(100).optional(),
    uploaded_at: z.string().datetime({ offset: true }),
    print_on_jobsheet: z.boolean().optional(),
    download_url: z.string(),
    thumbnail_url: z.string().nullable(),
    status: JobFileStatusEnum.optional(),
  })
  .passthrough()
const UploadedFile = z
  .object({
    id: z.string(),
    filename: z.string(),
    file_path: z.string(),
    print_on_jobsheet: z.boolean(),
  })
  .passthrough()
const JobFileUploadSuccessResponse = z
  .object({
    status: z.string().optional().default('success'),
    uploaded: z.array(UploadedFile),
    message: z.string(),
  })
  .passthrough()
const JobFileUpdateSuccessResponse = z
  .object({
    status: z.string().optional().default('success'),
    message: z.string(),
    print_on_jobsheet: z.boolean(),
  })
  .passthrough()
const AssignJobResponse = z
  .object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  .passthrough()
const AssignJobRequest = z.object({ job_id: z.string(), staff_id: z.string() }).passthrough()
const CompleteJob = z
  .object({
    id: z.string().uuid(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    name: z.string().max(100),
    client_name: z.string(),
    updated_at: z.string().datetime({ offset: true }),
    job_status: z.string(),
  })
  .passthrough()
const PaginatedCompleteJobList = z
  .object({
    count: z.number().int(),
    next: z.string().url().nullish(),
    previous: z.string().url().nullish(),
    results: z.array(CompleteJob),
  })
  .passthrough()
const ArchiveJobsRequest = z.object({ ids: z.array(z.string()) }).passthrough()
const ArchiveJobsResponse = z.object({ success: z.boolean(), message: z.string() }).passthrough()
const JobQuoteChatHistoryResponse = z
  .object({ success: z.boolean(), data: z.object({}).partial().passthrough() })
  .passthrough()
const RoleEnum = z.enum(['user', 'assistant'])
const JobQuoteChat = z
  .object({
    message_id: z.string().max(100),
    role: RoleEnum,
    content: z.string(),
    metadata: z.unknown().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough()
const PatchedJobQuoteChatUpdate = z
  .object({ content: z.string(), metadata: z.unknown() })
  .partial()
  .passthrough()
const JobQuoteChatUpdate = z
  .object({ content: z.string(), metadata: z.unknown() })
  .partial()
  .passthrough()
const JobQuoteChatInteractionRequest = z.object({ message: z.string().max(5000) }).passthrough()
const JobReorderRequest = z
  .object({
    before_id: z.string().uuid().nullable(),
    after_id: z.string().uuid().nullable(),
    status: z.string().nullable(),
  })
  .partial()
  .passthrough()
const JobStatusUpdateRequest = z.object({ status: z.string() }).passthrough()
const KanbanJobPerson = z
  .object({ id: z.string().uuid(), display_name: z.string(), icon: z.string().url().nullable() })
  .passthrough()
const KanbanJob = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    job_number: z.union([z.string(), z.number()]).transform((val) => String(val)),
    client_name: z.string(),
    contact_person: z.string(),
    people: z.array(KanbanJobPerson),
    status: z.string(),
    status_key: z.string(),
    paid: z.boolean(),
    created_by_id: z.string().uuid().nullable(),
    created_at: z.string().nullable(),
    priority: z.union([z.number().int(), z.number()]).transform((val) => Math.round(val)),
  })
  .passthrough()
const AdvancedSearchResponse = z
  .object({
    success: z.boolean().default(true),
    jobs: z.array(KanbanJob),
    total: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const FetchAllJobsResponse = z
  .object({
    success: z.boolean().default(true),
    active_jobs: z.array(KanbanJob),
    archived_jobs: z.array(KanbanJob),
    total_archived: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const KanbanColumnJob = z
  .object({
    id: z.string(),
    job_number: z.string(),
    name: z.string(),
    description: z.string(),
    client_name: z.string(),
    contact_person: z.string(),
    people: z.array(z.object({}).partial().passthrough()),
    status: z.string(),
    status_key: z.string(),
    paid: z.boolean(),
    created_by_id: z.string().nullable(),
    created_at: z.string().nullable(),
    priority: z.number().int(),
    badge_label: z.string(),
    badge_color: z.string(),
  })
  .passthrough()
const FetchJobsByColumnResponse = z
  .object({
    success: z.boolean().default(true),
    jobs: z.array(KanbanColumnJob),
    total: z.number().int(),
    filtered_count: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const FetchJobsResponse = z
  .object({
    success: z.boolean().default(true),
    jobs: z.array(KanbanJob),
    total: z.number().int(),
    filtered_count: z.number().int(),
    error: z.string(),
  })
  .partial()
  .passthrough()
const FetchStatusValuesResponse = z
  .object({
    success: z.boolean().default(true),
    statuses: z.record(z.string()),
    tooltips: z.record(z.string()),
    error: z.string(),
  })
  .partial()
  .passthrough()
const WorkshopPDFResponse = z
  .object({ status: z.string(), message: z.string() })
  .partial()
  .passthrough()
const Kind332Enum = z.enum(['time', 'material', 'adjust'])
const PatchedCostLineCreateUpdate = z
  .object({
    kind: Kind332Enum,
    desc: z.string().max(255),
    quantity: z.string().regex(/^-?\d{0,7}(?:\.\d{0,3})?$/),
    unit_cost: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    unit_rev: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    ext_refs: z.unknown(),
    meta: z.unknown(),
  })
  .partial()
  .passthrough()
const CostLineCreateUpdate = z
  .object({
    kind: Kind332Enum,
    desc: z.string().max(255),
    quantity: z
      .string()
      .regex(/^-?\d{0,7}(?:\.\d{0,3})?$/)
      .optional(),
    unit_cost: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    unit_rev: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    ext_refs: z.unknown().optional(),
    meta: z.unknown().optional(),
  })
  .passthrough()
const JobCreateRequest = z
  .object({
    name: z.string().max(255),
    client_id: z.string().uuid(),
    description: z.string().optional(),
    order_number: z.string().optional(),
    notes: z.string().optional(),
    contact_id: z.string().uuid().nullish(),
  })
  .passthrough()
const JobCreateResponse = z
  .object({
    success: z.boolean(),
    job_id: z.string().uuid(),
    job_number: z.string(),
    message: z.string(),
  })
  .passthrough()
const PricingMethodologyEnum = z.enum(['time_materials', 'fixed_price'])
const QuoteSpreadsheet = z
  .object({
    id: z.string().uuid(),
    sheet_id: z.string().max(100),
    sheet_url: z.string().max(500).url().nullish(),
    tab: z.string().max(100).nullish(),
    job_id: z.string(),
    job_number: z.string(),
    job_name: z.string(),
  })
  .passthrough()
const Job = z
  .object({
    id: z.string().uuid(),
    name: z.string().max(100),
    client_id: z.string().uuid(),
    client_name: z.string(),
    contact_id: z.string().uuid().nullish(),
    contact_name: z.string().nullish(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    notes: z.string().nullish(),
    order_number: z.string().max(100).nullish(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    description: z.string().nullish(),
    latest_estimate: z.object({}).partial().passthrough().nullable(),
    latest_quote: z.object({}).partial().passthrough().nullable(),
    latest_actual: z.object({}).partial().passthrough().nullable(),
    job_status: z.string(),
    delivery_date: z.string().nullish(),
    paid: z.boolean().optional(),
    quote_acceptance_date: z.string().datetime({ offset: true }).nullish(),
    job_is_valid: z.boolean().optional(),
    job_files: z.array(JobFile).optional(),
    charge_out_rate: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    pricing_methodology: PricingMethodologyEnum.optional(),
    quote_sheet: QuoteSpreadsheet.nullable(),
    quoted: z.boolean(),
    invoiced: z.boolean(),
    quote: z.object({}).partial().passthrough().nullable(),
    invoice: z.object({}).partial().passthrough().nullable(),
  })
  .passthrough()
const JobUpdateRequest = z
  .object({
    name: z.string().max(100).optional(),
    client_id: z.string().uuid().optional(),
    contact_id: z.string().uuid().nullish(),
    notes: z.string().nullish(),
    order_number: z.string().max(100).nullish(),
    description: z.string().nullish(),
    job_status: z.string().optional(),
    delivery_date: z.string().nullish(),
    paid: z.boolean().optional(),
    charge_out_rate: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    pricing_methodology: PricingMethodologyEnum.optional(),
  })
  .passthrough()
const JobDetailResponse = z
  .object({
    success: z.boolean().optional().default(true),
    data: z.object({ job: Job }).passthrough(),
  })
  .passthrough()
const JobDeleteResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .passthrough()
const JobRestErrorResponse = z.object({ error: z.string() }).passthrough()
const JobEventCreateRequest = z.object({ description: z.string().max(500) }).passthrough()
const JobEventCreateResponse = z
  .object({ success: z.boolean(), event: z.object({}).passthrough() })
  .passthrough()
const CostSetKindEnum = z.enum(['estimate', 'quote', 'actual'])
const CostLine = z
  .object({
    id: z.number().int(),
    kind: Kind332Enum,
    desc: z.string().max(255),
    quantity: z
      .string()
      .regex(/^-?\d{0,7}(?:\.\d{0,3})?$/)
      .optional(),
    unit_cost: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    unit_rev: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    total_cost: z.number(),
    total_rev: z.number(),
    ext_refs: z.unknown().optional(),
    meta: z.unknown().optional(),
  })
  .passthrough()
const CostSet = z
  .object({
    id: z.number().int(),
    kind: CostSetKindEnum,
    rev: z.number().int(),
    summary: z.unknown(),
    created: z.string().datetime({ offset: true }),
    cost_lines: z.array(CostLine),
  })
  .passthrough()
const QuoteImportStatusResponse = z
  .object({
    job_id: z.string(),
    job_name: z.string(),
    has_quote: z.boolean(),
    quote: CostSet.optional(),
    revision: z.number().int().optional(),
    created: z.string().datetime({ offset: true }).optional(),
    summary: z.unknown().optional(),
  })
  .passthrough()
const QuoteRevisionRequestSerializer = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .passthrough()
const QuoteRevisionResponseSerializer = z
  .object({
    success: z.boolean(),
    message: z.string(),
    quote_revision: z.number().int(),
    archived_cost_lines_count: z.number().int(),
    job_id: z.string(),
  })
  .passthrough()
const QuoteAcceptResponse = z
  .object({
    success: z.boolean(),
    job_id: z.string(),
    quote_acceptance_date: z.string(),
    message: z.string(),
  })
  .passthrough()
const QuoteRevisionsListResponse = z
  .object({
    job_id: z.string(),
    job_number: z.string(),
    current_cost_set_rev: z.number().int(),
    total_revisions: z.number().int(),
    revisions: z.array(
      z.object({
        quote_revision: z.number().int(),
        archived_at: z.string(),
        reason: z.string().nullable(),
        summary: z.object({
          cost: z.number(),
          rev: z.number(),
          hours: z.number(),
        }),
        cost_lines: z.array(
          z.object({
            id: z.string(),
            kind: z.string(),
            desc: z.string(),
            quantity: z.number(),
            unit_cost: z.number(),
            unit_rev: z.number(),
            total_cost: z.number(),
            total_rev: z.number(),
            ext_refs: z.object({}).passthrough(),
            meta: z.object({}).passthrough(),
          }),
        ),
      }),
    ),
  })
  .passthrough()
const DraftLine = z
  .object({
    kind: z.string(),
    desc: z.string(),
    quantity: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    unit_cost: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    unit_rev: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    total_cost: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    total_rev: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
  })
  .passthrough()
const QuoteChanges = z
  .object({
    additions: z.array(DraftLine),
    updates: z.array(DraftLine),
    deletions: z.array(DraftLine),
  })
  .passthrough()
const ApplyQuoteResponse = z
  .object({
    success: z.boolean(),
    cost_set: CostSet.nullish(),
    draft_lines: z.array(DraftLine).optional(),
    changes: QuoteChanges.optional(),
    error: z.string().optional(),
  })
  .passthrough()
const LinkQuoteSheetRequest = z.object({ template_url: z.string().url() }).partial().passthrough()
const PreviewQuoteResponse = z
  .object({
    success: z.boolean(),
    draft_lines: z.array(DraftLine),
    changes: QuoteChanges,
    message: z.string(),
  })
  .partial()
  .passthrough()
const JobFileThumbnailErrorResponse = z
  .object({ status: z.string().optional().default('error'), message: z.string() })
  .passthrough()
const JobFileUploadViewResponse = z
  .object({
    status: z.string().optional().default('success'),
    uploaded: z.array(JobFile),
    message: z.string(),
  })
  .passthrough()
const MonthEndJobHistory = z
  .object({ date: z.string(), total_hours: z.number(), total_dollars: z.number() })
  .passthrough()
const MonthEndJob = z
  .object({
    job_id: z.string().uuid(),
    job_number: z.string(),
    job_name: z.string(),
    client_name: z.string(),
    history: z.array(MonthEndJobHistory),
    total_hours: z.number(),
    total_dollars: z.number(),
  })
  .passthrough()
const MonthEndStockHistory = z
  .object({ date: z.string(), material_line_count: z.number().int(), material_cost: z.number() })
  .passthrough()
const MonthEndStockJob = z
  .object({
    job_id: z.string().uuid(),
    job_number: z.string(),
    job_name: z.string(),
    history: z.array(MonthEndStockHistory),
  })
  .passthrough()
const MonthEndGetResponse = z
  .object({ jobs: z.array(MonthEndJob), stock_job: MonthEndStockJob })
  .passthrough()
const MonthEndPostRequest = z.object({ job_ids: z.array(z.string().uuid()) }).passthrough()
const MonthEndPostResponse = z
  .object({ processed: z.array(z.string().uuid()), errors: z.array(z.string()) })
  .passthrough()
const TimesheetCostLine = z
  .object({
    id: z.number().int(),
    kind: Kind332Enum,
    desc: z.string(),
    quantity: z.string().regex(/^-?\d{0,7}(?:\.\d{0,3})?$/),
    unit_cost: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    unit_rev: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    total_cost: z.number(),
    total_rev: z.number(),
    ext_refs: z.unknown(),
    meta: z.unknown(),
    job_id: z.string(),
    job_number: z.string(),
    job_name: z.string(),
    client_name: z.string(),
    charge_out_rate: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    wage_rate: z.number(),
  })
  .passthrough()
const ModernTimesheetStaff = z
  .object({ id: z.string().uuid(), name: z.string(), firstName: z.string(), lastName: z.string() })
  .passthrough()
const ModernTimesheetSummary = z
  .object({
    total_hours: z.number(),
    billable_hours: z.number(),
    non_billable_hours: z.number(),
    total_cost: z.number(),
    total_revenue: z.number(),
    entry_count: z.number().int(),
  })
  .passthrough()
const ModernTimesheetEntryGetResponse = z
  .object({
    cost_lines: z.array(TimesheetCostLine),
    staff: ModernTimesheetStaff,
    date: z.string(),
    summary: ModernTimesheetSummary,
  })
  .passthrough()
const ModernTimesheetEntryPostResponse = z
  .object({
    success: z.boolean(),
    cost_line_id: z.string().uuid().optional(),
    message: z.string().optional(),
  })
  .passthrough()
const ModernTimesheetJobGetResponse = z
  .object({ jobs: z.array(Job), total_count: z.number().int() })
  .passthrough()
const ModernTimesheetDayGetResponse = z
  .object({
    entries: z.array(TimesheetCostLine),
    summary: ModernTimesheetSummary,
    date: z.string(),
  })
  .passthrough()
const DeliveryReceiptAllocation = z
  .object({ job_id: z.string().uuid(), quantity: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/) })
  .passthrough()
const DeliveryReceiptLine = z
  .object({
    total_received: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    allocations: z.array(DeliveryReceiptAllocation),
  })
  .passthrough()
const DeliveryReceiptRequest = z
  .object({ purchase_order_id: z.string().uuid(), allocations: z.record(DeliveryReceiptLine) })
  .passthrough()
const DeliveryReceiptResponse = z
  .object({ success: z.boolean(), error: z.string().optional() })
  .passthrough()
const PurchaseOrderEmailRequest = z
  .object({ recipient_email: z.string().email(), message: z.string().max(1000) })
  .partial()
  .passthrough()
const PurchaseOrderPDFResponse = z
  .object({ success: z.boolean(), message: z.string() })
  .partial()
  .passthrough()
const StatusE5cEnum = z.enum([
  'draft',
  'awaiting_approval',
  'approved',
  'in_progress',
  'unusual',
  'recently_completed',
  'special',
  'archived',
])
const JobForPurchasing = z
  .object({
    id: z.string().uuid(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    name: z.string().max(100),
    client_name: z.string(),
    status: StatusE5cEnum.optional(),
    is_stock_holding: z.boolean(),
    job_display_name: z.string(),
  })
  .passthrough()
const AllJobsResponse = z
  .object({
    success: z.boolean(),
    jobs: z.array(JobForPurchasing),
    stock_holding_job_id: z.string(),
  })
  .passthrough()
const PurchasingJobsResponse = z
  .object({ jobs: z.array(JobForPurchasing), total_count: z.number().int() })
  .passthrough()
const PurchaseOrderList = z
  .object({
    id: z.string().uuid(),
    po_number: z.string(),
    status: z.string(),
    order_date: z.string(),
    supplier: z.string(),
    supplier_id: z.string().uuid().nullable(),
  })
  .passthrough()
const PurchaseOrderLineCreate = z
  .object({
    job_id: z.string().uuid().nullable(),
    description: z.string().max(255),
    quantity: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .default('0.00'),
    unit_cost: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .nullable(),
    price_tbc: z.boolean().default(false),
    item_code: z.string().max(100),
    metal_type: z.string().max(100),
    alloy: z.string().max(100),
    specifics: z.string().max(255),
    location: z.string().max(255),
    dimensions: z.string().max(255),
  })
  .partial()
  .passthrough()
const PurchaseOrderLineUpdate = z
  .object({
    id: z.string().uuid().nullable(),
    job_id: z.string().uuid().nullable(),
    description: z.string().max(255),
    quantity: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .default('0.00'),
    unit_cost: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .nullable(),
    price_tbc: z.boolean().default(false),
    item_code: z.string().max(100),
    metal_type: z.string().max(100),
    alloy: z.string().max(100),
    specifics: z.string().max(255),
    location: z.string().max(255),
    dimensions: z.string().max(255),
  })
  .partial()
  .passthrough()
const PurchaseOrderCreate = z
  .object({
    supplier_id: z.string().uuid().nullable(),
    reference: z.string().max(255),
    order_date: z.string().nullable(),
    expected_delivery: z.string().nullable(),
    lines: z.array(PurchaseOrderLineCreate),
  })
  .partial()
  .passthrough()
const PurchaseOrderDetailStatusEnum = z.enum([
  'draft',
  'submitted',
  'partially_received',
  'fully_received',
  'deleted',
])
const MetalTypeEnum = z.enum([
  'stainless_steel',
  'mild_steel',
  'aluminum',
  'brass',
  'copper',
  'titanium',
  'zinc',
  'galvanized',
  'unspecified',
  'other',
])
const BlankEnum = z.unknown()
const NullEnum = z.unknown()
const PurchaseOrderLine = z
  .object({
    id: z.string().uuid(),
    item_code: z.string().max(50).nullish(),
    description: z.string().max(200),
    quantity: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    received_quantity: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
    unit_cost: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .nullish(),
    price_tbc: z.boolean().optional(),
    metal_type: z.union([MetalTypeEnum, BlankEnum, NullEnum]).nullish(),
    alloy: z.string().max(50).nullish(),
    specifics: z.string().max(255).nullish(),
    location: z.string().max(255).nullish(),
    dimensions: z.string().max(255).nullish(),
    job_id: z.string().uuid().nullish(),
  })
  .passthrough()
const PurchaseOrderDetail = z
  .object({
    id: z.string().uuid(),
    po_number: z.string().max(50),
    reference: z.string().max(100).nullish(),
    supplier: z.string(),
    supplier_id: z.string().nullable(),
    supplier_has_xero_id: z.boolean(),
    status: PurchaseOrderDetailStatusEnum.optional(),
    order_date: z.string().optional(),
    expected_delivery: z.string().nullish(),
    lines: z.array(PurchaseOrderLine),
    online_url: z.string().max(500).url().nullish(),
    xero_id: z.string().uuid().nullish(),
  })
  .passthrough()
const PatchedPurchaseOrderUpdate = z
  .object({
    supplier_id: z.string().uuid().nullable(),
    reference: z.string().max(255),
    expected_delivery: z.string().nullable(),
    status: z.string().max(50),
    lines_to_delete: z.array(z.string().uuid()),
    lines: z.array(PurchaseOrderLineUpdate),
  })
  .partial()
  .passthrough()
const PurchaseOrderUpdate = z
  .object({
    supplier_id: z.string().uuid().nullable(),
    reference: z.string().max(255),
    expected_delivery: z.string().nullable(),
    status: z.string().max(50),
    lines_to_delete: z.array(z.string().uuid()),
    lines: z.array(PurchaseOrderLineUpdate),
  })
  .partial()
  .passthrough()
const TypeEnum = z.enum(['job', 'stock'])
const AllocationItem = z
  .object({
    type: TypeEnum,
    job_id: z.string().uuid(),
    job_name: z.string(),
    quantity: z.number(),
    retail_rate: z.number().optional().default(0),
    allocation_date: z.string().datetime({ offset: true }).nullable(),
    description: z.string(),
    stock_location: z.string().nullish(),
  })
  .passthrough()
const PurchaseOrderAllocationsResponse = z
  .object({ po_id: z.string().uuid(), allocations: z.record(z.array(AllocationItem)) })
  .passthrough()
const StockList = z
  .object({
    id: z.string().uuid(),
    description: z.string(),
    quantity: z.number(),
    unit_cost: z.number(),
    metal_type: z.string(),
    alloy: z.string().nullable(),
    specifics: z.string().nullable(),
    location: z.string(),
    source: z.string(),
    date: z.string().datetime({ offset: true }).nullable(),
    job_id: z.string().uuid().nullable(),
    notes: z.string(),
  })
  .passthrough()
const StockCreate = z
  .object({
    description: z.string().max(255),
    quantity: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    unit_cost: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    source: z.string().max(100),
    notes: z.string().max(500).optional(),
    metal_type: z.string().max(100).optional(),
    alloy: z.string().max(100).optional(),
    specifics: z.string().max(255).optional(),
    location: z.string().max(255).optional(),
  })
  .passthrough()
const StockConsumeRequest = z
  .object({ job_id: z.string().uuid(), quantity: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/) })
  .passthrough()
const StockConsumeResponse = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
    remaining_quantity: z
      .string()
      .regex(/^-?\d{0,8}(?:\.\d{0,2})?$/)
      .optional(),
  })
  .passthrough()
const XeroItem = z
  .object({
    code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    sales_details: z.object({}).partial().passthrough().optional(),
    purchase_details: z.object({}).partial().passthrough().optional(),
  })
  .passthrough()
const XeroItemListResponse = z
  .object({ items: z.array(XeroItem), total_count: z.number().int().optional() })
  .passthrough()
const DjangoJobExecutionStatusEnum = z.enum(['Started execution', 'Error!', 'Executed'])
const DjangoJobExecution = z
  .object({
    id: z.number().int(),
    job_id: z.string(),
    status: DjangoJobExecutionStatusEnum,
    run_time: z.string().datetime({ offset: true }),
    duration: z
      .string()
      .regex(/^-?\d{0,13}(?:\.\d{0,2})?$/)
      .nullish(),
    exception: z.string().max(1000).nullish(),
    traceback: z.string().nullish(),
  })
  .passthrough()
const DjangoJob = z
  .object({
    id: z.string().max(255),
    next_run_time: z.string().datetime({ offset: true }).nullish(),
    job_state: z.string(),
  })
  .passthrough()
const PatchedDjangoJob = z
  .object({
    id: z.string().max(255),
    next_run_time: z.string().datetime({ offset: true }).nullable(),
    job_state: z.string(),
  })
  .partial()
  .passthrough()
const JobBreakdown = z
  .object({
    job_id: z.string(),
    job_number: z.string(),
    job_name: z.string(),
    client: z.string(),
    hours: z.number(),
    revenue: z.number(),
    cost: z.number(),
    is_billable: z.boolean(),
  })
  .passthrough()
const StaffDailyData = z
  .object({
    staff_id: z.string(),
    staff_name: z.string(),
    staff_initials: z.string(),
    avatar_url: z.string().nullable(),
    scheduled_hours: z.number(),
    actual_hours: z.number(),
    billable_hours: z.number(),
    non_billable_hours: z.number(),
    total_revenue: z.number(),
    total_cost: z.number(),
    status: z.string(),
    status_class: z.string(),
    billable_percentage: z.number(),
    completion_percentage: z.number(),
    job_breakdown: z.array(JobBreakdown),
    entry_count: z.number().int(),
    alerts: z.array(z.string()),
  })
  .passthrough()
const DailyTotals = z
  .object({
    total_scheduled_hours: z.number(),
    total_actual_hours: z.number(),
    total_billable_hours: z.number(),
    total_non_billable_hours: z.number(),
    total_revenue: z.number(),
    total_cost: z.number(),
    total_entries: z.number().int(),
    completion_percentage: z.number(),
    billable_percentage: z.number(),
    missing_hours: z.number(),
  })
  .passthrough()
const SummaryStats = z
  .object({
    total_staff: z.number().int(),
    complete_staff: z.number().int(),
    partial_staff: z.number().int(),
    missing_staff: z.number().int(),
    completion_rate: z.number(),
  })
  .passthrough()
const DailyTimesheetSummary = z
  .object({
    date: z.string(),
    staff_data: z.array(StaffDailyData),
    daily_totals: DailyTotals,
    summary_stats: SummaryStats,
  })
  .passthrough()
const ModernTimesheetJob = z
  .object({
    id: z.string().uuid(),
    job_number: z.number().int().gte(-2147483648).lte(2147483647),
    name: z.string().max(100),
    client_name: z.string().optional(),
    status: StatusE5cEnum.optional(),
    charge_out_rate: z.string().regex(/^-?\d{0,8}(?:\.\d{0,2})?$/),
    has_actual_costset: z.boolean(),
  })
  .passthrough()
const JobsListResponse = z
  .object({ jobs: z.array(ModernTimesheetJob), total_count: z.number().int() })
  .passthrough()
const ModernStaff = z
  .object({
    id: z.string(),
    name: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    wageRate: z.number().optional(),
  })
  .passthrough()
const StaffListResponse = z
  .object({ staff: z.array(ModernStaff), total_count: z.number().int() })
  .passthrough()
const WeeklyTimesheetData = z
  .object({
    start_date: z.string(),
    end_date: z.string(),
    week_days: z.array(z.string()),
    staff_data: z.array(z.unknown()),
    weekly_summary: z.object({}).partial().passthrough(),
    job_metrics: z.object({}).partial().passthrough(),
    summary_stats: z.object({}).partial().passthrough(),
    export_mode: z.string(),
    is_current_week: z.boolean(),
    navigation: z.object({}).partial().passthrough().optional(),
  })
  .passthrough()
const XeroError = z
  .object({
    id: z.string().uuid(),
    timestamp: z.string().datetime({ offset: true }),
    message: z.string(),
    data: z.unknown().nullish(),
    entity: z.string().max(100),
    reference_id: z.string().max(255),
    kind: z.string().max(50),
  })
  .passthrough()
const PaginatedXeroErrorList = z
  .object({
    count: z.number().int(),
    next: z.string().url().nullish(),
    previous: z.string().url().nullish(),
    results: z.array(XeroError),
  })
  .passthrough()

const WeeklyMetrics = z.array(
  z
    .object({
      job_id: z.string().uuid(),
      name: z.string(),
      client: z.string().nullable(),
      description: z.string().nullable(),
      status: z.string(),
      people: z.array(z.object({}).passthrough()),
      estimated_hours: z.number(),
      actual_hours: z.number(),
      profit: z.number(),
    })
    .passthrough(),
)

export const schemas = {
  KPIProfitBreakdown,
  KPIJobBreakdown,
  KPIDetails,
  KPIDayData,
  KPIMonthlyTotals,
  KPIThresholds,
  KPICalendarData,
  JobAgingFinancialData,
  JobAgingTimingData,
  JobAgingJobData,
  JobAgingResponse,
  Staff,
  PatchedStaff,
  KanbanStaff,
  CustomTokenObtainPair,
  TokenRefresh,
  TokenVerify,
  UserProfile,
  ProviderTypeEnum,
  AIProvider,
  CompanyDefaults,
  PatchedCompanyDefaults,
  AIProviderCreateUpdate,
  PatchedAIProviderCreateUpdate,
  ClientContactResult,
  ClientContactsResponse,
  ClientListResponse,
  ClientContactCreateRequest,
  ClientContactCreateResponse,
  ClientCreateRequest,
  ClientCreateResponse,
  ClientSearchResult,
  ClientSearchResponse,
  JobFileStatusEnum,
  JobFile,
  UploadedFile,
  JobFileUploadSuccessResponse,
  JobFileUpdateSuccessResponse,
  AssignJobResponse,
  AssignJobRequest,
  CompleteJob,
  PaginatedCompleteJobList,
  ArchiveJobsRequest,
  ArchiveJobsResponse,
  JobQuoteChatHistoryResponse,
  RoleEnum,
  JobQuoteChat,
  PatchedJobQuoteChatUpdate,
  JobQuoteChatUpdate,
  JobQuoteChatInteractionRequest,
  JobReorderRequest,
  JobStatusUpdateRequest,
  KanbanJobPerson,
  KanbanJob,
  AdvancedSearchResponse,
  FetchAllJobsResponse,
  KanbanColumnJob,
  FetchJobsByColumnResponse,
  FetchJobsResponse,
  FetchStatusValuesResponse,
  WorkshopPDFResponse,
  Kind332Enum,
  PatchedCostLineCreateUpdate,
  CostLineCreateUpdate,
  JobCreateRequest,
  JobCreateResponse,
  PricingMethodologyEnum,
  QuoteSpreadsheet,
  Job,
  JobUpdateRequest,
  JobDetailResponse,
  JobDeleteResponse,
  JobRestErrorResponse,
  JobEventCreateRequest,
  JobEventCreateResponse,
  CostSetKindEnum,
  CostLine,
  CostSet,
  QuoteImportStatusResponse,
  QuoteRevisionRequestSerializer,
  QuoteRevisionResponseSerializer,
  QuoteAcceptResponse,
  QuoteRevisionsListResponse,
  DraftLine,
  QuoteChanges,
  ApplyQuoteResponse,
  LinkQuoteSheetRequest,
  PreviewQuoteResponse,
  JobFileThumbnailErrorResponse,
  JobFileUploadViewResponse,
  MonthEndJobHistory,
  MonthEndJob,
  MonthEndStockHistory,
  MonthEndStockJob,
  MonthEndGetResponse,
  MonthEndPostRequest,
  MonthEndPostResponse,
  TimesheetCostLine,
  ModernTimesheetStaff,
  ModernTimesheetSummary,
  ModernTimesheetEntryGetResponse,
  ModernTimesheetEntryPostResponse,
  ModernTimesheetJobGetResponse,
  ModernTimesheetDayGetResponse,
  DeliveryReceiptAllocation,
  DeliveryReceiptLine,
  DeliveryReceiptRequest,
  DeliveryReceiptResponse,
  PurchaseOrderEmailRequest,
  PurchaseOrderPDFResponse,
  StatusE5cEnum,
  JobForPurchasing,
  AllJobsResponse,
  PurchasingJobsResponse,
  PurchaseOrderList,
  PurchaseOrderLineCreate,
  PurchaseOrderLineUpdate,
  PurchaseOrderCreate,
  PurchaseOrderDetailStatusEnum,
  MetalTypeEnum,
  BlankEnum,
  NullEnum,
  PurchaseOrderLine,
  PurchaseOrderDetail,
  PatchedPurchaseOrderUpdate,
  PurchaseOrderUpdate,
  TypeEnum,
  AllocationItem,
  PurchaseOrderAllocationsResponse,
  StockList,
  StockCreate,
  StockConsumeRequest,
  StockConsumeResponse,
  XeroItem,
  XeroItemListResponse,
  DjangoJobExecutionStatusEnum,
  DjangoJobExecution,
  DjangoJob,
  PatchedDjangoJob,
  JobBreakdown,
  StaffDailyData,
  DailyTotals,
  SummaryStats,
  DailyTimesheetSummary,
  ModernTimesheetJob,
  JobsListResponse,
  ModernStaff,
  StaffListResponse,
  WeeklyTimesheetData,
  XeroError,
  PaginatedXeroErrorList,
  WeeklyMetrics,
}

const endpoints = makeApi([
  {
    method: 'get',
    path: '/accounting/api/reports/calendar/',
    alias: 'accounting_api_reports_calendar_retrieve',
    description: `API Endpoint to provide KPI data for calendar display`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'year',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'month',
        type: 'Query',
        schema: z.number().int().optional(),
      },
    ],
    response: KPICalendarData,
  },
  {
    method: 'get',
    path: '/accounting/api/reports/job-aging/',
    alias: 'accounting_api_reports_job_aging_retrieve',
    description: `Get job aging data.

Query Parameters:
    include_archived (bool): Whether to include archived jobs. Defaults to False.

Returns:
    JSON response with job aging data structure`,
    requestFormat: 'json',
    response: JobAgingResponse,
  },
  {
    method: 'get',
    path: '/accounts/api/staff/',
    alias: 'accounts_api_staff_list',
    description: `API endpoint for listing and creating staff members.

Supports both GET (list all staff) and POST (create new staff) operations.
Requires authentication and staff permissions. Handles multipart/form data
for file uploads (e.g., profile pictures).`,
    requestFormat: 'json',
    response: z.array(Staff),
  },
  {
    method: 'post',
    path: '/accounts/api/staff/',
    alias: 'accounts_api_staff_create',
    description: `API endpoint for listing and creating staff members.

Supports both GET (list all staff) and POST (create new staff) operations.
Requires authentication and staff permissions. Handles multipart/form data
for file uploads (e.g., profile pictures).`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: Staff,
      },
    ],
    response: Staff,
  },
  {
    method: 'get',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_retrieve',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: Staff,
  },
  {
    method: 'put',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_update',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: Staff,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: Staff,
  },
  {
    method: 'patch',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_partial_update',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedStaff,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: Staff,
  },
  {
    method: 'delete',
    path: '/accounts/api/staff/:id/',
    alias: 'accounts_api_staff_destroy',
    description: `API endpoint for retrieving, updating, and deleting individual staff members.

Supports GET (retrieve), PUT/PATCH (update), and DELETE operations on
specific staff members. Includes comprehensive logging for update operations
and handles multipart/form data for file uploads.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/accounts/api/staff/all/',
    alias: 'accounts_api_staff_all_list',
    description: `API endpoint for retrieving list of staff members for Kanban board.

Supports filtering to return only actual users (excluding system/test accounts)
based on the &#x27;actual_users&#x27; query parameter.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'actual_users',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: z.array(KanbanStaff),
  },
  {
    method: 'post',
    path: '/accounts/api/token/',
    alias: 'accounts_api_token_create',
    description: `Customized token obtain view that handles password reset requirement
and sets JWT tokens as httpOnly cookies`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CustomTokenObtainPair,
      },
    ],
    response: CustomTokenObtainPair,
  },
  {
    method: 'post',
    path: '/accounts/api/token/refresh/',
    alias: 'accounts_api_token_refresh_create',
    description: `Customized token refresh view that uses httpOnly cookies`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: TokenRefresh,
      },
    ],
    response: TokenRefresh,
  },
  {
    method: 'post',
    path: '/accounts/api/token/verify/',
    alias: 'accounts_api_token_verify_create',
    description: `Takes a token and indicates if it is valid.  This view provides no
information about a token&#x27;s fitness for a particular use.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ token: z.string() }).passthrough(),
      },
    ],
    response: z.object({ token: z.string() }).passthrough(),
  },
  {
    method: 'post',
    path: '/accounts/logout/',
    alias: 'accounts_logout_create',
    description: `Custom logout view that clears JWT httpOnly cookies`,
    requestFormat: 'json',
    response: z.object({}).partial().passthrough(),
    errors: [
      {
        status: 500,
        schema: z.object({}).partial().passthrough(),
      },
    ],
  },
  {
    method: 'get',
    path: '/accounts/me/',
    alias: 'accounts_me_retrieve',
    description: `Get current authenticated user information via JWT from httpOnly cookie`,
    requestFormat: 'json',
    response: UserProfile,
  },
  {
    method: 'get',
    path: '/api/company-defaults/',
    alias: 'api_company_defaults_retrieve',
    description: `API view for managing company default settings.

This view provides endpoints to retrieve and update the company&#x27;s default
configuration settings. Only admin users are permitted to access these endpoints.

Endpoints:
    GET: Retrieve current company defaults
    PUT: Update all company defaults (full update)
    PATCH: Partially update company defaults

Permissions:
    - IsAdminUser: Only admin users can access this API

Returns:
    Company defaults data serialized using CompanyDefaultsSerializer`,
    requestFormat: 'json',
    response: CompanyDefaults,
  },
  {
    method: 'put',
    path: '/api/company-defaults/',
    alias: 'api_company_defaults_update',
    description: `API view for managing company default settings.

This view provides endpoints to retrieve and update the company&#x27;s default
configuration settings. Only admin users are permitted to access these endpoints.

Endpoints:
    GET: Retrieve current company defaults
    PUT: Update all company defaults (full update)
    PATCH: Partially update company defaults

Permissions:
    - IsAdminUser: Only admin users can access this API

Returns:
    Company defaults data serialized using CompanyDefaultsSerializer`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CompanyDefaults,
      },
    ],
    response: CompanyDefaults,
  },
  {
    method: 'patch',
    path: '/api/company-defaults/',
    alias: 'api_company_defaults_partial_update',
    description: `API view for managing company default settings.

This view provides endpoints to retrieve and update the company&#x27;s default
configuration settings. Only admin users are permitted to access these endpoints.

Endpoints:
    GET: Retrieve current company defaults
    PUT: Update all company defaults (full update)
    PATCH: Partially update company defaults

Permissions:
    - IsAdminUser: Only admin users can access this API

Returns:
    Company defaults data serialized using CompanyDefaultsSerializer`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedCompanyDefaults,
      },
    ],
    response: CompanyDefaults,
  },
  {
    method: 'get',
    path: '/api/workflow/ai-providers/',
    alias: 'api_workflow_ai_providers_list',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    response: z.array(AIProvider),
  },
  {
    method: 'post',
    path: '/api/workflow/ai-providers/',
    alias: 'api_workflow_ai_providers_create',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AIProviderCreateUpdate,
      },
    ],
    response: AIProviderCreateUpdate,
  },
  {
    method: 'get',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_retrieve',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProvider,
  },
  {
    method: 'put',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_update',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AIProviderCreateUpdate,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProviderCreateUpdate,
  },
  {
    method: 'patch',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_partial_update',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedAIProviderCreateUpdate,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProviderCreateUpdate,
  },
  {
    method: 'delete',
    path: '/api/workflow/ai-providers/:id/',
    alias: 'api_workflow_ai_providers_destroy',
    description: `API endpoint that allows AI Providers to be viewed or edited.

Provides standard CRUD operations and a custom action to set a
provider as the default for the company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/api/workflow/ai-providers/:id/set-default/',
    alias: 'api_workflow_ai_providers_set_default_create',
    description: `Set this provider as the default for the company.
This will atomically unset any other provider that is currently the default
for the same company.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AIProvider,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: AIProvider,
  },
  {
    method: 'get',
    path: '/clients/:client_id/contacts/',
    alias: 'clients_contacts_retrieve',
    description: `Fetches contacts for a specific client.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'client_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ClientContactsResponse,
  },
  {
    method: 'get',
    path: '/clients/all/',
    alias: 'clients_all_retrieve',
    description: `Lists all clients (only id and name) for fast dropdowns.`,
    requestFormat: 'json',
    response: ClientListResponse,
  },
  {
    method: 'post',
    path: '/clients/contacts/',
    alias: 'clients_contacts_create',
    description: `Create a new client contact.

Expected JSON:
{
    &quot;client_id&quot;: &quot;uuid-of-client&quot;,
    &quot;name&quot;: &quot;Contact Name&quot;,
    &quot;email&quot;: &quot;contact@example.com&quot;,
    &quot;phone&quot;: &quot;123-456-7890&quot;,
    &quot;position&quot;: &quot;Job Title&quot;,
    &quot;is_primary&quot;: false,
    &quot;notes&quot;: &quot;Additional notes&quot;
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ClientContactCreateRequest,
      },
    ],
    response: ClientContactCreateResponse,
  },
  {
    method: 'post',
    path: '/clients/create/',
    alias: 'clients_create_create',
    description: `Create a new client, first in Xero, then sync locally.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ClientCreateRequest,
      },
    ],
    response: ClientCreateResponse,
  },
  {
    method: 'get',
    path: '/clients/search/',
    alias: 'clients_search_retrieve',
    description: `Searches clients by name following early return pattern.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'q',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: ClientSearchResponse,
  },
  {
    method: 'get',
    path: '/job/api/job-files/',
    alias: 'retrieveJobFilesApi',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFile,
  },
  {
    method: 'post',
    path: '/job/api/job-files/',
    alias: 'uploadJobFilesApi',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
  },
  {
    method: 'put',
    path: '/job/api/job-files/',
    alias: 'updateJobFilesApi',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
  },
  {
    method: 'delete',
    path: '/job/api/job-files/',
    alias: 'deleteJobFilesApi',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/job/api/job-files/:file_path',
    alias: 'retrieveJobFilesApi_2',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFile,
  },
  {
    method: 'post',
    path: '/job/api/job-files/:file_path',
    alias: 'uploadJobFilesApi_2',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
  },
  {
    method: 'put',
    path: '/job/api/job-files/:file_path',
    alias: 'updateJobFilesApi_2',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
  },
  {
    method: 'delete',
    path: '/job/api/job-files/:file_path',
    alias: 'deleteJobFilesApi_2',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/job/api/job-files/:job_number',
    alias: 'retrieveJobFilesApi_3',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.array(JobFile),
  },
  {
    method: 'post',
    path: '/job/api/job-files/:job_number',
    alias: 'uploadJobFilesApi_3',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUploadSuccessResponse,
  },
  {
    method: 'put',
    path: '/job/api/job-files/:job_number',
    alias: 'updateJobFilesApi_3',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
  },
  {
    method: 'delete',
    path: '/job/api/job-files/:job_number',
    alias: 'deleteJobFilesApi_3',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/job/api/job/:job_id/assignment',
    alias: 'job_api_job_assignment_create',
    description: `API Endpoint for activities related to job assignment`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AssignJobRequest,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: AssignJobResponse,
  },
  {
    method: 'delete',
    path: '/job/api/job/:job_id/assignment',
    alias: 'job_api_job_assignment_destroy',
    description: `API Endpoint for activities related to job assignment`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/job/api/job/completed/',
    alias: 'job_api_job_completed_list',
    description: `API Endpoint to provide Job data for archiving display`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().optional(),
      },
      {
        name: 'page_size',
        type: 'Query',
        schema: z.number().int().optional(),
      },
    ],
    response: PaginatedCompleteJobList,
  },
  {
    method: 'post',
    path: '/job/api/job/completed/archive',
    alias: 'job_api_job_completed_archive_create',
    description: `API Endpoint to set &#x27;paid&#x27; flag as True in the received jobs`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ArchiveJobsRequest,
      },
    ],
    response: ArchiveJobsResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/:job_id/quote-chat/',
    alias: 'job_api_jobs_quote_chat_retrieve',
    description: `Load all chat messages for a specific job.

Response format matches job_quote_chat_plan.md specification.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobQuoteChatHistoryResponse,
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/quote-chat/',
    alias: 'job_api_jobs_quote_chat_create',
    description: `Save a new chat message (user or assistant).

Expected JSON:
{
    &quot;message_id&quot;: &quot;user-1234567892&quot;,
    &quot;role&quot;: &quot;user&quot;,
    &quot;content&quot;: &quot;Actually, make that 5 boxes instead&quot;,
    &quot;metadata&quot;: {}
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobQuoteChat,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobQuoteChat,
  },
  {
    method: 'delete',
    path: '/job/api/jobs/:job_id/quote-chat/',
    alias: 'job_api_jobs_quote_chat_destroy',
    description: `Delete all chat messages for a job (start fresh).`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'patch',
    path: '/job/api/jobs/:job_id/quote-chat/:message_id/',
    alias: 'job_api_jobs_quote_chat_partial_update',
    description: `Update an existing message (useful for streaming responses).

Expected JSON:
{
    &quot;content&quot;: &quot;Updated message content&quot;,
    &quot;metadata&quot;: {&quot;final&quot;: true}
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ content: z.string(), metadata: z.unknown() }).partial().passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'message_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.object({ content: z.string(), metadata: z.unknown() }).partial().passthrough(),
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/quote-chat/interaction/',
    alias: 'job_api_jobs_quote_chat_interaction_create',
    description: `Receives a user message, sends it to the MCPChatService for processing,
and returns the AI&#x27;s final response.

The frontend is expected to first save the user&#x27;s message via the
JobQuoteChatHistoryView, and then call this endpoint to get the
assistant&#x27;s reply.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ message: z.string().max(5000) }).passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ message: z.string().max(5000) }).passthrough(),
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/reorder/',
    alias: 'job_api_jobs_reorder_create',
    description: `Reorder job within or between columns - API endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobReorderRequest,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobReorderRequest,
  },
  {
    method: 'post',
    path: '/job/api/jobs/:job_id/update-status/',
    alias: 'job_api_jobs_update_status_create',
    description: `Update job status - API endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ status: z.string() }).passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.object({ status: z.string() }).passthrough(),
  },
  {
    method: 'get',
    path: '/job/api/jobs/advanced-search/',
    alias: 'job_api_jobs_advanced_search_retrieve',
    description: `Endpoint for advanced job search - API endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_number',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'name',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'description',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'client_name',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'contact_person',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'created_by',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'status',
        type: 'Query',
        schema: z.array(z.string()).optional(),
      },
      {
        name: 'created_after',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'created_before',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'paid',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: AdvancedSearchResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/fetch-all/',
    alias: 'job_api_jobs_fetch_all_retrieve',
    description: `Fetch all jobs for Kanban board - API endpoint.`,
    requestFormat: 'json',
    response: FetchAllJobsResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/fetch-by-column/:column_id/',
    alias: 'job_api_jobs_fetch_by_column_retrieve',
    description: `Fetch jobs by kanban column using new categorization system.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'column_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: FetchJobsByColumnResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/fetch/:status/',
    alias: 'job_api_jobs_fetch_retrieve',
    description: `Fetch jobs by status with optional search - API endpoint.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'status',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: FetchJobsResponse,
  },
  {
    method: 'get',
    path: '/job/api/jobs/status-values/',
    alias: 'job_api_jobs_status_values_retrieve',
    description: `Return available status values for Kanban - API endpoint.`,
    requestFormat: 'json',
    response: FetchStatusValuesResponse,
  },
  {
    method: 'get',
    path: '/job/job/:job_id/workshop-pdf/',
    alias: 'job_job_workshop_pdf_retrieve',
    description: `Generate and return a workshop PDF for printing.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: WorkshopPDFResponse,
  },
  {
    method: 'patch',
    path: '/job/rest/cost_lines/:cost_line_id/',
    alias: 'job_rest_cost_lines_partial_update',
    description: `Update a cost line`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedCostLineCreateUpdate,
      },
      {
        name: 'cost_line_id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: CostLine,
  },
  {
    method: 'delete',
    path: '/job/rest/cost_lines/:cost_line_id/delete/',
    alias: 'job_rest_cost_lines_delete_destroy',
    description: `Delete a cost line`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'cost_line_id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/job/rest/jobs/',
    alias: 'job_rest_jobs_create',
    description: `Create a new Job.

Expected JSON:
{
    &quot;name&quot;: &quot;Job Name&quot;,
    &quot;client_id&quot;: &quot;client-uuid&quot;,
    &quot;description&quot;: &quot;Optional description&quot;,
    &quot;order_number&quot;: &quot;Optional order number&quot;,
    &quot;notes&quot;: &quot;Optional notes&quot;,
    &quot;contact_id&quot;: &quot;optional-contact-uuid&quot;
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobCreateRequest,
      },
    ],
    response: JobCreateResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:id/cost_sets/:kind/',
    alias: 'job_rest_jobs_cost_sets_retrieve',
    description: `Get the latest CostSet for a job by kind.

Args:
    pk: Job primary key (UUID)
    kind: CostSet kind (&#x27;estimate&#x27;, &#x27;quote&#x27;, or &#x27;actual&#x27;)

Returns:
    Response: Serialized CostSet data or 404`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'kind',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: CostSet,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/cost_sets/quote/revise/',
    alias: 'job_rest_jobs_cost_sets_quote_revise_retrieve',
    description: `Get the list of archived quote revisions for the specified job.

Returns a list of all quote revisions that have been archived in the
CostSet summary, including revision numbers, timestamps, and full data.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: QuoteRevisionsListResponse,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/cost_sets/quote/revise/',
    alias: 'job_rest_jobs_cost_sets_quote_revise_create',
    description: `Create a new quote revision by archiving current quote data and clearing cost lines.

This endpoint:
1. Archives current quote cost lines and summary in the existing CostSet summary
2. Clears all current cost lines from the quote CostSet
3. Uses quote_revision numbering for tracking
4. Allows starting fresh quote while preserving historical data

Only works with kind='quote' CostSets.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: QuoteRevisionRequestSerializer,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: QuoteRevisionResponseSerializer,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/quote/accept/',
    alias: 'job_rest_jobs_quote_accept_create',
    description: 'Accept a quote for the job by setting quote_acceptance_date',
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: QuoteAcceptResponse,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:id/quote/apply/',
    alias: 'job_rest_jobs_quote_apply_create',
    description: `Apply quote import from linked Google Sheet.

POST /job/rest/jobs/&lt;uuid:pk&gt;/quote/apply/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ApplyQuoteResponse,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ApplyQuoteResponse,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:pk/quote/link/',
    alias: 'job_rest_jobs_quote_link_create',
    description: `Link a job to a Google Sheets quote template.

POST /job/rest/jobs/&lt;uuid:pk&gt;/quote/link/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ template_url: z.string().url() }).partial().passthrough(),
      },
      {
        name: 'pk',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ template_url: z.string().url() }).partial().passthrough(),
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:id/quote/preview/',
    alias: 'job_rest_jobs_quote_preview_create',
    description: `Preview quote import from linked Google Sheet.

POST /job/rest/jobs/&lt;uuid:pk&gt;/quote/preview/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PreviewQuoteResponse,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PreviewQuoteResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/',
    alias: 'job_rest_jobs_retrieve',
    description: `Fetch complete Job data for editing.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobDetailResponse,
  },
  {
    method: 'put',
    path: '/job/rest/jobs/:job_id/',
    alias: 'job_rest_jobs_update',
    description: `Update Job data (autosave).`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobUpdateRequest,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobDetailResponse,
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/:job_id/',
    alias: 'job_rest_jobs_destroy',
    description: `Delete a Job if permitted.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobDeleteResponse,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/cost_sets/:kind/cost_lines/',
    alias: 'job_rest_jobs_cost_sets_cost_lines_create',
    description: `Create a new cost line`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CostLineCreateUpdate,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'kind',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: CostLine,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/cost_sets/actual/cost_lines/',
    alias: 'job_rest_jobs_cost_sets_actual_cost_lines_create',
    description: `Create a new cost line`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CostLineCreateUpdate,
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: CostLine,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/:job_id/events/',
    alias: 'job_rest_jobs_events_create',
    description: `Add a manual event to the Job.

Expected JSON:
{
    &quot;description&quot;: &quot;Event description&quot;
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ description: z.string().max(500) }).passthrough(),
      },
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.object({ success: z.boolean(), event: z.object({}).passthrough() }).passthrough(),
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/quote/status/',
    alias: 'job_rest_jobs_quote_status_retrieve',
    description: `Get quote status for job`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: QuoteImportStatusResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/:job_id/workshop-pdf/',
    alias: 'job_rest_jobs_workshop_pdf_retrieve',
    description: `Generate and return a workshop PDF for printing.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.instanceof(Blob),
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/',
    alias: 'retrieveJobFilesApi_4',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFile,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/',
    alias: 'uploadJobFilesApi_4',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
  },
  {
    method: 'put',
    path: '/job/rest/jobs/files/',
    alias: 'updateJobFilesApi_4',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/files/',
    alias: 'deleteJobFilesApi_4',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/:file_id/thumbnail/',
    alias: 'getJobFileThumbnail',
    description: `API view for serving JPEG thumbnails of job files.

This view generates and serves thumbnail images for job files that
support thumbnail generation (typically image files). Thumbnails are
cached on disk and served via file response for efficient delivery.

GET: Returns a JPEG thumbnail for the specified file ID, or 404 if
     the thumbnail doesn&#x27;t exist or cannot be generated.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: JobFileThumbnailErrorResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'retrieveJobFilesApi_5',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFile,
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'uploadJobFilesApi_5',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUploadSuccessResponse,
  },
  {
    method: 'put',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'updateJobFilesApi_5',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/files/:file_path/',
    alias: 'deleteJobFilesApi_5',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'file_path',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'retrieveJobFilesApi_6',
    description: `Based on the request, serve a file for download or return the file list of the job.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.array(JobFile),
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'uploadJobFilesApi_6',
    description: `Handle file uploads. Creates new files or updates existing ones with POST.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUploadSuccessResponse,
  },
  {
    method: 'put',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'updateJobFilesApi_6',
    description: `Update an existing job file:
- If a new file is provided (files[] in request), replace the file on disk.
- If no file_obj is provided, only update print_on_jobsheet.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUpdateSuccessResponse,
      },
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: JobFileUpdateSuccessResponse,
  },
  {
    method: 'delete',
    path: '/job/rest/jobs/files/:job_number/',
    alias: 'deleteJobFilesApi_6',
    description: `Delete a job file by its ID. (file_path param is actually the job_file.id)`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'format',
        type: 'Query',
        schema: z.enum(['file', 'json']).optional(),
      },
      {
        name: 'job_number',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/job/rest/jobs/files/upload/',
    alias: 'uploadJobFilesRest',
    description: `REST API view for uploading files to jobs.

Handles multipart file uploads, saves files to the Dropbox workflow folder,
and creates JobFile database records with proper file metadata.`,
    requestFormat: 'form-data',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: JobFileUploadViewResponse,
      },
    ],
    response: JobFileUploadViewResponse,
  },
  {
    method: 'get',
    path: '/job/rest/month-end/',
    alias: 'job_rest_month_end_retrieve',
    description: `REST API view for month-end processing of special jobs and stock data.

GET: Returns special jobs data and stock job information for month-end review
POST: Processes selected jobs for month-end archiving and status updates`,
    requestFormat: 'json',
    response: MonthEndGetResponse,
  },
  {
    method: 'post',
    path: '/job/rest/month-end/',
    alias: 'job_rest_month_end_create',
    description: `REST API view for month-end processing of special jobs and stock data.

GET: Returns special jobs data and stock job information for month-end review
POST: Processes selected jobs for month-end archiving and status updates`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: MonthEndPostRequest,
      },
    ],
    response: MonthEndPostResponse,
  },
  {
    method: 'get',
    path: '/job/rest/timesheet/entries/',
    alias: 'job_rest_timesheet_entries_retrieve',
    description: `Get timesheet entries (CostLines) for a specific staff member and date`,
    requestFormat: 'json',
    response: ModernTimesheetEntryGetResponse,
  },
  {
    method: 'post',
    path: '/job/rest/timesheet/entries/',
    alias: 'job_rest_timesheet_entries_create',
    description: `Create a timesheet entry as a CostLine in the actual CostSet`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ModernTimesheetEntryPostResponse,
      },
    ],
    response: ModernTimesheetEntryPostResponse,
  },
  {
    method: 'get',
    path: '/job/rest/timesheet/jobs/:job_id/',
    alias: 'job_rest_timesheet_jobs_retrieve',
    description: `Get all timesheet cost lines for a job`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'job_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ModernTimesheetJobGetResponse,
  },
  {
    method: 'get',
    path: '/job/rest/timesheet/staff/:staff_id/date/:entry_date/',
    alias: 'job_rest_timesheet_staff_date_retrieve',
    description: `Get all cost lines for a staff member on a specific date`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'entry_date',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'staff_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: ModernTimesheetDayGetResponse,
  },
  {
    method: 'get',
    path: '/job/rest/jobs/weekly-metrics/',
    alias: 'getWeeklyMetrics',
    description: 'Get weekly metrics for jobs',
    parameters: [
      {
        name: 'week',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: WeeklyMetrics,
  },
  {
    method: 'post',
    path: '/purchasing/api/delivery-receipts/process/',
    alias: 'purchasing_api_delivery_receipts_process_create',
    description: `REST API view for processing delivery receipts.

POST: Processes delivery receipt for a purchase order with stock allocations`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DeliveryReceiptRequest,
      },
    ],
    response: DeliveryReceiptResponse,
  },
  {
    method: 'post',
    path: '/purchasing/api/purchase-orders/:purchase_order_id/email/',
    alias: 'purchasing_api_purchase_orders_email_create',
    description: `Generate and return email details for the specified purchase order.

Args:
    request: The HTTP request
    purchase_order_id: UUID of the purchase order

Returns:
    Response: Email details if successful
    Response: Error details if unsuccessful`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PurchaseOrderEmailRequest,
      },
      {
        name: 'purchase_order_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderEmailRequest,
  },
  {
    method: 'get',
    path: '/purchasing/api/purchase-orders/:purchase_order_id/pdf/',
    alias: 'purchasing_api_purchase_orders_pdf_retrieve',
    description: `Generate and return a PDF for the specified purchase order.

Args:
    request: The HTTP request
    purchase_order_id: UUID of the purchase order

Returns:
    FileResponse: PDF file if successful
    Response: Error details if unsuccessful`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'purchase_order_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderPDFResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/all-jobs/',
    alias: 'purchasing_rest_all_jobs_retrieve',
    description: `Get all jobs with stock holding job flag.`,
    requestFormat: 'json',
    response: AllJobsResponse,
  },
  {
    method: 'post',
    path: '/purchasing/rest/delivery-receipts/',
    alias: 'purchasing_rest_delivery_receipts_create',
    description: `REST API view for processing delivery receipts.

POST: Processes delivery receipt for a purchase order with stock allocations`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DeliveryReceiptRequest,
      },
    ],
    response: DeliveryReceiptResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/jobs/',
    alias: 'purchasing_rest_jobs_retrieve',
    description: `Get list of jobs suitable for purchasing operations.`,
    requestFormat: 'json',
    response: PurchasingJobsResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/purchase-orders/',
    alias: 'listPurchaseOrders',
    description: `Get list of purchase orders with optional status filtering.`,
    requestFormat: 'json',
    response: z.array(PurchaseOrderList),
  },
  {
    method: 'post',
    path: '/purchasing/rest/purchase-orders/',
    alias: 'purchasing_rest_purchase_orders_create',
    description: `Create new purchase order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PurchaseOrderCreate,
      },
    ],
    response: PurchaseOrderCreate,
  },
  {
    method: 'get',
    path: '/purchasing/rest/purchase-orders/:id/',
    alias: 'retrievePurchaseOrder',
    description: `Get purchase order details including lines.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderDetail,
  },
  {
    method: 'patch',
    path: '/purchasing/rest/purchase-orders/:id/',
    alias: 'purchasing_rest_purchase_orders_partial_update',
    description: `Update purchase order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedPurchaseOrderUpdate,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderUpdate,
  },
  {
    method: 'get',
    path: '/purchasing/rest/purchase-orders/:po_id/allocations/',
    alias: 'purchasing_rest_purchase_orders_allocations_retrieve',
    description: `Get existing allocations for a purchase order.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'po_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PurchaseOrderAllocationsResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/stock/',
    alias: 'purchasing_rest_stock_retrieve',
    description: `Get list of all active stock items.`,
    requestFormat: 'json',
    response: z.array(StockList),
  },
  {
    method: 'post',
    path: '/purchasing/rest/stock/',
    alias: 'purchasing_rest_stock_create',
    description: `Create new stock item.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: StockCreate,
      },
    ],
    response: StockCreate,
  },
  {
    method: 'delete',
    path: '/purchasing/rest/stock/:stock_id/',
    alias: 'purchasing_rest_stock_destroy',
    description: `REST API view for deactivating stock items.

DELETE: Marks a stock item as inactive instead of deleting it`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'stock_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/purchasing/rest/stock/:stock_id/consume/',
    alias: 'purchasing_rest_stock_consume_create',
    description: `REST API view for consuming stock items for jobs.

POST: Records stock consumption for a specific job, reducing available quantity`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: StockConsumeRequest,
      },
      {
        name: 'stock_id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: StockConsumeResponse,
  },
  {
    method: 'get',
    path: '/purchasing/rest/xero-items/',
    alias: 'purchasing_rest_xero_items_retrieve',
    description: `Return list of items from Xero.`,
    requestFormat: 'json',
    response: XeroItemListResponse,
  },
  {
    method: 'get',
    path: '/quoting/api/django-job-executions/',
    alias: 'quoting_api_django_job_executions_list',
    requestFormat: 'json',
    parameters: [
      {
        name: 'search',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: z.array(DjangoJobExecution),
  },
  {
    method: 'get',
    path: '/quoting/api/django-job-executions/:id/',
    alias: 'quoting_api_django_job_executions_retrieve',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.number().int(),
      },
    ],
    response: DjangoJobExecution,
  },
  {
    method: 'get',
    path: '/quoting/api/django-jobs/',
    alias: 'quoting_api_django_jobs_list',
    requestFormat: 'json',
    parameters: [
      {
        name: 'search',
        type: 'Query',
        schema: z.string().optional(),
      },
    ],
    response: z.array(DjangoJob),
  },
  {
    method: 'post',
    path: '/quoting/api/django-jobs/',
    alias: 'quoting_api_django_jobs_create',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DjangoJob,
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'get',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_retrieve',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'put',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_update',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: DjangoJob,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'patch',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_partial_update',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PatchedDjangoJob,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DjangoJob,
  },
  {
    method: 'delete',
    path: '/quoting/api/django-jobs/:id/',
    alias: 'quoting_api_django_jobs_destroy',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/timesheets/api/daily/',
    alias: 'getDailyTimesheetSummaryByDate',
    description: `Get daily timesheet summary for all staff

Args:
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with daily timesheet data`,
    requestFormat: 'json',
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/daily/:target_date/',
    alias: 'getDailyTimesheetSummaryByDate_2',
    description: `Get daily timesheet summary for all staff

Args:
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with daily timesheet data`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'target_date',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/jobs/',
    alias: 'timesheets_api_jobs_retrieve',
    description: `Get list of active jobs for timesheet entries using CostSet system.`,
    requestFormat: 'json',
    response: JobsListResponse,
  },
  {
    method: 'get',
    path: '/timesheets/api/staff/',
    alias: 'timesheets_api_staff_retrieve',
    description: `Get filtered list of staff members.`,
    requestFormat: 'json',
    response: StaffListResponse,
  },
  {
    method: 'get',
    path: '/timesheets/api/staff/:staff_id/daily/',
    alias: 'getStaffDailyTimesheetDetailByDate',
    description: `Get detailed timesheet data for a specific staff member

Args:
    staff_id: Staff member ID
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with staff timesheet detail`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'staff_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/staff/:staff_id/daily/:target_date/',
    alias: 'getStaffDailyTimesheetDetailByDate_2',
    description: `Get detailed timesheet data for a specific staff member

Args:
    staff_id: Staff member ID
    target_date: Date in YYYY-MM-DD format (optional, defaults to today)

Returns:
    JSON response with staff timesheet detail`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'staff_id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'target_date',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: DailyTimesheetSummary,
  },
  {
    method: 'get',
    path: '/timesheets/api/weekly/',
    alias: 'timesheets_api_weekly_retrieve',
    description: `Get comprehensive weekly timesheet data.

Query Parameters:
    start_date (optional): Monday of target week in YYYY-MM-DD format
    export_to_ims (optional): Boolean to include IMS-specific data

Returns:
    Comprehensive weekly timesheet data including:
    - Staff data with daily breakdowns
    - Weekly totals and metrics
    - Job statistics
    - Summary statistics`,
    requestFormat: 'json',
    response: WeeklyTimesheetData,
  },
  {
    method: 'post',
    path: '/timesheets/api/weekly/',
    alias: 'timesheets_api_weekly_create',
    description: `Submit paid absence request.

Expected payload:
{
    &quot;staff_id&quot;: &quot;uuid&quot;,
    &quot;start_date&quot;: &quot;YYYY-MM-DD&quot;,
    &quot;end_date&quot;: &quot;YYYY-MM-DD&quot;,
    &quot;leave_type&quot;: &quot;annual|sick|other&quot;,
    &quot;hours_per_day&quot;: 8.0,
    &quot;description&quot;: &quot;Optional description&quot;
}`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: WeeklyTimesheetData,
      },
    ],
    response: WeeklyTimesheetData,
  },
  {
    method: 'get',
    path: '/xero-errors/',
    alias: 'xero_errors_list',
    description: `API view for listing Xero synchronization errors.

Returns a paginated list of all XeroError records ordered by timestamp
(most recent first). Useful for monitoring and debugging Xero integration
issues.

Endpoint: /api/xero/errors/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().optional(),
      },
    ],
    response: PaginatedXeroErrorList,
  },
  {
    method: 'get',
    path: '/xero-errors/:id/',
    alias: 'xero_errors_retrieve',
    description: `API view for retrieving a single Xero synchronization error.

Returns detailed information about a specific XeroError record
including error message, context, and timestamp. Used for investigating
specific Xero integration failures.

Endpoint: /api/xero/errors/&lt;id&gt;/`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: XeroError,
  },
])

// Create API instance lazily to avoid circular dependency issues
let _api: Zodios<typeof endpoints> | null = null

export function getApi(): Zodios<typeof endpoints> {
  if (!_api) {
    _api = new Zodios(getApiBaseUrl(), endpoints, { axiosInstance: axios })
  }
  return _api
}

// For backward compatibility, export api as getter
export const api = getApi()

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
