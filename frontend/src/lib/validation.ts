import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "validation.required")
  .regex(/^\+?[0-9\s\-()]{6,20}$/, "validation.phone");

export const emailSchema = z.string().trim().min(1, "validation.required").email("validation.email");

export const nameSchema = z.string().trim().min(1, "validation.required").max(100, "validation.tooLong");

export const passwordSchema = z
  .string()
  .min(8, "validation.passwordMin")
  .max(100, "validation.tooLong")
  .regex(/[A-Za-z]/, "validation.passwordLetter")
  .regex(/[0-9]/, "validation.passwordNumber");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "validation.required"),
});

export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema,
  password: passwordSchema,
});

export const bookingDetailsSchema = z.object({
  clientName: nameSchema,
  clientPhone: phoneSchema,
  notes: z.string().max(500, "validation.tooLong").optional(),
});

export const profileSchema = z.object({
  fullName: nameSchema,
  phoneNumber: phoneSchema,
  preferredLanguage: z.enum(["sq", "en"]),
});
