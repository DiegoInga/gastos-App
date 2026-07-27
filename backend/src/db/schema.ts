import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  integer,
  boolean,
  date,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Users ────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  nombre: text('nombre').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ── Debts ────────────────────────────────────────────────────────────

export const debts = pgTable('debts', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  monto_total: doublePrecision('monto_total').notNull(),
  cuota_mensual: doublePrecision('cuota_mensual').notNull(),
  num_cuotas: integer('num_cuotas').notNull(),
  fecha_primera_cuota: date('fecha_primera_cuota').notNull(),
  tipo: text('tipo').notNull().$type<'cuotas' | 'directo'>(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ── Debt Payments ────────────────────────────────────────────────────

export const debtPayments = pgTable('debt_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  debt_id: uuid('debt_id')
    .notNull()
    .references(() => debts.id, { onDelete: 'cascade' }),
  numero: integer('numero').notNull(),
  fecha: date('fecha').notNull(),
  monto: doublePrecision('monto').notNull(),
  pagado: boolean('pagado').default(false).notNull(),
  fecha_pago: date('fecha_pago'),
});

// ── Monthly Income ───────────────────────────────────────────────────

export const monthlyIncome = pgTable(
  'monthly_income',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mes: text('mes').notNull(), // YYYY-MM
    monto: doublePrecision('monto').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [unique('monthly_income_user_mes').on(t.user_id, t.mes)],
);

export const fixedExpenses = pgTable('fixed_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  monto: doublePrecision('monto').notNull(),
  categoria: text('categoria').notNull().default('otro').$type<'servicios' | 'suscripciones' | 'transporte' | 'alimentacion' | 'vivienda' | 'personal' | 'otro'>(),
  activo: boolean('activo').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token_hash: text('token_hash').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ── Relations ────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  debts: many(debts),
  monthlyIncomes: many(monthlyIncome),
  fixedExpenses: many(fixedExpenses),
  passwordResetTokens: many(passwordResetTokens),
}));

export const fixedExpensesRelations = relations(fixedExpenses, ({ one }) => ({
  user: one(users, { fields: [fixedExpenses.user_id], references: [users.id] }),
}));

export const debtsRelations = relations(debts, ({ one, many }) => ({
  user: one(users, { fields: [debts.user_id], references: [users.id] }),
  pagos: many(debtPayments),
}));

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
  debt: one(debts, {
    fields: [debtPayments.debt_id],
    references: [debts.id],
  }),
}));

export const monthlyIncomeRelations = relations(monthlyIncome, ({ one }) => ({
  user: one(users, {
    fields: [monthlyIncome.user_id],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.user_id],
    references: [users.id],
  }),
}));

