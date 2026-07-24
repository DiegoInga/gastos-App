"use client";

import Link from "next/link";
import { Landmark, ArrowLeft, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-35 blur-[120px] pointer-events-none">
        <div className="aspect-square w-[500px] rounded-full bg-gradient-to-tr from-emerald-500/30 to-emerald-900/20" />
      </div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Visual Icon Box */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <AlertCircle className="h-10 w-10 animate-pulse" />
        </div>

        {/* Text Group */}
        <div className="space-y-3">
          <h1 className="text-7xl font-extrabold tracking-tight text-foreground sm:text-8xl">
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
              404
            </span>
          </h1>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Página no encontrada
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            La ruta que buscas no existe o ha sido movida. Volvamos a poner en orden tus finanzas.
          </p>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2"
            )}
          >
            <Landmark className="h-4 w-4" />
            Ir al Dashboard
          </Link>

          <Button
            onClick={handleGoBack}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-border bg-transparent hover:bg-muted text-foreground font-medium rounded-xl flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </Button>
        </div>
      </div>

      {/* Footer copyright style */}
      <div className="absolute bottom-6 text-[11px] text-muted-foreground/60">
        GastosApp &copy; {new Date().getFullYear()} &middot; Todos los derechos reservados.
      </div>
    </div>
  );
}
