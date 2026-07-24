import type { Category, Transaction, MonthlyIncome, Debt, DebtPayment } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────

/** Format a number as currency (MXN-style). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a date string to a readable Spanish format. */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a date string to relative time (e.g., "hace 2 días"). */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
  return formatDate(dateStr);
}

/** Get Spanish month name from YYYY-MM string. */
export function getMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

/** Get current YYYY-MM string. */
export function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Categories ───────────────────────────────────────────────────────

export const mockCategories: Category[] = [
  // Gastos
  { id: "cat-1", user_id: "user-1", nombre: "Alimentación", tipo: "gasto", color: "#f97316", icono: "utensils", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-2", user_id: "user-1", nombre: "Transporte", tipo: "gasto", color: "#3b82f6", icono: "bus", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-3", user_id: "user-1", nombre: "Entretenimiento", tipo: "gasto", color: "#a855f7", icono: "gamepad-2", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-4", user_id: "user-1", nombre: "Servicios", tipo: "gasto", color: "#06b6d4", icono: "wifi", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-5", user_id: "user-1", nombre: "Salud", tipo: "gasto", color: "#ef4444", icono: "heart-pulse", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-6", user_id: "user-1", nombre: "Educación", tipo: "gasto", color: "#8b5cf6", icono: "graduation-cap", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-7", user_id: "user-1", nombre: "Ropa", tipo: "gasto", color: "#ec4899", icono: "shirt", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-8", user_id: "user-1", nombre: "Hogar", tipo: "gasto", color: "#f59e0b", icono: "home", created_at: "2026-01-15T10:00:00Z" },
  // Ingresos
  { id: "cat-9", user_id: "user-1", nombre: "Salario", tipo: "ingreso", color: "#22c55e", icono: "briefcase", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-10", user_id: "user-1", nombre: "Freelance", tipo: "ingreso", color: "#10b981", icono: "laptop", created_at: "2026-01-15T10:00:00Z" },
  { id: "cat-11", user_id: "user-1", nombre: "Otros ingresos", tipo: "ingreso", color: "#6366f1", icono: "plus-circle", created_at: "2026-01-15T10:00:00Z" },
];

// ── Monthly Income ───────────────────────────────────────────────────

export const mockMonthlyIncome: MonthlyIncome[] = [
  { id: "mi-1", user_id: "user-1", mes: "2026-07", monto: 3500, created_at: "2026-07-01T00:00:00Z" },
  { id: "mi-2", user_id: "user-1", mes: "2026-06", monto: 3500, created_at: "2026-06-01T00:00:00Z" },
  { id: "mi-3", user_id: "user-1", mes: "2026-05", monto: 3200, created_at: "2026-05-01T00:00:00Z" },
  { id: "mi-4", user_id: "user-1", mes: "2026-04", monto: 3200, created_at: "2026-04-01T00:00:00Z" },
  { id: "mi-5", user_id: "user-1", mes: "2026-03", monto: 3000, created_at: "2026-03-01T00:00:00Z" },
  { id: "mi-6", user_id: "user-1", mes: "2026-02", monto: 3000, created_at: "2026-02-01T00:00:00Z" },
];

// ── Debts ────────────────────────────────────────────────────────────

/** Generate a payment schedule from first payment date, calculating monthly dates automatically. */
export function generatePaymentSchedule(
  montoTotal: number,
  numCuotas: number,
  fechaPrimeraCuota: string
): DebtPayment[] {
  const cuota = Math.round((montoTotal / numCuotas) * 100) / 100;
  const payments: DebtPayment[] = [];

  const [year, month, day] = fechaPrimeraCuota.split("-").map(Number);

  for (let i = 0; i < numCuotas; i++) {
    // Create target date by adding i months to the base month
    const targetMonth = month - 1 + i; // 0-indexed
    const d = new Date(year, targetMonth, day);

    // Handle overflow: e.g. Jan 31 → Feb would become Mar 3, so clamp to last day
    if (d.getDate() !== day) {
      d.setDate(0); // Go to last day of the intended month
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    payments.push({
      numero: i + 1,
      fecha: `${yyyy}-${mm}-${dd}`,
      monto: cuota,
      pagado: false,
    });
  }

  // Fix rounding on the last payment
  if (payments.length > 0) {
    const totalSoFar = payments.reduce((s, p) => s + p.monto, 0);
    const diff = montoTotal - totalSoFar;
    if (Math.abs(diff) > 0.001) {
      payments[payments.length - 1].monto = Math.round(
        (payments[payments.length - 1].monto + diff) * 100
      ) / 100;
    }
  }

  return payments;
}

/** Compute derived stats from a Debt. */
export function getDebtStats(debt: Debt) {
  const cuotasPagadas = debt.pagos.filter((p) => p.pagado).length;
  const montoPagado = debt.pagos
    .filter((p) => p.pagado)
    .reduce((sum, p) => sum + p.monto, 0);
  const remaining = debt.monto_total - montoPagado;
  const progressPercent =
    debt.monto_total > 0
      ? Math.min(100, Math.round((montoPagado / debt.monto_total) * 100))
      : 0;
  const isPaid = remaining <= 0.01;

  // Next pending payment
  const today = new Date().toISOString().split("T")[0];
  const nextPayment = debt.pagos.find((p) => !p.pagado);
  const overdueCount = debt.pagos.filter(
    (p) => !p.pagado && p.fecha < today
  ).length;

  return {
    cuotasPagadas,
    montoPagado,
    remaining,
    progressPercent,
    isPaid,
    nextPayment,
    overdueCount,
  };
}

// ── Mock Debts ───────────────────────────────────────────────────────

function buildMockDebt(
  id: string,
  nombre: string,
  montoTotal: number,
  numCuotas: number,
  fechaPrimera: string,
  tipo: "cuotas" | "directo",
  cuotasPagadas: number,
  createdAt: string
): Debt {
  const cuotaMensual = Math.round((montoTotal / numCuotas) * 100) / 100;
  const pagos = generatePaymentSchedule(montoTotal, numCuotas, fechaPrimera);

  // Mark first N payments as paid
  for (let i = 0; i < cuotasPagadas && i < pagos.length; i++) {
    pagos[i].pagado = true;
    pagos[i].fecha_pago = pagos[i].fecha;
  }

  return {
    id,
    user_id: "user-1",
    nombre,
    monto_total: montoTotal,
    cuota_mensual: cuotaMensual,
    num_cuotas: numCuotas,
    fecha_primera_cuota: fechaPrimera,
    tipo,
    pagos,
    created_at: createdAt,
  };
}

export const mockDebts: Debt[] = [
  buildMockDebt("debt-1", "MacBook Pro 16", 35000, 12, "2026-05-10", "cuotas", 3, "2026-05-01T10:00:00Z"),
  buildMockDebt("debt-2", "Curso Full-Stack", 3600, 6, "2026-06-01", "cuotas", 2, "2026-05-25T10:00:00Z"),
  buildMockDebt("debt-3", "iPhone 15 Pro", 25000, 24, "2026-03-15", "cuotas", 5, "2026-03-01T10:00:00Z"),
  buildMockDebt("debt-4", "Lavadora Samsung", 12000, 1, "2026-04-20", "directo", 1, "2026-04-15T10:00:00Z"),
];

// ── Transactions ─────────────────────────────────────────────────────

export const mockTransactions: Transaction[] = [
  // ── July 2026 ──
  { id: "tx-1",  user_id: "user-1", category_id: "cat-9",  monto: 3500, tipo: "ingreso", descripcion: "Salario mensual", fecha: "2026-07-01", created_at: "2026-07-01T10:00:00Z" },
  { id: "tx-2",  user_id: "user-1", category_id: "cat-1",  monto: 85.50, tipo: "gasto", descripcion: "Supermercado semanal", fecha: "2026-07-02", created_at: "2026-07-02T14:30:00Z" },
  { id: "tx-3",  user_id: "user-1", category_id: "cat-2",  monto: 30, tipo: "gasto", descripcion: "Recarga tarjeta transporte", fecha: "2026-07-03", created_at: "2026-07-03T08:15:00Z" },
  { id: "tx-4",  user_id: "user-1", category_id: "cat-4",  monto: 199, tipo: "gasto", descripcion: "Internet del mes", fecha: "2026-07-05", created_at: "2026-07-05T09:00:00Z" },
  { id: "tx-5",  user_id: "user-1", category_id: "cat-3",  monto: 150, tipo: "gasto", descripcion: "Cena con amigos", fecha: "2026-07-07", created_at: "2026-07-07T21:00:00Z" },
  { id: "tx-6",  user_id: "user-1", category_id: "cat-1",  monto: 42, tipo: "gasto", descripcion: "Almuerzo en restaurante", fecha: "2026-07-09", created_at: "2026-07-09T13:00:00Z" },
  { id: "tx-7",  user_id: "user-1", category_id: "cat-5",  monto: 350, tipo: "gasto", descripcion: "Consulta médica", fecha: "2026-07-10", created_at: "2026-07-10T11:00:00Z" },
  { id: "tx-8",  user_id: "user-1", category_id: "cat-10", monto: 800, tipo: "ingreso", descripcion: "Proyecto diseño web", fecha: "2026-07-12", created_at: "2026-07-12T16:00:00Z" },
  { id: "tx-9",  user_id: "user-1", category_id: "cat-1",  monto: 95, tipo: "gasto", descripcion: "Supermercado semanal", fecha: "2026-07-14", created_at: "2026-07-14T15:00:00Z" },
  { id: "tx-10", user_id: "user-1", category_id: "cat-8",  monto: 250, tipo: "gasto", descripcion: "Gas LP", fecha: "2026-07-15", created_at: "2026-07-15T10:30:00Z" },
  { id: "tx-11", user_id: "user-1", category_id: "cat-2",  monto: 45, tipo: "gasto", descripcion: "Uber al aeropuerto", fecha: "2026-07-18", created_at: "2026-07-18T06:00:00Z" },
  { id: "tx-12", user_id: "user-1", category_id: "cat-6",  monto: 299, tipo: "gasto", descripcion: "Curso online TypeScript", fecha: "2026-07-20", created_at: "2026-07-20T20:00:00Z" },

  // ── June 2026 ──
  { id: "tx-13", user_id: "user-1", category_id: "cat-9",  monto: 3500, tipo: "ingreso", descripcion: "Salario mensual", fecha: "2026-06-01", created_at: "2026-06-01T10:00:00Z" },
  { id: "tx-14", user_id: "user-1", category_id: "cat-10", monto: 500, tipo: "ingreso", descripcion: "Freelance logo", fecha: "2026-06-05", created_at: "2026-06-05T14:00:00Z" },
  { id: "tx-15", user_id: "user-1", category_id: "cat-1",  monto: 320, tipo: "gasto", descripcion: "Despensa quincenal", fecha: "2026-06-02", created_at: "2026-06-02T11:00:00Z" },
  { id: "tx-16", user_id: "user-1", category_id: "cat-4",  monto: 199, tipo: "gasto", descripcion: "Internet del mes", fecha: "2026-06-03", created_at: "2026-06-03T09:00:00Z" },
  { id: "tx-17", user_id: "user-1", category_id: "cat-4",  monto: 149, tipo: "gasto", descripcion: "Celular", fecha: "2026-06-03", created_at: "2026-06-03T09:05:00Z" },
  { id: "tx-18", user_id: "user-1", category_id: "cat-2",  monto: 60, tipo: "gasto", descripcion: "Gasolina", fecha: "2026-06-06", created_at: "2026-06-06T07:30:00Z" },
  { id: "tx-19", user_id: "user-1", category_id: "cat-3",  monto: 200, tipo: "gasto", descripcion: "Concierto", fecha: "2026-06-08", created_at: "2026-06-08T20:00:00Z" },
  { id: "tx-20", user_id: "user-1", category_id: "cat-7",  monto: 450, tipo: "gasto", descripcion: "Zapatos nuevos", fecha: "2026-06-10", created_at: "2026-06-10T16:00:00Z" },
  { id: "tx-21", user_id: "user-1", category_id: "cat-1",  monto: 280, tipo: "gasto", descripcion: "Despensa quincenal", fecha: "2026-06-15", created_at: "2026-06-15T12:00:00Z" },
  { id: "tx-22", user_id: "user-1", category_id: "cat-5",  monto: 180, tipo: "gasto", descripcion: "Farmacia", fecha: "2026-06-18", created_at: "2026-06-18T14:00:00Z" },
  { id: "tx-23", user_id: "user-1", category_id: "cat-8",  monto: 350, tipo: "gasto", descripcion: "Reparación plomería", fecha: "2026-06-20", created_at: "2026-06-20T10:00:00Z" },
  { id: "tx-24", user_id: "user-1", category_id: "cat-2",  monto: 55, tipo: "gasto", descripcion: "Gasolina", fecha: "2026-06-22", created_at: "2026-06-22T08:00:00Z" },
  { id: "tx-25", user_id: "user-1", category_id: "cat-3",  monto: 120, tipo: "gasto", descripcion: "Netflix + Spotify", fecha: "2026-06-25", created_at: "2026-06-25T09:00:00Z" },
  { id: "tx-26", user_id: "user-1", category_id: "cat-6",  monto: 150, tipo: "gasto", descripcion: "Libros técnicos", fecha: "2026-06-28", created_at: "2026-06-28T18:00:00Z" },

  // ── May 2026 ──
  { id: "tx-27", user_id: "user-1", category_id: "cat-9",  monto: 3200, tipo: "ingreso", descripcion: "Salario mensual", fecha: "2026-05-01", created_at: "2026-05-01T10:00:00Z" },
  { id: "tx-28", user_id: "user-1", category_id: "cat-1",  monto: 290, tipo: "gasto", descripcion: "Despensa quincenal", fecha: "2026-05-03", created_at: "2026-05-03T11:00:00Z" },
  { id: "tx-29", user_id: "user-1", category_id: "cat-4",  monto: 199, tipo: "gasto", descripcion: "Internet del mes", fecha: "2026-05-04", created_at: "2026-05-04T09:00:00Z" },
  { id: "tx-30", user_id: "user-1", category_id: "cat-2",  monto: 70, tipo: "gasto", descripcion: "Gasolina", fecha: "2026-05-06", created_at: "2026-05-06T07:00:00Z" },
  { id: "tx-31", user_id: "user-1", category_id: "cat-8",  monto: 180, tipo: "gasto", descripcion: "Artículos de limpieza", fecha: "2026-05-08", created_at: "2026-05-08T15:00:00Z" },
  { id: "tx-32", user_id: "user-1", category_id: "cat-3",  monto: 90, tipo: "gasto", descripcion: "Cine y palomitas", fecha: "2026-05-10", created_at: "2026-05-10T19:00:00Z" },
  { id: "tx-33", user_id: "user-1", category_id: "cat-1",  monto: 310, tipo: "gasto", descripcion: "Despensa quincenal", fecha: "2026-05-16", created_at: "2026-05-16T12:00:00Z" },
  { id: "tx-34", user_id: "user-1", category_id: "cat-5",  monto: 500, tipo: "gasto", descripcion: "Dentista", fecha: "2026-05-20", created_at: "2026-05-20T10:00:00Z" },
  { id: "tx-35", user_id: "user-1", category_id: "cat-11", monto: 200, tipo: "ingreso", descripcion: "Venta artículos usados", fecha: "2026-05-22", created_at: "2026-05-22T14:00:00Z" },
  { id: "tx-36", user_id: "user-1", category_id: "cat-2",  monto: 40, tipo: "gasto", descripcion: "Estacionamiento", fecha: "2026-05-25", created_at: "2026-05-25T13:00:00Z" },
  { id: "tx-37", user_id: "user-1", category_id: "cat-7",  monto: 350, tipo: "gasto", descripcion: "Chamarra", fecha: "2026-05-28", created_at: "2026-05-28T17:00:00Z" },
];

// ── Attach category objects to transactions ──────────────────────────

const categoryMap = new Map(mockCategories.map((c) => [c.id, c]));

// Enrich transactions with their category reference
for (const tx of mockTransactions) {
  tx.category = categoryMap.get(tx.category_id);
}

// ── Computed Data Helpers ─────────────────────────────────────────────

/** Get total income, expenses, and balance for a given YYYY-MM. */
export function getMonthlyStats(yearMonth: string) {
  const txs = mockTransactions.filter((t) => t.fecha.startsWith(yearMonth));
  const totalIngresos = txs
    .filter((t) => t.tipo === "ingreso")
    .reduce((sum, t) => sum + t.monto, 0);
  const totalGastos = txs
    .filter((t) => t.tipo === "gasto")
    .reduce((sum, t) => sum + t.monto, 0);

  return {
    totalIngresos,
    totalGastos,
    balance: totalIngresos - totalGastos,
  };
}

/** Get expenses grouped by category for a given YYYY-MM. */
export function getExpensesByCategory(yearMonth: string) {
  const txs = mockTransactions.filter(
    (t) => t.fecha.startsWith(yearMonth) && t.tipo === "gasto"
  );

  const grouped = new Map<string, { category: Category; total: number }>();

  for (const tx of txs) {
    const cat = categoryMap.get(tx.category_id);
    if (!cat) continue;
    const existing = grouped.get(cat.id);
    if (existing) {
      existing.total += tx.monto;
    } else {
      grouped.set(cat.id, { category: cat, total: tx.monto });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
}

/** Get monthly evolution data for charts (last 6 months). */
export function getMonthlyEvolution() {
  const months: string[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  return months.map((ym) => {
    const stats = getMonthlyStats(ym);
    const [, month] = ym.split("-");
    const date = new Date(parseInt(ym.split("-")[0]), parseInt(month) - 1, 1);
    const label = date.toLocaleDateString("es-MX", { month: "short" });

    return {
      mes: label.charAt(0).toUpperCase() + label.slice(1),
      yearMonth: ym,
      ingresos: stats.totalIngresos,
      gastos: stats.totalGastos,
      balance: stats.balance,
    };
  });
}

/** Get the N most recent transactions, sorted by date descending. */
export function getRecentTransactions(limit = 8): Transaction[] {
  return [...mockTransactions]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limit);
}

/** Filter transactions by month, category, and/or date range. */
export function filterTransactions(filters: {
  yearMonth?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Transaction[] {
  let result = [...mockTransactions];

  if (filters.yearMonth) {
    result = result.filter((t) => t.fecha.startsWith(filters.yearMonth!));
  }
  if (filters.categoryId) {
    result = result.filter((t) => t.category_id === filters.categoryId);
  }
  if (filters.dateFrom) {
    result = result.filter((t) => t.fecha >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((t) => t.fecha <= filters.dateTo!);
  }

  return result.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
