import { z } from "zod";

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
