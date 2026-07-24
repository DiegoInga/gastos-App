"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  Receipt,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Power
} from "lucide-react";

type Categoria = 'servicios' | 'suscripciones' | 'transporte' | 'alimentacion' | 'vivienda' | 'personal' | 'otro';

interface FixedExpense {
  id: string;
  user_id: string;
  nombre: string;
  monto: number;
  categoria: Categoria;
  activo: boolean;
  created_at: string;
}

const CATEGORY_COLORS: Record<Categoria, string> = {
  servicios: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  suscripciones: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  transporte: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  alimentacion: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  vivienda: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  personal: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  otro: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
};

const CATEGORY_LABELS: Record<Categoria, string> = {
  servicios: "Servicios",
  suscripciones: "Suscripciones",
  transporte: "Transporte",
  alimentacion: "Alimentación",
  vivienda: "Vivienda",
  personal: "Personal",
  otro: "Otro"
};

export default function FixedExpensesPage() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{ nombre: string; monto: string; categoria: string }>({
    nombre: "",
    monto: "",
    categoria: ""
  });

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await api.fixedExpenses.getAll();
      setExpenses(data);
    } catch (error) {
      console.error("Error cargando gastos fijos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ nombre: "", monto: "", categoria: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: FixedExpense) => {
    setEditingId(expense.id);
    setFormData({
      nombre: expense.nombre,
      monto: expense.monto.toString(),
      categoria: expense.categoria
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.monto || !formData.categoria) return;
    
    try {
      setIsSubmitting(true);
      const monto = parseFloat(formData.monto);
      
      if (editingId) {
        await api.fixedExpenses.update(editingId, { 
          nombre: formData.nombre, 
          monto, 
          categoria: formData.categoria 
        });
      } else {
        await api.fixedExpenses.create({ 
          nombre: formData.nombre, 
          monto, 
          categoria: formData.categoria 
        });
      }
      
      setIsModalOpen(false);
      await loadExpenses();
    } catch (error) {
      console.error("Error guardando gasto fijo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivo = async (id: string, currentActivo: boolean) => {
    try {
      // Optimistic update
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, activo: !currentActivo } : e));
      await api.fixedExpenses.update(id, { activo: !currentActivo });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      // Revert on error
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, activo: currentActivo } : e));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await api.fixedExpenses.delete(deleteId);
      setDeleteId(null);
      await loadExpenses();
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Computations
  const activeExpenses = expenses.filter(e => e.activo);
  const totalActivos = activeExpenses.reduce((sum, e) => sum + e.monto, 0);
  
  // Find top category
  const categoryTotals = activeExpenses.reduce((acc, e) => {
    acc[e.categoria] = (acc[e.categoria] || 0) + e.monto;
    return acc;
  }, {} as Record<string, number>);
  
  let topCategory = "-";
  let maxCatAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amount]) => {
    if (amount > maxCatAmount) {
      maxCatAmount = amount;
      topCategory = CATEGORY_LABELS[cat as Categoria];
    }
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos Fijos Mensuales</h1>
          <p className="text-muted-foreground">
            Administra tus suscripciones y pagos recurrentes
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo Gasto
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gastos Activos</CardTitle>
            <Receipt className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalActivos)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cantidad de Gastos</CardTitle>
            <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {activeExpenses.length}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeExpenses.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categoría Principal</CardTitle>
            <div className="h-4 w-4 bg-muted rounded-sm flex items-center justify-center" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{topCategory}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No hay gastos fijos</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Comienza añadiendo tus servicios, suscripciones o cualquier pago recurrente para llevar un mejor control.
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir primer gasto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className={cn("flex flex-col transition-all hover:shadow-md", !expense.activo && "opacity-75 grayscale-[0.5]")}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                <div className="space-y-1 truncate">
                  <CardTitle className="text-base font-bold truncate" title={expense.nombre}>
                    {expense.nombre}
                  </CardTitle>
                  <Badge variant="secondary" className={cn("font-normal text-xs", CATEGORY_COLORS[expense.categoria])}>
                    {CATEGORY_LABELS[expense.categoria]}
                  </Badge>
                </div>
                <div className="font-bold text-lg whitespace-nowrap">
                  {formatCurrency(expense.monto)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                {/* Space for future details if needed */}
              </CardContent>
              <CardFooter className="pt-2 pb-4 border-t border-border/50 flex justify-between gap-2 mt-auto">
                <Button 
                  variant={expense.activo ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handleToggleActivo(expense.id, expense.activo)}
                  className="flex-1 text-xs h-8"
                  title={expense.activo ? "Marcar como inactivo" : "Marcar como activo"}
                >
                  <Power className="h-3 w-3 mr-1.5" />
                  {expense.activo ? "Activo" : "Inactivo"}
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => handleOpenEdit(expense)}
                  title="Editar"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10"
                  onClick={() => setDeleteId(expense.id)}
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Gasto Fijo" : "Nuevo Gasto Fijo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Ej. Netflix, Luz, Agua"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monto">Monto Mensual</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(val) => setFormData({ ...formData, categoria: val || "" })}
                  required
                >
                  <SelectTrigger id="categoria" className="w-full h-10">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar este gasto fijo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
