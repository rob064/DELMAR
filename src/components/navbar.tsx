"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  DoorOpen,
  Package,
  DollarSign,
  Users,
  LogOut,
  User,
} from "lucide-react";

const routes = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/puerta", label: "Puerta", icon: DoorOpen },
    { href: "/produccion", label: "Producción", icon: Package },
    { href: "/finanzas", label: "Finanzas", icon: DollarSign },
    { href: "/trabajadores", label: "Trabajadores", icon: Users },
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

  if (!session) return null;

  const userRoutes = routes[session.user.role as keyof typeof routes] || [];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-16 items-center px-4 lg:px-8">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold text-primary">DELMAR</h1>
          </Link>
        </div>

        <div className="ml-8 flex space-x-4 lg:space-x-6">
          {userRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <div className="text-sm">
            <p className="font-medium">{session.user.nombre}</p>
            <p className="text-xs text-muted-foreground">{session.user.role}</p>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
