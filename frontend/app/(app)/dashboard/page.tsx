"use client";

import { useState, useEffect } from "react";
import { getCurrentYearMonth, getMonthName, formatCurrency, formatDate } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { Debt, DebtPayment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  CalendarDays, 
  CheckCircle2, 
  Edit2
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function DashboardPage() {
  const currentYearMonth = getCurrentYearMonth();
  const [year, month] = currentYearMonth.split("-");
  const monthName = getMonthName(currentYearMonth);

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeudaRestante: 0,
    totalPagado: 0,
    totalGeneral: 0,
    progressGlobal: 0,
    activeDebtsCount: 0,
    overdueCount: 0,
    totalGastosFijos: 0,
  });

  const [debts, setDebts] = useState<Debt[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  
  // Income form state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeInputValue, setIncomeInputValue] = useState("");
  const [isSavingIncome, setIsSavingIncome] = useState(false);

  // Load data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dbStats, dbDebts, dbIncome] = await Promise.all([
        api.dashboard.getStats(),
        api.debts.getAll(),
        api.income.get(currentYearMonth).catch(() => ({ monto: 0 })),
      ]);

      setStats(dbStats);
      setDebts(dbDebts);
      setMonthlyIncome(dbIncome?.monto || 0);
      setIncomeInputValue((dbIncome?.monto || 0).toString());
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleIncomeSave = async () => {
    try {
      setIsSavingIncome(true);
      const val = parseFloat(incomeInputValue);
      if (isNaN(val) || val < 0) return;
      
      await api.income.upsert(currentYearMonth, val);
      setMonthlyIncome(val);
      setIsIncomeModalOpen(false);
    } catch (error) {
      console.error("Error al guardar presupuesto:", error);
    } finally {
      setIsSavingIncome(false);
    }
  };

  const handleTogglePayment = async (debtId: string, paymentId: string) => {
    try {
      await api.debts.togglePayment(debtId, paymentId);
      // Reload debts to get fresh state (or we could optimistically update)
      await loadDashboardData();
    } catch (error) {
      console.error("Error al marcar pago:", error);
    }
  };

  // --- Computations ---

  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = nextWeekDate.toISOString().split("T")[0];

  const allPayments: { debtId: string; debtNombre: string; payment: DebtPayment }[] = [];
  debts.forEach((d) => {
    d.pagos.forEach((p) => {
      allPayments.push({ debtId: d.id, debtNombre: d.nombre, payment: p });
    });
  });

  // Current month total payments
  const currentMonthPayments = allPayments.filter((ap) => ap.payment.fecha.startsWith(currentYearMonth));
  const totalCuotasMes = currentMonthPayments.reduce((sum, ap) => sum + ap.payment.monto, 0);

  const balance = monthlyIncome - totalCuotasMes - stats.totalGastosFijos;

  // Overdue
  const overduePayments = allPayments.filter(
    (ap) => !ap.payment.pagado && ap.payment.fecha < todayStr
  );

  // Upcoming (next 7 days, excluding overdue)
  const upcomingPayments = allPayments.filter(
    (ap) => !ap.payment.pagado && ap.payment.fecha >= todayStr && ap.payment.fecha <= nextWeekStr
  ).sort((a, b) => a.payment.fecha.localeCompare(b.payment.fecha));

  // Chart data: upcoming 6 months of scheduled payments
  const monthsData: { label: string; amount: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const ym = `${yyyy}-${mm}`;
    
    const amount = allPayments
      .filter((ap) => ap.payment.fecha.startsWith(ym))
      .reduce((sum, ap) => sum + ap.payment.monto, 0);
      
    const label = d.toLocaleDateString("es-MX", { month: "short" }).toUpperCase();
    monthsData.push({ label, amount });
  }

  // --- Render Helpers ---

  const calculateDaysOverdue = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const nowD = new Date();
    const diffMs = nowD.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground capitalize">
            Resumen de {monthName} {year}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Ingreso Mensual */}
            <Card className="relative overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso Mensual</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(monthlyIncome)}</div>
                  <Dialog open={isIncomeModalOpen} onOpenChange={setIsIncomeModalOpen}>
                    <DialogTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar Ingreso Mensual</DialogTitle>
                      </DialogHeader>
                      <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                          <Label htmlFor="income" className="sr-only">Ingreso</Label>
                          <Input
                            id="income"
                            type="number"
                            step="0.01"
                            value={incomeInputValue}
                            onChange={(e) => setIncomeInputValue(e.target.value)}
                            placeholder="Ej. 3000"
                          />
                        </div>
                        <Button type="button" onClick={handleIncomeSave} disabled={isSavingIncome}>
                          {isSavingIncome ? "Guardando..." : "Guardar"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Pago Mensual Total */}
            <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pago Mensual Total</CardTitle>
                <CalendarDays className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCuotasMes)}</div>
                <p className="text-xs text-muted-foreground mt-1">Cuotas programadas este mes</p>
              </CardContent>
            </Card>

            {/* Saldo Disponible */}
            <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponible</CardTitle>
                <Wallet className={cn("h-4 w-4", balance >= 0 ? "text-emerald-500" : "text-destructive")} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", balance >= 0 ? "text-emerald-500" : "text-destructive")}>
                  {formatCurrency(balance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresos - Pagos ({formatCurrency(totalCuotasMes)}) - Gastos Fijos ({formatCurrency(stats.totalGastosFijos)})
                </p>
              </CardContent>
            </Card>

            {/* Progreso General */}
            <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Progreso General</CardTitle>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{stats.progressGlobal}%</div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${stats.progressGlobal}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Alerts */}
          {overduePayments.length > 0 && (
            <Card className="border-destructive bg-destructive/5 shadow-md">
              <CardHeader className="pb-3 border-b border-destructive/10">
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Pagos Atrasados ({overduePayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-destructive/10">
                  {overduePayments.map((op, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                      <div>
                        <div className="font-semibold text-foreground">{op.debtNombre}</div>
                        <div className="text-sm text-muted-foreground">Cuota #{op.payment.numero}</div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                        <div className="font-bold text-destructive">{formatCurrency(op.payment.monto)}</div>
                        <Badge variant="destructive" className="whitespace-nowrap">
                          {calculateDaysOverdue(op.payment.fecha)} días atraso
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Payments */}
            <Card className="flex flex-col shadow-sm border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  Próximos Pagos (7 días)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-y-auto max-h-[400px]">
                {upcomingPayments.length > 0 ? (
                  <div className="divide-y divide-border">
                    {upcomingPayments.map((up, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-medium text-foreground">{up.debtNombre}</div>
                          <div className="text-sm text-muted-foreground">
                            Cuota #{up.payment.numero} &bull; {formatDate(up.payment.fecha)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="font-bold text-foreground">{formatCurrency(up.payment.monto)}</div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                            onClick={() => handleTogglePayment(up.debtId, up.payment.id!)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Pagada
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm">No hay cuotas programadas para los próximos 7 días.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Evolution Chart */}
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Proyección de Pagos (6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <XAxis 
                        dataKey="label" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `S/ ${value}`} 
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Monto Total']}
                        labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="currentColor" 
                        radius={[4, 4, 0, 0]} 
                        className="fill-primary"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
