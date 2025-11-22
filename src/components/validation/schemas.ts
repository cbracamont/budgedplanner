import { z } from "zod";

// Comprehensive validation schemas for financial data
export const incomeSourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  amount: z.number().min(0, "Amount must be positive").max(10000000, "Amount too large"),
  payment_day: z.number().int().min(1, "Invalid day").max(31, "Invalid day"),
  frequency: z.string().optional(),
  income_type: z.string().optional(),
});

export const debtInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  balance: z.number().min(0, "Balance must be positive").max(100000000, "Balance too large"),
  apr: z.number().min(0, "APR must be positive").max(100, "APR must be less than 100%"),
  minimum_payment: z.number().min(0, "Minimum payment must be positive").max(1000000, "Payment too large"),
  payment_day: z.number().int().min(1, "Invalid day").max(31, "Invalid day"),
  bank: z.string().max(100, "Bank name too long").optional(),
});

export const fixedExpenseInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  amount: z.number().min(0, "Amount must be positive").max(1000000, "Amount too large"),
  payment_day: z.number().int().min(1, "Invalid day").max(31, "Invalid day"),
  frequency: z.string().optional(),
  frequency_type: z.string().optional(),
});

export const variableExpenseInputSchema = z.object({
  name: z.string().max(100, "Name too long").optional(),
  amount: z.number().min(0, "Amount must be positive").max(1000000, "Amount too large"),
  date: z.string().optional(),
  category_id: z.string().uuid("Invalid category").optional(),
});

export const savingsGoalInputSchema = z.object({
  goal_name: z.string().min(1, "Name is required").max(100, "Name too long"),
  goal_description: z.string().max(500, "Description too long").optional(),
  target_amount: z.number().min(0, "Amount must be positive").max(100000000, "Amount too large"),
  current_amount: z.number().min(0, "Amount must be positive").max(100000000, "Amount too large").optional(),
  monthly_contribution: z.number().min(0, "Amount must be positive").max(1000000, "Amount too large").optional(),
  target_date: z.string().optional(),
});

export const debtPaymentInputSchema = z.object({
  debt_id: z.string().uuid("Invalid debt ID"),
  amount: z.number().min(0.01, "Amount must be positive").max(1000000, "Amount too large"),
  payment_date: z.string().optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

// Legacy schemas for backward compatibility
export const incomeSchema = z.object({
  salary: z.number().min(0, "El salario debe ser positivo").max(10000000, "El salario es demasiado alto"),
  tips: z.number().min(0, "Las propinas deben ser positivas").max(1000000, "Las propinas son demasiado altas"),
});

export const debtSchema = z.object({
  amount: z.number().min(0, "El monto debe ser positivo").max(100000000, "El monto es demasiado alto"),
  apr: z.number().min(0, "El APR debe ser positivo").max(100, "El APR debe ser menor a 100%"),
  bank: z.string().min(1, "Seleccione un banco"),
});

export const fixedExpenseSchema = z.object({
  amount: z.number().min(0, "El monto debe ser positivo").max(1000000, "El monto es demasiado alto"),
});

export const variableExpenseSchema = z.object({
  amount: z.number().min(0, "El monto debe ser positivo").max(1000000, "El monto es demasiado alto"),
});

export const householdSchema = z.object({
  displayName: z.string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre debe tener menos de 50 caracteres")
    .regex(/^[a-zA-Z0-9\s-_]+$/, "El nombre contiene caracteres inválidos"),
  householdId: z.string()
    .uuid("ID de hogar inválido")
    .optional(),
});
