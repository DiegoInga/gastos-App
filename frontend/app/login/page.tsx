"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, Eye, EyeOff } from "lucide-react";
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from "@/lib/validations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.login(data.email, data.password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Email o contraseña inválidos");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Usaremos un nombre por defecto derivado del email para el registro
      const nombre = data.email.split("@")[0];
      await api.auth.register(data.email, data.password, nombre);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al registrar el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <Wallet className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">GastosApp</h1>
        <p className="text-muted-foreground mt-2">Gestiona tus finanzas personales</p>
      </div>

      <Card className="w-full max-w-md border-muted/50 shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm font-medium">
                {error}
              </div>
            )}
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Correo electrónico</Label>
                  <Input 
                    id="email-login" 
                    type="email" 
                    placeholder="tu@email.com" 
                    {...registerLogin("email")}
                    disabled={isLoading}
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-red-500 font-medium">{loginErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-login">Contraseña</Label>
                    <a href="#" className="text-xs text-primary hover:underline" tabIndex={-1}>
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password-login" 
                      type={showLoginPassword ? "text" : "password"} 
                      {...registerLogin("password")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-sm text-red-500 font-medium">{loginErrors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleSignupSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-register">Correo electrónico</Label>
                  <Input 
                    id="email-register" 
                    type="email" 
                    placeholder="tu@email.com" 
                    {...registerSignup("email")}
                    disabled={isLoading}
                  />
                  {signupErrors.email && (
                    <p className="text-sm text-red-500 font-medium">{signupErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Contraseña</Label>
                  <div className="relative">
                    <Input 
                      id="password-register" 
                      type={showRegisterPassword ? "text" : "password"} 
                      {...registerSignup("password")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupErrors.password && (
                    <p className="text-sm text-red-500 font-medium">{signupErrors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      {...registerSignup("confirmPassword")}
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
                  {signupErrors.confirmPassword && (
                    <p className="text-sm text-red-500 font-medium">{signupErrors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
