export type TransactionType = "gasto" | "ingreso";

export interface Category {
  id: string;
  user_id: string;
  nombre: string;
  tipo: TransactionType;
  color: string;
  icono: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  monto: number;
  tipo: TransactionType;
  descripcion: string | null;
  fecha: string;
  created_at: string;
  // Joined field
  category?: Category;
}

export interface MonthlyIncome {
  id: string;
  user_id: string;
  mes: string; // formato YYYY-MM
  monto: number;
  created_at: string;
}

export interface DebtPayment {
  id?: string;
  numero: number;
  fecha: string; // YYYY-MM-DD
  monto: number;
  pagado: boolean;
  fecha_pago?: string; // fecha real en que se pagó
}

export interface Debt {
  id: string;
  user_id: string;
  nombre: string;
  monto_total: number;
  cuota_mensual: number;
  num_cuotas: number;
  fecha_primera_cuota: string; // YYYY-MM-DD
  tipo: "cuotas" | "directo";
  pagos: DebtPayment[];
  created_at: string;
}
