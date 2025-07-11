import { z } from 'zod'

export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .trim(),

  email: z
    .string()
    .email('Email must have a valid format')
    .max(254, 'Email must be at most 254 characters')
    .optional()
    .or(z.literal('')),

  phone: z.string().max(20, 'Phone must be at most 20 characters').optional().or(z.literal('')),

  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional()
    .or(z.literal('')),

  is_account_customer: z.boolean().default(false),
})

export const clientResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  is_account_customer: z.boolean(),
  xero_contact_id: z.string(),
})

export const createClientResponseSchema = z.object({
  success: z.boolean(),
  client: clientResponseSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export type CreateClientData = z.infer<typeof createClientSchema>
export type ClientResponseData = z.infer<typeof clientResponseSchema>
export type CreateClientResponse = z.infer<typeof createClientResponseSchema>

export const clientFormStateSchema = createClientSchema.extend({})

export type ClientFormState = z.infer<typeof clientFormStateSchema>
