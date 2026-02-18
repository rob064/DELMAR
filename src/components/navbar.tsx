"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  DoorOpen,
  Package,
  DollarSign,
  Users,
  LogOut,
  User,
  Settings,
  Menu,
  Waves,
} from "lucide-react";
import { useState } from "react";

const routes = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/puerta", label: "Puerta", icon: DoorOpen },
    { href: "/produccion", label: "Producción", icon: Package },
    { href: "/finanzas", label: "Finanzas", icon: DollarSign },
    { href: "/trabajadores", label: "Trabajadores", icon: Users },
    { href: "/superusuario", label: "Configuración", icon: Settings },
  ],
  PUERTA: [{ href: "/puerta", label: "Control de Puerta", icon: DoorOpen }],
  PRODUCCION: [
    { href: "/produccion", label: "Producción", icon: Package },
  ],
  FINANZAS: [
    { href: "/finanzas", label: "Finanzas", icon: DollarSign },
  ],
  TRABAJADOR: [
    { href: "/trabajador", label: "Mi Panel", icon: User },
  ],
};

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) return null;

  const userRoutes = routes[session.user.role as keyof typeof routes] || [];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700">
            <Waves className="h-5 w-5 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-xl font-bold text-transparent">
            DELMAR
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="ml-8 hidden lg:flex lg:space-x-1">
          {userRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="ml-auto flex items-center space-x-2">
          {/* User Info - Desktop only */}
          <div className="hidden text-sm lg:block">
            <p className="font-medium">{session.user.nombre}</p>
            <p className="text-xs text-muted-foreground">{session.user.role}</p>
          </div>
          
          <ThemeToggle />
          
          {/* Logout Button - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="hidden lg:flex"
          >
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              
              {/* User Info - Mobile */}
              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <p className="font-medium">{session.user.nombre}</p>
                <p className="text-xs text-muted-foreground">{session.user.role}</p>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="mt-6 flex flex-col space-y-1">
                {userRoutes.map((route) => {
                  const Icon = route.icon;
                  const isActive = pathname === route.href;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{route.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout Button - Mobile */}
              <Button
                variant="destructive"
                className="mt-6 w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/auth/login" });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
