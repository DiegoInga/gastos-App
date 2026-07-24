"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
}

export function SummaryCards({ totalIngresos, totalGastos, balance }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-t-2 border-t-green-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ingreso Total
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIngresos)}</div>
        </CardContent>
      </Card>

      <Card className="border-t-2 border-t-rose-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gasto Total
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalGastos)}</div>
        </CardContent>
      </Card>

      <Card className={cn("border-t-2 shadow-sm", balance >= 0 ? "border-t-green-500" : "border-t-rose-500")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Balance
          </CardTitle>
          <Wallet className={cn("h-4 w-4", balance >= 0 ? "text-green-500" : "text-rose-500")} />
        </CardHeader>
        <CardContent>
          <div className={cn("text-3xl font-bold", balance >= 0 ? "text-green-500" : "text-rose-500")}>
            {formatCurrency(balance)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
