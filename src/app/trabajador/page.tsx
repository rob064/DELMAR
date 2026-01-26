"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Clock, Package, DollarSign, Calendar } from "lucide-react";

interface Asistencia {
  id: string;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  estado: string;
  minutosRetraso: number;
}

interface Produccion {
  id: string;
  fecha: string;
  horasTrabajadas?: string;
  cantidadProducida?: string;
  montoGenerado: string;
  actividad: {
    nombre: string;
    tipoPago: string;
  };
}

interface Pago {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  montoBase: string;
  adelantos: string;
  multas: string;
  totalNeto: string;
  pagado: boolean;
}

export default function TrabajadorPage() {
  const { data: session } = useSession();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [produccion, setProduccion] = useState<Produccion[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.trabajadorId) {
      cargarDatos();
    }
  }, [session]);

  const cargarDatos = async () => {
    if (!session?.user?.trabajadorId) return;

    try {
      const [asistenciasRes, produccionRes, pagosRes] = await Promise.all([
        fetch(`/api/asistencias?trabajadorId=${session.user.trabajadorId}`),
        fetch(`/api/produccion?trabajadorId=${session.user.trabajadorId}`),
        fetch(`/api/pagos?trabajadorId=${session.user.trabajadorId}`),
      ]);

      const asistenciasData = await asistenciasRes.json();
      const produccionData = await produccionRes.json();
      const pagosData = await pagosRes.json();

      setAsistencias(asistenciasData);
      setProduccion(produccionData);
      setPagos(pagosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
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

  const asistenciasMes = asistencias.filter((a) => {
    const fecha = new Date(a.fecha);
    const hoy = new Date();
    return (
      fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
    );
  });

  const totalHorasMes = produccion
    .filter((p) => {
      const fecha = new Date(p.fecha);
      const hoy = new Date();
      return (
        fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
      );
    })
    .reduce((sum, p) => sum + (p.horasTrabajadas ? parseFloat(p.horasTrabajadas) : 0), 0);

  const ultimoPago = pagos[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Panel</h1>
          <p className="text-muted-foreground">Bienvenido, {session?.user?.nombre}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Asistencias del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{asistenciasMes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {asistenciasMes.filter((a) => a.estado === "PRESENTE").length} a tiempo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Horas Trabajadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHorasMes.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                Último Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ultimoPago ? formatCurrency(ultimoPago.totalNeto) : "S/ 0.00"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {ultimoPago?.pagado ? "Pagado" : "Pendiente"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mis Asistencias Recientes</CardTitle>
              <CardDescription>Últimos 10 registros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {asistencias.slice(0, 10).map((asistencia) => (
                  <div key={asistencia.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{formatDate(new Date(asistencia.fecha))}</p>
                      <p className="text-sm text-muted-foreground">
                        {asistencia.horaEntrada && `Entrada: ${formatTime(new Date(asistencia.horaEntrada))}`}
                        {asistencia.horaSalida && ` | Salida: ${formatTime(new Date(asistencia.horaSalida))}`}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          asistencia.estado === "PRESENTE"
                            ? "bg-green-100 text-green-800"
                            : asistencia.estado === "TARDE"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {asistencia.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mi Producción Reciente</CardTitle>
              <CardDescription>Últimos 10 registros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {produccion.slice(0, 10).map((prod) => (
                  <div key={prod.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{prod.actividad.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(prod.fecha))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prod.horasTrabajadas && `${prod.horasTrabajadas} horas`}
                        {prod.cantidadProducida && `${prod.cantidadProducida} unidades`}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-primary">{formatCurrency(prod.montoGenerado)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial de Pagos
            </CardTitle>
            <CardDescription>{pagos.length} pago(s) registrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pagos.map((pago) => (
                <div key={pago.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {formatDate(new Date(pago.fechaInicio))} -{" "}
                        {formatDate(new Date(pago.fechaFin))}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        pago.pagado
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {pago.pagado ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Base:</span>
                      <p className="font-medium">{formatCurrency(pago.montoBase)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adelantos:</span>
                      <p className="font-medium text-orange-600">
                        -{formatCurrency(pago.adelantos)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Multas:</span>
                      <p className="font-medium text-red-600">-{formatCurrency(pago.multas)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Neto:</span>
                      <p className="font-bold text-lg">{formatCurrency(pago.totalNeto)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
