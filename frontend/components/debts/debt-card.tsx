"use client";

import { Debt } from "@/lib/types";
import { formatCurrency, formatDate, getDebtStats } from "@/lib/mock-data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
  onViewDetail: (debt: Debt) => void;
}

export function DebtCard({ debt, onEdit, onDelete, onViewDetail }: DebtCardProps) {
  const stats = getDebtStats(debt);
  const isPaid = stats.isPaid;

  return (
    <Card className="overflow-hidden flex flex-col h-full bg-card shadow-sm hover:shadow-md transition-shadow">
      <div
        className={cn(
          "h-1 w-full shrink-0",
          isPaid ? "bg-green-500" : "bg-emerald-500"
        )}
      />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg leading-tight mb-1.5">{debt.nombre}</CardTitle>
            <Badge variant="secondary" className="font-normal text-xs">
              {debt.tipo === "cuotas" ? `${debt.num_cuotas} cuotas` : "Pago directo"}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0 -mr-2 -mt-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(debt)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(debt.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Restante</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {formatCurrency(stats.remaining)}
          </p>
        </div>

        <div className="flex justify-between items-end gap-2 text-sm">
          <div className="space-y-0.5">
            <p className="text-muted-foreground/80 text-xs font-medium">Total: {formatCurrency(debt.monto_total)}</p>
            <p className="text-muted-foreground/80 text-xs font-medium">Pagado: {formatCurrency(stats.montoPagado)}</p>
          </div>
          <p className="font-semibold text-muted-foreground">{Math.round(stats.progressPercent)}%</p>
        </div>

        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", isPaid ? "bg-green-500" : "bg-emerald-500")} 
            style={{ width: `${Math.min(100, Math.max(0, stats.progressPercent))}%` }} 
          />
        </div>

        {isPaid ? (
          <p className="text-sm font-medium text-green-500 bg-green-500/10 px-3 py-2 rounded-md inline-flex">Deuda completamente pagada</p>
        ) : (
          <div className="space-y-1.5">
            {stats.nextPayment && (
              <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md inline-block w-full">
                Próximo: <span className="font-semibold text-foreground">{formatDate(stats.nextPayment.fecha)}</span> ({formatCurrency(stats.nextPayment.monto)})
              </p>
            )}
            {stats.overdueCount > 0 && (
              <p className="text-sm font-medium text-destructive px-3 py-1">
                {stats.overdueCount} cuota(s) vencida(s)
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 mt-auto border-t border-border/30">
        <Button variant="secondary" className="w-full font-semibold" onClick={() => onViewDetail(debt)}>
          Ver Detalle
        </Button>
      </CardFooter>
    </Card>
  );
}
