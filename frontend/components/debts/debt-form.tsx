"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Debt } from "@/lib/types";
import { DebtFormData, debtSchema } from "@/lib/validations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/mock-data";

interface DebtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: Debt | null;
  onSave: (data: DebtFormData) => void;
}

export function DebtForm({ open, onOpenChange, debt, onSave }: DebtFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      nombre: "",
      monto_total: 0,
      tipo: "cuotas",
      num_cuotas: 12,
      fecha_primera_cuota: new Date().toISOString().split("T")[0]
    }
  });

  useEffect(() => {
    if (open) {
      if (debt) {
        reset({
          nombre: debt.nombre,
          monto_total: debt.monto_total,
          tipo: debt.tipo,
          num_cuotas: debt.num_cuotas,
          fecha_primera_cuota: debt.fecha_primera_cuota
        });
      } else {
        reset({
          nombre: "",
          monto_total: 0,
          tipo: "cuotas",
          num_cuotas: 12,
          fecha_primera_cuota: new Date().toISOString().split("T")[0]
        });
      }
    }
  }, [open, debt, reset]);

  const watchTipo = watch("tipo");
  const watchMonto = watch("monto_total");
  const watchCuotas = watch("num_cuotas");

  const onSubmit = (data: DebtFormData) => {
    if (data.tipo === "directo") {
      data.num_cuotas = 1;
    }
    onSave(data);
    onOpenChange(false);
  };

  const cuotaMensual = watchMonto && watchCuotas && watchCuotas > 0 ? watchMonto / watchCuotas : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{debt ? "Editar Deuda" : "Nueva Deuda"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" placeholder="Ej. MacBook Pro, Préstamo personal" {...register("nombre")} />
            {errors.nombre && <p className="text-xs font-medium text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monto_total">Monto Total</Label>
            <Input 
              id="monto_total" 
              type="number" 
              step="0.01" 
              {...register("monto_total", { valueAsNumber: true })} 
            />
            {errors.monto_total && <p className="text-xs font-medium text-destructive">{errors.monto_total.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Tipo de Pago</Label>
            <Tabs value={watchTipo} onValueChange={(val) => setValue("tipo", val as "cuotas" | "directo")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cuotas">Cuotas Mensuales</TabsTrigger>
                <TabsTrigger value="directo">Pago Directo</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {watchTipo === "cuotas" && (
            <div className="space-y-2 p-4 bg-muted/40 rounded-lg border border-border/50">
              <Label htmlFor="num_cuotas">Número de Cuotas</Label>
              <Input 
                id="num_cuotas" 
                type="number" 
                {...register("num_cuotas", { valueAsNumber: true })} 
              />
              <p className="text-xs font-medium text-muted-foreground/80">(12 = 1 año, 24 = 2 años)</p>
              {errors.num_cuotas && <p className="text-xs font-medium text-destructive">{errors.num_cuotas.message}</p>}
              
              <div className="pt-3 border-t border-border/50 mt-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Cuota mensual calculada: <span className="text-foreground text-base ml-1">{formatCurrency(cuotaMensual)}</span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fecha_primera_cuota">
              {watchTipo === "cuotas" ? "Fecha de primera cuota" : "Fecha de pago"}
            </Label>
            <Input 
              id="fecha_primera_cuota" 
              type="date" 
              {...register("fecha_primera_cuota")} 
            />
            {errors.fecha_primera_cuota && <p className="text-xs font-medium text-destructive">{errors.fecha_primera_cuota.message}</p>}
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="min-w-[120px]">{debt ? "Guardar cambios" : "Crear Deuda"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
