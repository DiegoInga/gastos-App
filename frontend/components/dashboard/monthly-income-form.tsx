"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, getMonthName } from "@/lib/mock-data";
import { monthlyIncomeSchema } from "@/lib/validations";
import { Edit2, Check, X } from "lucide-react";

interface MonthlyIncomeFormProps {
  currentIncome: number;
  month: string; // YYYY-MM
  onSaveOverride?: (monto: number) => void;
}

export function MonthlyIncomeForm({ currentIncome: initialIncome, month, onSaveOverride }: MonthlyIncomeFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [income, setIncome] = useState(initialIncome);
  const [inputValue, setInputValue] = useState(initialIncome.toString());
  const [error, setError] = useState<string | null>(null);

  // Sync initialIncome if it changes externally
  useEffect(() => {
    setIncome(initialIncome);
    setInputValue(initialIncome.toString());
  }, [initialIncome]);

  const monthName = getMonthName(month);

  const handleSave = () => {
    const result = monthlyIncomeSchema.safeParse({
      mes: month,
      monto: Number(inputValue),
      user_id: "mock",
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message || "Valor inválido");
      return;
    }

    setIncome(result.data.monto);
    if (onSaveOverride) {
      onSaveOverride(result.data.monto);
    }
    setIsEditing(false);
    setError(null);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ingreso Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4 capitalize">
          Presupuesto para {monthName}
        </div>
        
        {!isEditing ? (
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(income)}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-muted-foreground">$</span>
              <Input 
                type="number"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                className="text-lg font-semibold"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1">
                <Check className="h-4 w-4 mr-1" /> Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setIsEditing(false);
                setInputValue(income.toString());
                setError(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
