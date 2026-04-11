import * as z from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const signupInfluencerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters"),
})

export const signupSponsorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organization: z.string().min(1, "Organization is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters"),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupInfluencerFormValues = z.infer<typeof signupInfluencerSchema>
export type SignupSponsorFormValues = z.infer<typeof signupSponsorSchema>
