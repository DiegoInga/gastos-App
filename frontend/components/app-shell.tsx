"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Landmark,
  Sun,
  Moon,
  Palette,
  User,
  CalendarDays,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/debts", label: "Deudas", icon: Landmark },
  { href: "/fixed-expenses", label: "Gastos Fijos", icon: Receipt },
  { href: "/profile", label: "Perfil", icon: User },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  onClose,
  isMobile,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ nombre: string; email: string } | null>(null);
  const [activeTheme, setActiveTheme] = useState<"white" | "negro" | "predeterminado" >("predeterminado");

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await api.auth.me();
        setUserProfile(profile);
      } catch {
        // Si el token es inválido o expiró, desloguear y redirigir
        api.auth.logout();
        router.push("/login");
      }
    }
    loadProfile();

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gastos-app-theme") as any;
      if (saved) {
        setActiveTheme(saved);
      }
    }
  }, [router]);

  const changeTheme = (theme: "white" | "negro" | "predeterminado") => {
    setActiveTheme(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("gastos-app-theme", theme);
      const html = document.documentElement;
      html.classList.remove("dark", "theme-black");
      if (theme === "negro") {
        html.classList.add("dark", "theme-black");
      } else if (theme === "predeterminado") {
        html.classList.add("dark");
      }
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo + Collapse toggle */}
      <div
        className={cn(
          "flex h-16 items-center gap-3 px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Wallet className="h-5 w-5" />
        </div>
        {!collapsed && (
          <>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold tracking-tight">GastosApp</span>
              <span className="text-[11px] text-muted-foreground">
                Finanzas personales
              </span>
            </div>
            {!isMobile && onToggle && (
              <button
                onClick={onToggle}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Colapsar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        {collapsed && !isMobile && onToggle && (
          <button
            onClick={onToggle}
            className="absolute top-4 left-1/2 -translate-x-1/2 mt-12 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Expandir"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Separator className="mx-3 w-auto" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-3 px-3 pb-4">
        <Separator className="mb-2" />

        {/* Theme Switcher */}
        <div className="py-1">
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-full text-muted-foreground hover:text-foreground h-8"
              onClick={() => {
                const next = activeTheme === "predeterminado" ? "white" : activeTheme === "white" ? "negro" : "predeterminado";
                changeTheme(next);
              }}
              title={`Tema: ${activeTheme === "white" ? "Blanco" : activeTheme === "negro" ? "Negro" : "Predeterminado"}`}
            >
              {activeTheme === "white" ? (
                <Sun className="h-4 w-4" />
              ) : activeTheme === "negro" ? (
                <Moon className="h-4 w-4 text-rose-500" />
              ) : (
                <Palette className="h-4 w-4 text-emerald-500" />
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-1 p-1 bg-muted/40 border border-border/40 rounded-lg">
              <Button
                variant={activeTheme === "white" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-[11px] font-semibold px-1 py-1 h-7 gap-1"
                onClick={() => changeTheme("white")}
              >
                <Sun className="h-3 w-3" />
                <span>Blanco</span>
              </Button>
              <Button
                variant={activeTheme === "negro" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-[11px] font-semibold px-1 py-1 h-7 gap-1"
                onClick={() => changeTheme("negro")}
              >
                <Moon className="h-3 w-3 text-rose-500" />
                <span>Negro</span>
              </Button>
              <Button
                variant={activeTheme === "predeterminado" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-[11px] font-semibold px-1 py-1 h-7 gap-1"
                onClick={() => changeTheme("predeterminado")}
              >
                <Palette className="h-3 w-3 text-emerald-500" />
                <span>Predet.</span>
              </Button>
            </div>
          )}
        </div>

        {/* User mock */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
            {userProfile?.nombre?.substring(0, 2) || "US"}
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="truncate text-sm font-medium">{userProfile?.nombre || "Usuario"}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {userProfile?.email || "cargando..."}
              </span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "w-full text-muted-foreground hover:text-foreground",
            !collapsed && "justify-start gap-3"
          )}
          title={collapsed ? "Cerrar sesión" : undefined}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </Button>


      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden border-r border-border bg-card transition-[width] duration-200 ease-in-out lg:flex lg:flex-col",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menú de navegación</SheetTitle>
          </SheetHeader>
          <SidebarContent
            collapsed={false}
            isMobile
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">GastosApp</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
