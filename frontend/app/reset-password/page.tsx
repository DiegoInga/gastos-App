"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setIsValidToken(false);
      setVerifyError("El enlace de recuperación es inválido o no contiene un token.");
      return;
    }

    const checkToken = async () => {
      try {
        await api.auth.verifyResetToken(token);
        setIsValidToken(true);
      } catch (err: any) {
        setIsValidToken(false);
        setVerifyError(err.message || "El enlace de recuperación es inválido o ha expirado.");
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al restablecer tu contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-muted/50 shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl">Restablecer Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña para acceder a tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isVerifying ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Verificando enlace de recuperación...</p>
          </div>
        ) : !isValidToken ? (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{verifyError}</p>
            </div>
            <Button
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Solicitar nuevo enlace
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
              <div>
                <h4 className="font-semibold text-sm">¡Contraseña actualizada!</h4>
                <p className="text-xs mt-1 leading-relaxed">
                  Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
                </p>
              </div>
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => router.push("/login")}
            >
              Ir a Iniciar Sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  {...register("password")}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Guardando contraseña..." : "Guardar Nueva Contraseña"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">GastosApp</h1>
        <p className="text-muted-foreground mt-2">Gestiona tus finanzas personales</p>
      </div>

      <Suspense
        fallback={
          <Card className="w-full max-w-md p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
