"use client";

import { useState } from "react";
import { Debt } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getDebtStats } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface DebtDetailProps {
  debt: Debt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePayment: (debtId: string, paymentNumero: number) => void;
}

export function DebtDetail({ debt, open, onOpenChange, onTogglePayment }: DebtDetailProps) {
  const [filter, setFilter] = useState<"todos" | "pagado" | "pendiente" | "vencido">("todos");

  if (!debt) return null;

  const stats = getDebtStats(debt);
  const today = new Date().toISOString().split("T")[0];

  // 1. Sort payments chronologically by number
  const sortedPagos = [...debt.pagos].sort((a, b) => a.numero - b.numero);

  // 2. Filter payments by status
  const filteredPagos = sortedPagos.filter((pago) => {
    const isOverdue = !pago.pagado && pago.fecha < today;
    if (filter === "todos") return true;
    if (filter === "pagado") return pago.pagado;
    if (filter === "vencido") return isOverdue;
    if (filter === "pendiente") return !pago.pagado && !isOverdue;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl! max-h-[90vh] md:max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header and stats */}
        <div className="p-4 md:p-6 pb-5 border-b bg-card shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold">{debt.nombre}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 md:mt-6 space-y-5 md:space-y-6">
            {/* Responsive grid of cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-muted/40 p-3 md:p-4 rounded-xl border border-border/55 space-y-1 shadow-sm">
                <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Monto Total</p>
                <p className="font-bold text-base md:text-xl tracking-tight">{formatCurrency(debt.monto_total)}</p>
              </div>
              <div className="bg-muted/40 p-3 md:p-4 rounded-xl border border-border/55 space-y-1 shadow-sm">
                <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Pagado</p>
                <p className="font-bold text-base md:text-xl tracking-tight text-emerald-500">{formatCurrency(stats.montoPagado)}</p>
              </div>
              <div className="bg-muted/40 p-3 md:p-4 rounded-xl border border-border/55 space-y-1 shadow-sm">
                <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Deuda Restante</p>
                <p className="font-bold text-base md:text-xl tracking-tight text-rose-500">{formatCurrency(stats.remaining)}</p>
              </div>
              <div className="bg-muted/40 p-3 md:p-4 rounded-xl border border-border/55 space-y-1 shadow-sm">
                <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {debt.tipo === "cuotas" ? "Cuota Mensual" : "Tipo de Pago"}
                </p>
                <p className="font-bold text-base md:text-xl tracking-tight">
                  {debt.tipo === "cuotas" ? formatCurrency(debt.cuota_mensual) : "Directo"}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 bg-muted/40 p-3 md:p-4 rounded-xl border border-border/55 shadow-sm">
              <div className="flex justify-between text-xs md:text-sm font-bold text-foreground/90">
                <span>Progreso de amortización</span>
                <span>{Math.round(stats.progressPercent)}%</span>
              </div>
              <div className="w-full bg-secondary h-2.5 md:h-3 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", stats.isPaid ? "bg-green-500" : "bg-emerald-500")} 
                  style={{ width: `${Math.min(100, Math.max(0, stats.progressPercent))}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="px-4 md:px-6 py-2.5 md:py-3 border-b bg-muted/20 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {(["todos", "pagado", "pendiente", "vencido"] as const).map((opt) => {
            const label = opt === "todos" ? "Todos" : opt === "pagado" ? "Pagadas" : opt === "pendiente" ? "Pendientes" : "Vencidas";
            const isActive = filter === opt;
            const count = sortedPagos.filter((pago) => {
              const isOverdue = !pago.pagado && pago.fecha < today;
              if (opt === "todos") return true;
              if (opt === "pagado") return pago.pagado;
              if (opt === "vencido") return isOverdue;
              if (opt === "pendiente") return !pago.pagado && !isOverdue;
              return true;
            }).length;

            return (
              <Button
                key={opt}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs font-semibold px-3.5 h-8 shrink-0 flex items-center"
                onClick={() => setFilter(opt)}
              >
                {label}
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-5 text-center",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Main List/Table Container */}
        {filteredPagos.length > 0 ? (
          <>
            {/* 1. Mobile View (Card List) */}
            <div className="block md:hidden flex-grow overflow-y-auto p-4 space-y-3 bg-muted/10">
              {filteredPagos.map((pago) => {
                const isOverdue = !pago.pagado && pago.fecha < today;
                return (
                  <div 
                    key={pago.numero} 
                    className={cn(
                      "p-3 rounded-xl border border-border/60 bg-card flex flex-col gap-2.5 shadow-sm transition-opacity",
                      pago.pagado && "opacity-70 bg-muted/20"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                          #{pago.numero}
                        </span>
                        <span className="text-xs font-semibold">{formatDate(pago.fecha)}</span>
                      </div>
                      {pago.pagado ? (
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0 text-[10px] pointer-events-none px-2 py-0">Pagada</Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="border-0 text-[10px] pointer-events-none px-2 py-0">Vencida</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 text-[10px] pointer-events-none px-2 py-0">Pendiente</Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-border/40 pt-2">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">Monto</p>
                        <p className="font-bold text-sm text-foreground">{formatCurrency(pago.monto)}</p>
                      </div>
                      
                      <Button 
                        variant={pago.pagado ? "outline" : "default"} 
                        size="sm"
                        onClick={() => onTogglePayment(debt.id, pago.numero)}
                        className="font-semibold text-xs h-7.5 px-3.5"
                      >
                        {pago.pagado ? "Desmarcar" : "Marcar pagada"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop View (Structured Table) */}
            <div className="hidden md:block flex-grow overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10 shadow-sm border-b">
                  <TableRow>
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right pr-6">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagos.map((pago) => {
                    const isOverdue = !pago.pagado && pago.fecha < today;
                    return (
                      <TableRow key={pago.numero} className={cn(pago.pagado && "opacity-60 bg-muted/20 hover:bg-muted/40 transition-colors")}>
                        <TableCell className="font-medium text-center">{pago.numero}</TableCell>
                        <TableCell className={cn(pago.pagado ? "text-muted-foreground" : "font-medium")}>
                          {formatDate(pago.fecha)}
                        </TableCell>
                        <TableCell className={cn(pago.pagado ? "text-muted-foreground" : "font-medium")}>
                          {formatCurrency(pago.monto)}
                        </TableCell>
                        <TableCell>
                          {pago.pagado ? (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0 pointer-events-none">Pagada</Badge>
                          ) : isOverdue ? (
                            <Badge variant="destructive" className="border-0 pointer-events-none">Vencida</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 pointer-events-none">Pendiente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant={pago.pagado ? "outline" : "default"} 
                            size="sm"
                            onClick={() => onTogglePayment(debt.id, pago.numero)}
                            className={cn("w-[130px]", pago.pagado ? "text-muted-foreground" : "")}
                          >
                            {pago.pagado ? "Desmarcar" : "Marcar pagada"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground flex-grow flex items-center justify-center">
            No hay cuotas que coincidan con este filtro.
          </div>
        )}
        
        {/* Footer */}
        <div className="p-4 border-t bg-muted/40 shrink-0 flex justify-between items-center px-6">
          <p className="text-xs text-muted-foreground">Mostrando {filteredPagos.length} cuotas</p>
          <p className="font-bold text-sm">
            Total Deuda: <span className="ml-2 text-foreground font-extrabold">{formatCurrency(debt.monto_total)}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
