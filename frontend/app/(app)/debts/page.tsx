"use client";

import { useEffect, useState } from "react";
import { Debt } from "@/lib/types";
import { DebtFormData } from "@/lib/validations";
import { getDebtStats, formatCurrency } from "@/lib/mock-data";
import { DebtCard } from "@/components/debts/debt-card";
import { DebtDetail } from "@/components/debts/debt-detail";
import { DebtForm } from "@/components/debts/debt-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingDown, CheckCircle, Scale, Landmark, CalendarRange, AlertTriangle, Clock, Search } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debtFilter, setDebtFilter] = useState<'todas' | 'activas' | 'pagadas' | 'vencidas'>('todas');
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);

  const handleSelectToggle = (id: string) => {
    setSelectedDebtIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const fetchDebts = async () => {
    try {
      setIsLoading(true);
      const data = await api.debts.getAll();
      setDebts(data);
      // Actualizar detalle si está abierto para reflejar cambios
      if (detailDebt) {
        const updatedDetail = data.find(d => d.id === detailDebt.id);
        if (updatedDetail) {
          setDetailDebt(updatedDetail);
        }
      }
    } catch (error) {
      console.error("Error al cargar deudas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchDebts();
  }, []);

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.debts.delete(id);
      if (detailDebt?.id === id) {
        setDetailDebt(null);
      }
      setSelectedDebtIds(prev => prev.filter(item => item !== id));
      fetchDebts();
    } catch (error) {
      console.error("Error al eliminar deuda:", error);
    }
  };

  const handleSave = async (data: DebtFormData) => {
    try {
      if (editingDebt) {
        await api.debts.update(editingDebt.id, data);
      } else {
        await api.debts.create(data);
      }
      fetchDebts();
    } catch (error) {
      console.error("Error al guardar deuda:", error);
    }
  };

  const handleTogglePayment = async (debtId: string, paymentNumero: number) => {
    const targetDebt = debts.find(d => d.id === debtId);
    if (!targetDebt) return;
    
    const payment = targetDebt.pagos.find(p => p.numero === paymentNumero);
    if (!payment) return;

    try {
      await api.debts.togglePayment(debtId, payment.id!);
      fetchDebts();
    } catch (error) {
      console.error("Error al marcar pago:", error);
    }
  };

  const handleViewDetail = (debt: Debt) => {
    setDetailDebt(debt);
  };

  if (!isMounted) return null;

  const totalRestante = debts.reduce((acc, debt) => acc + getDebtStats(debt).remaining, 0);
  const totalPagado = debts.reduce((acc, debt) => acc + getDebtStats(debt).montoPagado, 0);
  const totalGeneral = debts.reduce((acc, debt) => acc + debt.monto_total, 0);
  const progressGlobal = totalGeneral > 0 ? (totalPagado / totalGeneral) * 100 : 0;

  const activeDebts = debts.filter(d => !getDebtStats(d).isPaid);
  const paidDebts = debts.filter(d => getDebtStats(d).isPaid);

  // Consolidated monthly payment of active debts
  const totalCuotaMensual = activeDebts.reduce((acc, debt) => acc + debt.cuota_mensual, 0);

  // --- Alerts Calculations ---
  const today = new Date().toISOString().split('T')[0];
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = nextWeekDate.toISOString().split('T')[0];

  let overdueCount = 0;
  let overdueAmount = 0;
  let upcomingCount = 0;
  let upcomingAmount = 0;

  debts.forEach(debt => {
    debt.pagos.forEach(p => {
      if (!p.pagado) {
        if (p.fecha < today) {
          overdueCount++;
          overdueAmount += p.monto;
        } else if (p.fecha >= today && p.fecha <= nextWeekStr) {
          upcomingCount++;
          upcomingAmount += p.monto;
        }
      }
    });
  });

  // --- Search and Filters ---
  const countTodas = debts.length;
  const countActivas = activeDebts.length;
  const countPagadas = paidDebts.length;
  const countVencidas = debts.filter(d => d.pagos.some(p => !p.pagado && p.fecha < today)).length;

  const filteredDebts = debts.filter(debt => {
    if (searchQuery && !debt.nombre.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    const isPaid = getDebtStats(debt).isPaid;
    const isOverdue = debt.pagos.some(p => !p.pagado && p.fecha < today);

    if (debtFilter === 'activas' && isPaid) return false;
    if (debtFilter === 'pagadas' && !isPaid) return false;
    if (debtFilter === 'vencidas' && !isOverdue) return false;
    return true;
  });

  const isDefaultView = debtFilter === 'todas' && !searchQuery;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deudas a Pagar</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus deudas y mantén el control de tus pagos</p>
        </div>
        <Button onClick={() => { setEditingDebt(null); setIsFormOpen(true); }} className="shrink-0" disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva deuda
        </Button>
      </div>

      {(overdueCount > 0 || upcomingCount > 0) && (
        <div className="space-y-3">
          {overdueCount > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Tienes {overdueCount} cuota{overdueCount !== 1 ? 's' : ''} vencida{overdueCount !== 1 ? 's' : ''} que requiere{overdueCount !== 1 ? 'n' : ''} atención</h4>
                <p className="text-sm mt-1">Monto total vencido: {formatCurrency(overdueAmount)}</p>
              </div>
            </div>
          )}
          {upcomingCount > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-500 rounded-xl p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Tienes {upcomingCount} cuota{upcomingCount !== 1 ? 's' : ''} por vencer esta semana</h4>
                <p className="text-sm mt-1">Monto total próximo a vencer: {formatCurrency(upcomingAmount)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Deuda Restante</CardTitle>
            <div className="bg-destructive/10 p-2 rounded-full">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatCurrency(totalRestante)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Monto Total Pagado</CardTitle>
            <div className="bg-green-500/10 p-2 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatCurrency(totalPagado)}</div>
          </CardContent>
        </Card>
        <Card className={cn("shadow-sm transition-all duration-300", selectedDebtIds.length > 0 && "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              {selectedDebtIds.length > 0 ? "Pago Mensual Seleccionado" : "Pago Mensual Total"}
            </CardTitle>
            <div className="bg-blue-500/10 p-2 rounded-full">
              <CalendarRange className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-blue-500">
              {formatCurrency(
                selectedDebtIds.length > 0
                  ? activeDebts.filter(d => selectedDebtIds.includes(d.id)).reduce((acc, d) => acc + d.cuota_mensual, 0)
                  : totalCuotaMensual
              )}
            </div>
            {selectedDebtIds.length > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5 pt-1 border-t border-blue-100 dark:border-blue-900/50">
                <span>Total: {formatCurrency(totalCuotaMensual)} ({selectedDebtIds.length} sel.)</span>
                <button
                  onClick={() => setSelectedDebtIds([])}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  Limpiar
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Progreso General</CardTitle>
            <div className="bg-emerald-500/10 p-2 rounded-full">
              <Scale className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold tracking-tight">{Math.round(progressGlobal)}%</div>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressGlobal}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar deuda por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          <Button 
            variant={debtFilter === 'todas' ? 'default' : 'outline'} 
            className="rounded-full shrink-0"
            onClick={() => setDebtFilter('todas')}
          >
            Todas
            <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-xs", debtFilter === 'todas' ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{countTodas}</span>
          </Button>
          <Button 
            variant={debtFilter === 'activas' ? 'default' : 'outline'} 
            className="rounded-full shrink-0"
            onClick={() => setDebtFilter('activas')}
          >
            Activas
            <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-xs", debtFilter === 'activas' ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{countActivas}</span>
          </Button>
          <Button 
            variant={debtFilter === 'pagadas' ? 'default' : 'outline'} 
            className="rounded-full shrink-0"
            onClick={() => setDebtFilter('pagadas')}
          >
            Pagadas
            <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-xs", debtFilter === 'pagadas' ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{countPagadas}</span>
          </Button>
          <Button 
            variant={debtFilter === 'vencidas' ? 'default' : 'outline'} 
            className="rounded-full shrink-0"
            onClick={() => setDebtFilter('vencidas')}
          >
            Con Vencidas
            <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-xs", debtFilter === 'vencidas' ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>{countVencidas}</span>
          </Button>
        </div>
      </div>

      {isDefaultView ? (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold tracking-tight">Deudas Activas</h2>
            <div className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {activeDebts.length}
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando deudas...</div>
          ) : activeDebts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeDebts.map(debt => (
                <DebtCard 
                  key={debt.id} 
                  debt={debt} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  onViewDetail={handleViewDetail} 
                  isSelected={selectedDebtIds.includes(debt.id)}
                  onSelectToggle={handleSelectToggle}
                />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-14 text-center border-dashed border-2 shadow-sm bg-muted/20">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Landmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No hay deudas activas</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                ¡Excelente! No tienes deudas pendientes en este momento. Puedes agregar una nueva si necesitas darle seguimiento.
              </p>
              <Button onClick={() => { setEditingDebt(null); setIsFormOpen(true); }} variant="outline" className="font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Agregar deuda
              </Button>
            </Card>
          )}
        </div>

        {paidDebts.length > 0 && !isLoading && (
          <div className="opacity-80 mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-lg font-semibold text-muted-foreground">Historial de Deudas Pagadas</h2>
              <div className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {paidDebts.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {paidDebts.map(debt => (
                <DebtCard 
                  key={debt.id} 
                  debt={debt} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  onViewDetail={handleViewDetail} 
                  isSelected={selectedDebtIds.includes(debt.id)}
                  onSelectToggle={handleSelectToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      ) : (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold tracking-tight">Resultados de Búsqueda</h2>
          <div className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {filteredDebts.length}
          </div>
        </div>
        
        {filteredDebts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredDebts.map(debt => (
              <DebtCard 
                key={debt.id} 
                debt={debt} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onViewDetail={handleViewDetail} 
                isSelected={selectedDebtIds.includes(debt.id)}
                onSelectToggle={handleSelectToggle}
              />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-14 text-center border-dashed border-2 shadow-sm bg-muted/20">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No se encontraron resultados</h3>
            <p className="text-muted-foreground">
              Intenta ajustar tus filtros o término de búsqueda.
            </p>
          </Card>
        )}
      </div>
      )}

      <DebtForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        debt={editingDebt} 
        onSave={handleSave} 
      />
      
      <DebtDetail 
        open={!!detailDebt} 
        onOpenChange={(o) => !o && setDetailDebt(null)} 
        debt={detailDebt} 
        onTogglePayment={handleTogglePayment} 
      />
    </div>
  );
}
