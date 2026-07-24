"use client";

import { Transaction } from "@/lib/types";
import { formatCurrency, formatRelativeDate } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Últimas Transacciones</CardTitle>
        <Link href="/transactions" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center transition-colors">
          Ver todas <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: tx.category?.color || "hsl(var(--muted))" }} 
                />
                <div>
                  <p className="text-sm font-medium leading-none mb-1">
                    {tx.category?.nombre || "Sin Categoría"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatRelativeDate(tx.fecha)}</span>
                    {tx.descripcion && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{tx.descripcion}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={cn(
                "font-semibold text-sm",
                tx.tipo === "ingreso" ? "text-green-500" : "text-foreground"
              )}>
                {tx.tipo === "ingreso" ? "+" : "-"}{formatCurrency(tx.monto)}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center text-muted-foreground py-6 text-sm">
              No hay transacciones recientes.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
