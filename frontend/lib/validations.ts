import { z } from "zod";

// ── Category ────────────────────────────────────────────────────────
export const categorySchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "Máximo 50 caracteres"),
  tipo: z.enum(["gasto", "ingreso"], {
    message: "Selecciona un tipo válido",
  }),
  color: z.string().min(1, "Selecciona un color"),
  icono: z.string().min(1, "Selecciona un icono"),
});

// ── Transaction ─────────────────────────────────────────────────────
export const transactionSchema = z.object({
  category_id: z.string().min(1, "Selecciona una categoría"),
  monto: z
    .number({ message: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  tipo: z.enum(["gasto", "ingreso"], {
    message: "Selecciona un tipo válido",
  }),
  descripcion: z.string().optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
});

// ── Monthly Income ──────────────────────────────────────────────────
export const monthlyIncomeSchema = z.object({
  monto: z
    .number({ message: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  mes: z.string().min(1, "El mes es requerido"),
});

// ── Auth ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// ── Debt ─────────────────────────────────────────────────────────────
export const debtSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  monto_total: z
    .number({ message: "Ingresa un monto total válido" })
    .positive("El monto debe ser mayor a 0"),
  tipo: z.enum(["cuotas", "directo"], {
    message: "Selecciona un tipo de pago",
  }),
  num_cuotas: z
    .number({ message: "Ingresa un número válido" })
    .int("Debe ser un número entero")
    .positive("Debe ser al menos 1 cuota")
    .max(360, "Máximo 360 cuotas (30 años)")
    .optional(),
  fecha_primera_cuota: z.string().min(1, "La fecha es requerida"),
});

// ── Inferred types ──────────────────────────────────────────────────
export type CategoryFormData = z.infer<typeof categorySchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type MonthlyIncomeFormData = z.infer<typeof monthlyIncomeSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type DebtFormData = z.infer<typeof debtSchema>;

