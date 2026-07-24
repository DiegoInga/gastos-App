const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gastos-app-token') : null;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || 'Ocurrió un error inesperado';
    throw new ApiError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, response.status);
  }

  return data as T;
}

export const api = {
  auth: {
    async login(email: string, password: string) {
      const data = await apiFetch<{ access_token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('gastos-app-token', data.access_token);
        document.cookie = `token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }
      return data.user;
    },

    async register(email: string, password: string, nombre: string) {
      const data = await apiFetch<{ access_token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, nombre }),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('gastos-app-token', data.access_token);
        document.cookie = `token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }
      return data.user;
    },

    async me() {
      return apiFetch<any>('/auth/me');
    },

    logout() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gastos-app-token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    },

    async updateProfile(data: { nombre?: string; password?: string }) {
      return apiFetch<any>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    isAuthenticated() {
      if (typeof window !== 'undefined') {
        return !!localStorage.getItem('gastos-app-token');
      }
      return false;
    }
  },

  debts: {
    async getAll() {
      return apiFetch<any[]>('/debts');
    },

    async create(data: { nombre: string; monto_total: number; tipo: 'cuotas' | 'directo'; num_cuotas?: number; fecha_primera_cuota: string }) {
      return apiFetch<any>('/debts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: { nombre?: string; monto_total?: number; tipo?: 'cuotas' | 'directo'; num_cuotas?: number; fecha_primera_cuota?: string }) {
      return apiFetch<any>(`/debts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async delete(id: string) {
      return apiFetch<void>(`/debts/${id}`, {
        method: 'DELETE',
      });
    },

    async togglePayment(debtId: string, paymentId: string) {
      return apiFetch<any>(`/debts/${debtId}/payments/${paymentId}/toggle`, {
        method: 'PATCH',
      });
    }
  },

  dashboard: {
    async getStats() {
      return apiFetch<{
        totalDeudaRestante: number;
        totalPagado: number;
        totalGeneral: number;
        progressGlobal: number;
        activeDebtsCount: number;
        overdueCount: number;
        totalGastosFijos: number;
      }>('/dashboard/stats');
    }
  },

  income: {
    async get(yearMonth: string) {
      return apiFetch<{ mes: string; monto: number }>(`/income/${yearMonth}`);
    },

    async upsert(yearMonth: string, monto: number) {
      return apiFetch<{ mes: string; monto: number }>(`/income/${yearMonth}`, {
        method: 'PUT',
        body: JSON.stringify({ monto }),
      });
    }
  },

  fixedExpenses: {
    async getAll() {
      return apiFetch<any[]>('/fixed-expenses');
    },

    async create(data: { nombre: string; monto: number; categoria: string }) {
      return apiFetch<any>('/fixed-expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: { nombre?: string; monto?: number; categoria?: string; activo?: boolean }) {
      return apiFetch<any>(`/fixed-expenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async delete(id: string) {
      return apiFetch<void>(`/fixed-expenses/${id}`, {
        method: 'DELETE',
      });
    }
  }
};
