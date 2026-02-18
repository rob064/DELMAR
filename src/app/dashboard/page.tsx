"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getLocalDateString } from "@/lib/utils";
import { Users, Clock, Package, DollarSign, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTrabajadores: 0,
    asistenciasHoy: 0,
    produccionHoy: 0,
    pagosPendientes: 0,
    adelantosSinDescontar: 0,
    multasSinDescontar: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const hoy = getLocalDateString();

      const [trabajadoresRes, asistenciasRes, produccionRes, pagosRes, transaccionesRes] =
        await Promise.all([
          fetch("/api/trabajadores"),
          fetch(`/api/asistencias?fecha=${hoy}`),
          fetch(`/api/produccion?fecha=${hoy}`),
          fetch("/api/pagos"),
          fetch("/api/transacciones"),
        ]);

      const trabajadores = await trabajadoresRes.json();
      const asistencias = await asistenciasRes.json();
      const produccion = await produccionRes.json();
      const pagos = await pagosRes.json();
      const transacciones = await transaccionesRes.json();

      const adelantos = transacciones
        .filter((t: any) => t.tipo === "ADELANTO" && !t.descontado)
        .reduce((sum: number, t: any) => sum + parseFloat(t.monto), 0);

      const multas = transacciones
        .filter((t: any) => t.tipo === "MULTA" && !t.descontado)
        .reduce((sum: number, t: any) => sum + parseFloat(t.monto), 0);

      setStats({
        totalTrabajadores: trabajadores.length,
        asistenciasHoy: asistencias.length,
        produccionHoy: produccion.length,
        pagosPendientes: pagos.filter((p: any) => !p.pagado).length,
        adelantosSinDescontar: adelantos,
        multasSinDescontar: multas,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-60" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* Page header with animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">Resumen general del sistema DELMAR</p>
        </motion.div>

        {/* Stats grid with stagger animation */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {/* Total Trabajadores */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="border-l-4 border-primary/50 bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/5 dark:to-blue-950/20 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Trabajadores</CardTitle>
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.totalTrabajadores}</div>
                <p className="text-xs text-muted-foreground mt-1">Trabajadores activos</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Asistencias Hoy */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="border-l-4 border-success/50 bg-gradient-to-br from-success/5 to-green-50/50 dark:from-success/5 dark:to-green-950/20 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Asistencias Hoy</CardTitle>
                <div className="p-2.5 bg-success/10 rounded-xl">
                  <Clock className="h-5 w-5 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.asistenciasHoy}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  De {stats.totalTrabajadores} trabajadores
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Producción Hoy */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="border-l-4 border-purple-400/50 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Producción Hoy</CardTitle>
                <div className="p-2.5 bg-purple-100/50 dark:bg-purple-900/30 rounded-xl">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.produccionHoy}</div>
                <p className="text-xs text-muted-foreground mt-1">Registros de producción</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pagos Pendientes */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="border-l-4 border-warning/50 bg-gradient-to-br from-warning/5 to-yellow-50/50 dark:from-warning/5 dark:to-yellow-950/20 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                <div className="p-2.5 bg-warning/10 rounded-xl">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{stats.pagosPendientes}</div>
                <p className="text-xs text-muted-foreground mt-1">Nóminas por pagar</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Adelantos Pendientes */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="border-l-4 border-indigo-400/50 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Adelantos Pendientes</CardTitle>
                <div className="p-2.5 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(stats.adelantosSinDescontar)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Por descontar</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Multas Pendientes */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="border-l-4 border-rose-400/50 bg-gradient-to-br from-rose-50/50 to-rose-100/30 dark:from-rose-950/20 dark:to-rose-900/10 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Multas Pendientes</CardTitle>
                <div className="p-2.5 bg-rose-100/50 dark:bg-rose-900/30 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                  {formatCurrency(stats.multasSinDescontar)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Por descontar</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick access and system info */}
        <motion.div
          className="grid gap-6 md:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-blue-700" />
                Accesos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/puerta"
                className="group flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div>
                  <p className="font-medium">Control de Puerta</p>
                  <p className="text-sm text-muted-foreground">
                    Registrar entradas y salidas del personal
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </a>
              <a
                href="/produccion"
                className="group flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div>
                  <p className="font-medium">Registro de Producción</p>
                  <p className="text-sm text-muted-foreground">
                    Asignar actividades y registrar producción
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </a>
              <a
                href="/finanzas"
                className="group flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div>
                  <p className="font-medium">Gestión Financiera</p>
                  <p className="text-sm text-muted-foreground">
                    Adelantos, multas y generación de nómina
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-success to-green-700" />
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Módulos Activos
                </h3>
                <ul className="space-y-2">
                  {[
                    "Control de Puerta (Asistencias)",
                    "Gestión de Producción",
                    "Gestión Financiera",
                    "Panel de Trabajadores",
                  ].map((modulo) => (
                    <li key={modulo} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>{modulo}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t">
                <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Funcionalidades
                </h3>
                <ul className="space-y-2">
                  {[
                    "Registro de entradas/salidas",
                    "Cálculo automático de tardanzas",
                    "Producción por hora/unidad",
                    "Generación automática de nómina",
                    "Gestión de adelantos y multas",
                  ].map((func) => (
                    <li key={func} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>{func}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
