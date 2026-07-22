import { z } from "zod";

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .trim(),
  email: z
    .email({ message: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Za-z]/, { message: "Password must contain at least one letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." }),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, { message: "Enter a valid phone number." })
    .optional()
    .or(z.literal("")),
  accountType: z.enum(["PERSONAL", "BUSINESS"], {
    message: "Select an account type.",
  }),
  businessName: z.string().min(2, { message: "Business name is required." }).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z
    .email({ message: "Enter a valid email address." })
    .trim()
    .toLowerCase(),
  password: z.string().min(1, { message: "Password is required." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export type AuthActionState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
      needsVerification?: boolean;
      verificationEmail?: string;
    }
  | undefined;
