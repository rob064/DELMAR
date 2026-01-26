"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getLocalDateString } from "@/lib/utils";
import { Users, Clock, Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

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
        <div className="flex items-center justify-center h-96">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Trabajadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrabajadores}</div>
              <p className="text-xs text-muted-foreground">Trabajadores activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Asistencias Hoy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.asistenciasHoy}</div>
              <p className="text-xs text-muted-foreground">
                De {stats.totalTrabajadores} trabajadores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Producción Hoy</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.produccionHoy}</div>
              <p className="text-xs text-muted-foreground">Registros de producción</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pagosPendientes}</div>
              <p className="text-xs text-muted-foreground">Nóminas por pagar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Adelantos Pendientes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.adelantosSinDescontar)}
              </div>
              <p className="text-xs text-muted-foreground">Por descontar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Multas Pendientes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.multasSinDescontar)}
              </div>
              <p className="text-xs text-muted-foreground">Por descontar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Accesos Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/puerta"
                className="block p-3 rounded-lg border hover:bg-muted/50 transition"
              >
                <p className="font-medium">Control de Puerta</p>
                <p className="text-sm text-muted-foreground">
                  Registrar entradas y salidas del personal
                </p>
              </a>
              <a
                href="/produccion"
                className="block p-3 rounded-lg border hover:bg-muted/50 transition"
              >
                <p className="font-medium">Registro de Producción</p>
                <p className="text-sm text-muted-foreground">
                  Asignar actividades y registrar producción
                </p>
              </a>
              <a
                href="/finanzas"
                className="block p-3 rounded-lg border hover:bg-muted/50 transition"
              >
                <p className="font-medium">Gestión Financiera</p>
                <p className="text-sm text-muted-foreground">
                  Adelantos, multas y generación de nómina
                </p>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Módulos Activos</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Control de Puerta (Asistencias)</li>
                  <li>✓ Gestión de Producción</li>
                  <li>✓ Gestión Financiera</li>
                  <li>✓ Panel de Trabajadores</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Funcionalidades</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Registro de entradas/salidas</li>
                  <li>✓ Cálculo automático de tardanzas</li>
                  <li>✓ Producción por hora/unidad</li>
                  <li>✓ Generación automática de nómina</li>
                  <li>✓ Gestión de adelantos y multas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
