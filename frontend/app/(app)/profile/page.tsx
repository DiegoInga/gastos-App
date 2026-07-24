"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Mail, Calendar, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ nombre: string; email: string; created_at?: string } | null>(null);
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await api.auth.me();
        setProfile(user);
        setNombre(user.nombre);
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password.length < 6) {
      setMessage({ text: "La nueva contraseña debe tener al menos 6 caracteres.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Las contraseñas no coinciden.", type: "error" });
      return;
    }

    try {
      setIsLoading(true);
      const updateData: { nombre?: string; password?: string } = {};
      if (nombre !== profile?.nombre) {
        updateData.nombre = nombre;
      }
      if (password) {
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage({ text: "No hay cambios para actualizar.", type: "success" });
        return;
      }

      const updatedUser = await api.auth.updateProfile(updateData);
      setProfile(updatedUser);
      setPassword("");
      setConfirmPassword("");
      setMessage({ text: "Perfil actualizado exitosamente.", type: "success" });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Error al actualizar el perfil.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="py-24 text-center text-muted-foreground animate-pulse">
        Cargando datos del perfil...
      </div>
    );
  }

  const memberDate = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })
    : "Recientemente";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Administra tu cuenta personal y configuración de acceso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <Card className="md:col-span-1 border border-border/50 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-3xl font-extrabold border-2 border-emerald-500/20 uppercase">
              {profile.nombre.substring(0, 2)}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight truncate">{profile.nombre}</h2>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
          <div className="bg-muted/40 border-t border-border/40 p-4 space-y-3.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground/80" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/80" />
              <span>Miembro desde {memberDate}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Acceso Seguro Activo</span>
            </div>
          </div>
        </Card>

        {/* Profile Forms */}
        <Card className="md:col-span-2 border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Detalles de Cuenta</CardTitle>
            <CardDescription>Edita tu información básica o actualiza tu contraseña de acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Notifications */}
              {message && (
                <div 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-300",
                    message.type === "success" 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  )}
                >
                  {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Correo electrónico</Label>
                <Input 
                  id="email" 
                  value={profile.email} 
                  disabled 
                  className="bg-muted/50 cursor-not-allowed border-muted-foreground/10 text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground/75">El correo electrónico no puede ser modificado.</p>
              </div>

              {/* Name Field */}
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-xs font-semibold">Nombre Completo</Label>
                <div className="relative">
                  <Input 
                    id="nombre" 
                    type="text" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-9"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80 pointer-events-none" />
                </div>
              </div>

              <div className="border-t border-border/40 my-6 pt-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Cambiar Contraseña</h3>
                
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password-profile" className="text-xs font-semibold">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input 
                      id="password-profile" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Dejar vacío para mantener contraseña actual"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword-profile" className="text-xs font-semibold">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword-profile" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirma la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading} className="font-semibold px-5">
                  {isLoading ? "Guardando cambios..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
