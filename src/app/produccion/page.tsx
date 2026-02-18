"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency, getLocalDateString } from "@/lib/utils";
import { Package, Plus, Clock, CheckCircle2, TrendingUp, DollarSign, Activity, AlertCircle } from "lucide-react";

interface Trabajador {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
}

interface Actividad {
  id: string;
  nombre: string;
  tipoPago: string;
  tarifaPorHora?: string;
  tarifaPorUnidad?: string;
  unidadMedida?: string;
}

interface Produccion {
  id: string;
  fecha: string;
  horasTrabajadas?: string;
  cantidadProducida?: string;
  montoGenerado: string;
  horaInicio?: string;
  horaFin?: string;
  trabajador: {
    nombres: string;
    apellidos: string;
  };
  actividad: {
    nombre: string;
    tipoPago: string;
    valor?: string;
  };
}

export default function ProduccionPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [produccionHoy, setProduccionHoy] = useState<Produccion[]>([]);
  const [actividadesActivas, setActividadesActivas] = useState<Produccion[]>([]);
  
  // Fecha para el filtro de producción (lado derecho)
  const [fechaFiltro, setFechaFiltro] = useState(getLocalDateString());
  
  // Fecha para el formulario de registro (lado izquierdo)
  const [fechaRegistro, setFechaRegistro] = useState(getLocalDateString());
  
  const [selectedTrabajador, setSelectedTrabajador] = useState("");
  const [selectedActividad, setSelectedActividad] = useState("");
  const [asistenciaDelDia, setAsistenciaDelDia] = useState<any>(null);
  const [cantidadProducida, setCantidadProducida] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Campos para actividades POR_HORA
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [mostrarHoraFin, setMostrarHoraFin] = useState(false);
  
  // Modal para cerrar actividad
  const [modalCerrarActividad, setModalCerrarActividad] = useState(false);
  const [actividadACerrar, setActividadACerrar] = useState<Produccion | null>(null);
  const [horaFinCierre, setHoraFinCierre] = useState("");

  // Modal nueva actividad
  const [showNuevaActividad, setShowNuevaActividad] = useState(false);
  const [nuevaActividad, setNuevaActividad] = useState({
    nombre: "",
    descripcion: "",
    tipoPago: "POR_HORA",
    tarifaPorHora: "",
    tarifaPorUnidad: "",
    unidadMedida: "",
    metaDiaria: "",
    metaSemanal: "",
  });

  // Calcular actividad seleccionada (debe estar antes de los useEffect que la usan)
  const actividadSeleccionada = actividades.find((a) => a.id === selectedActividad);

  useEffect(() => {
    cargarDatos();
  }, [fechaFiltro]);

  // Obtener asistencia del trabajador cuando cambie trabajador o fecha
  useEffect(() => {
    if (selectedTrabajador && fechaRegistro) {
      obtenerAsistencia();
      cargarActividadesActivas();
    } else {
      setAsistenciaDelDia(null);
      setActividadesActivas([]);
    }
  }, [selectedTrabajador, fechaRegistro]);

  // Actualizar hora inicio cuando cambie asistencia o actividad
  useEffect(() => {
    if (asistenciaDelDia?.horaEntrada && actividadSeleccionada?.tipoPago === "POR_HORA") {
      // Defaultear hora inicio a hora de entrada en formato HH:MM
      const horaEntrada = new Date(asistenciaDelDia.horaEntrada);
      const horaStr = horaEntrada.toTimeString().substring(0, 5);
      setHoraInicio(horaStr);
    } else {
      setHoraInicio("");
    }
    setHoraFin("");
    setMostrarHoraFin(false);
  }, [asistenciaDelDia, selectedActividad]);

  // Verificar si han pasado más de 1 hora desde hora inicio
  useEffect(() => {
    if (horaInicio && actividadSeleccionada?.tipoPago === "POR_HORA") {
      const ahora = new Date();
      const [horas, minutos] = horaInicio.split(':').map(Number);
      const horaInicioDate = new Date();
      horaInicioDate.setHours(horas, minutos, 0, 0);
      
      const diffMs = ahora.getTime() - horaInicioDate.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);
      
      setMostrarHoraFin(diffHoras >= 1);
    } else {
      setMostrarHoraFin(false);
    }
  }, [horaInicio, actividadSeleccionada]);

  const obtenerAsistencia = async () => {
    try {
      const res = await fetch(`/api/asistencias?fecha=${fechaRegistro}&trabajadorId=${selectedTrabajador}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setAsistenciaDelDia(data[0]);
      } else {
        setAsistenciaDelDia(null);
      }
    } catch (error) {
      console.error("Error al obtener asistencia:", error);
      setAsistenciaDelDia(null);
    }
  };

  const cargarActividadesActivas = async () => {
    try {
      const res = await fetch(`/api/produccion/activas?trabajadorId=${selectedTrabajador}&fecha=${fechaRegistro}`);
      const data = await res.json();
      setActividadesActivas(data || []);
    } catch (error) {
      console.error("Error al cargar actividades activas:", error);
      setActividadesActivas([]);
    }
  };

  const cerrarActividad = async (produccionId: string) => {
    if (!confirm("¿Cerrar esta actividad por horas ahora?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/produccion/${produccionId}/cerrar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horaFin: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Actividad cerrada exitosamente");
        cargarActividadesActivas();
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al cerrar actividad");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cerrar actividad");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCerrar = (produccion: Produccion) => {
    setActividadACerrar(produccion);
    // Defaultear hora fin a hora actual
    const ahora = new Date();
    const horaStr = ahora.toTimeString().substring(0, 5);
    setHoraFinCierre(horaStr);
    setModalCerrarActividad(true);
  };

  const cerrarActividadConHora = async () => {
    if (!actividadACerrar || !horaFinCierre) {
      toast.warning("Debe especificar la hora de finalización");
      return;
    }

    setLoading(true);
    try {
      // Construir horaFin completa con fecha - extraer directamente del string para evitar problemas de timezone
      const fechaStr = actividadACerrar.fecha;
      let year: number, month: number, day: number;
      
      if (typeof fechaStr === 'string') {
        // Si viene como string ISO "2026-02-16" o "2026-02-16T00:00:00.000Z"
        const dateMatch = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          year = parseInt(dateMatch[1]);
          month = parseInt(dateMatch[2]) - 1; // JavaScript months are 0-indexed
          day = parseInt(dateMatch[3]);
        } else {
          // Fallback
          const fechaProd = new Date(fechaStr);
          year = fechaProd.getFullYear();
          month = fechaProd.getMonth();
          day = fechaProd.getDate();
        }
      } else {
        // Si ya es un objeto Date
        const fechaProd = new Date(fechaStr);
        year = fechaProd.getFullYear();
        month = fechaProd.getMonth();
        day = fechaProd.getDate();
      }
      
      const [horasFin, minutosFin] = horaFinCierre.split(':').map(Number);
      let horaFinDate = new Date(year, month, day, horasFin, minutosFin, 0, 0);
      
      // DETECCIÓN AUTOMÁTICA DE CRUCE DE MEDIANOCHE
      // Si hora fin < hora inicio, asumir que es del día siguiente
      if (actividadACerrar.horaInicio) {
        const horaInicio = new Date(actividadACerrar.horaInicio);
        if (horaFinDate < horaInicio) {
          horaFinDate = new Date(year, month, day + 1, horasFin, minutosFin, 0, 0);
        }
        
        // Validar que no sea más de 24 horas (probable error)
        const diffMs = horaFinDate.getTime() - horaInicio.getTime();
        const horasTrabajadas = diffMs / (1000 * 60 * 60);
        if (horasTrabajadas > 24) {
          toast.error("Error: La actividad no puede durar más de 24 horas. Verifica la hora de finalización.");
          setLoading(false);
          return;
        }
      }
      
      const res = await fetch(`/api/produccion/${actividadACerrar.id}/cerrar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horaFin: horaFinDate.toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Actividad cerrada exitosamente");
        setModalCerrarActividad(false);
        setActividadACerrar(null);
        setHoraFinCierre("");
        cargarActividadesActivas();
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al cerrar actividad");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cerrar actividad");
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const [trabajadoresRes, actividadesRes, produccionRes] = await Promise.all([
        fetch("/api/trabajadores"),
        fetch("/api/actividades"),
        fetch(`/api/produccion?fecha=${fechaFiltro}`),
      ]);

      const trabajadoresData = await trabajadoresRes.json();
      const actividadesData = await actividadesRes.json();
      const produccionData = await produccionRes.json();

      setTrabajadores(trabajadoresData);
      setActividades(actividadesData);
      setProduccionHoy(produccionData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const registrarProduccion = async () => {
    if (!selectedTrabajador || !selectedActividad) {
      toast.warning("Por favor seleccione trabajador y actividad");
      return;
    }

    const actividad = actividades.find((a) => a.id === selectedActividad);
    if (!actividad) return;

    // Validación: No se puede registrar producción si hay actividad por horas activa
    if (actividadesActivas.length > 0) {
      toast.warning("Hay actividades por horas activas. Debe cerrarlas antes de continuar.");
      return;
    }

    // Validación para POR_HORA: debe tener asistencia registrada con entrada
    if (actividad.tipoPago === "POR_HORA") {
      if (!asistenciaDelDia || !asistenciaDelDia.horaEntrada) {
        toast.warning("El trabajador no tiene asistencia registrada para esta fecha");
        return;
      }
      if (!horaInicio) {
        toast.warning("Por favor especifique la hora de inicio");
        return;
      }
    }

    // Validación para POR_PRODUCCION: debe tener asistencia registrada con al menos entrada
    if (actividad.tipoPago === "POR_PRODUCCION") {
      if (!asistenciaDelDia || !asistenciaDelDia.horaEntrada) {
        toast.warning("El trabajador no tiene asistencia (hora de entrada) registrada para esta fecha");
        return;
      }
      if (!cantidadProducida) {
        toast.warning("Por favor ingrese la cantidad producida");
        return;
      }
    }

    setLoading(true);
    try {
      // Construir horaInicio e horaFin completas con fecha
      let horaInicioISO = null;
      let horaFinISO = null;
      
      if (actividad.tipoPago === "POR_HORA" && horaInicio) {
        const [year, month, day] = fechaRegistro.split('-').map(Number);
        const [horas, minutos] = horaInicio.split(':').map(Number);
        const horaInicioDate = new Date(year, month - 1, day, horas, minutos, 0, 0);
        horaInicioISO = horaInicioDate.toISOString();
        
        if (horaFin) {
          const [horasFin, minutosFin] = horaFin.split(':').map(Number);
          let horaFinDate = new Date(year, month - 1, day, horasFin, minutosFin, 0, 0);
          
          // DETECCIÓN AUTOMÁTICA DE CRUCE DE MEDIANOCHE
          // Si hora fin < hora inicio, asumir que es del día siguiente
          if (horaFinDate < horaInicioDate) {
            horaFinDate = new Date(year, month - 1, day + 1, horasFin, minutosFin, 0, 0);
          }
          
          // Validar que no sea más de 24 horas (probable error)
          const diffMs = horaFinDate.getTime() - horaInicioDate.getTime();
          const horasTrabajadas = diffMs / (1000 * 60 * 60);
          if (horasTrabajadas > 24) {
            toast.error("Error: La actividad no puede durar más de 24 horas. Verifica las horas ingresadas.");
            setLoading(false);
            return;
          }
          
          horaFinISO = horaFinDate.toISOString();
        }
      }

      const res = await fetch("/api/produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabajadorId: selectedTrabajador,
          actividadId: selectedActividad,
          fecha: fechaRegistro,
          horaInicio: horaInicioISO,
          horaFin: horaFinISO,
          horasTrabajadas: null,
          cantidadProducida: cantidadProducida || null,
          observaciones,
        }),
      });

      if (res.ok) {
        toast.success("Producción registrada exitosamente");
        setSelectedTrabajador("");
        setSelectedActividad("");
        setAsistenciaDelDia(null);
        setCantidadProducida("");
        setObservaciones("");
        setHoraInicio("");
        setHoraFin("");
        setActividadesActivas([]);
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al registrar producción");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al registrar producción");
    } finally {
      setLoading(false);
    }
  };

  const crearActividad = async () => {
    if (!nuevaActividad.nombre) {
      toast.warning("Por favor ingrese el nombre de la actividad");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/actividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaActividad),
      });

      if (res.ok) {
        toast.success("Actividad creada exitosamente");
        setShowNuevaActividad(false);
        setNuevaActividad({
          nombre: "",
          descripcion: "",
          tipoPago: "POR_HORA",
          tarifaPorHora: "",
          tarifaPorUnidad: "",
          unidadMedida: "",
          metaDiaria: "",
          metaSemanal: "",
        });
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al crear actividad");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear actividad");
    } finally {
      setLoading(false);
    }
  };

  // Stats del día
  const statsDelDia = {
    totalRegistros: produccionHoy.length,
    actividadesCompletadas: produccionHoy.filter(p => 
      p.actividad.tipoPago === "POR_UNIDAD" || (p.actividad.tipoPago === "POR_HORA" && p.horaFin)
    ).length,
    actividadesActivas: actividadesActivas.length,
    montoTotal: produccionHoy.reduce((sum, p) => sum + parseFloat(p.montoGenerado), 0),
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">
              Módulo de Producción
            </h1>
            <p className="text-muted-foreground">Registro de actividades y producción diaria</p>
          </div>
          <Button onClick={() => setShowNuevaActividad(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Actividad
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Producción</CardTitle>
              <CardDescription>Asignar actividad y registrar producción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fechaRegistro}
                  onChange={(e) => setFechaRegistro(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Trabajador</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedTrabajador}
                  onChange={(e) => setSelectedTrabajador(e.target.value)}
                >
                  <option value="">Seleccione un trabajador</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombres} {t.apellidos} - {t.dni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mostrar actividades activas (por horas sin cerrar) */}
              {actividadesActivas.length > 0 && (
                <div className="rounded-lg border-2 border-warning bg-warning/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                    </div>
                    <p className="text-sm font-semibold text-warning flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Actividades Por Horas Activas ({actividadesActivas.length})
                    </p>
                  </div>
                  {actividadesActivas.map((act) => {
                    const horaInicio = act.horaInicio ? new Date(act.horaInicio) : null;
                    const ahora = new Date();
                    const tiempoTranscurrido = horaInicio 
                      ? Math.floor((ahora.getTime() - horaInicio.getTime()) / (1000 * 60)) 
                      : 0;
                    const horas = Math.floor(tiempoTranscurrido / 60);
                    const minutos = tiempoTranscurrido % 60;

                    return (
                      <div key={act.id} className="bg-background rounded-lg border p-3 space-y-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-warning" />
                              {act.actividad.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Inicio: {horaInicio?.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                              <TrendingUp className="h-3 w-3" />
                              {horas}h {minutos}m transcurridos
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cerrarActividad(act.id)}
                            disabled={loading}
                            className="h-8"
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-start gap-2 rounded-md bg-warning/10 p-2">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-warning">
                      Debe cerrar estas actividades antes de registrar nueva producción
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Actividad</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedActividad}
                  onChange={(e) => setSelectedActividad(e.target.value)}
                >
                  <option value="">Seleccione una actividad</option>
                  {actividades.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({a.tipoPago === "POR_HORA" ? "Por Hora" : "Por Producción"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTrabajador && fechaRegistro && (
                <div className="rounded-lg border p-3 bg-blue-50 space-y-2">
                  <p className="text-sm font-medium">Datos de Asistencia:</p>
                  {asistenciaDelDia ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Hora Entrada:</span>{" "}
                          <span className="font-medium">
                            {new Date(asistenciaDelDia.horaEntrada).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hora Salida:</span>{" "}
                          <span className="font-medium">
                            {asistenciaDelDia.horaSalida 
                              ? new Date(asistenciaDelDia.horaSalida).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
                              : "No registrada"}
                          </span>
                        </div>
                      </div>
                      {asistenciaDelDia.turno && (
                        <p className="text-xs text-muted-foreground">
                          Turno: {asistenciaDelDia.turnoProgramado}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-amber-700">
                      ⚠️ No hay asistencia registrada para este trabajador en esta fecha
                    </p>
                  )}
                </div>
              )}

              {actividadSeleccionada?.tipoPago === "POR_HORA" && (
                <>
                  <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ℹ️ Actividad Por Horas
                      </p>
                    </div>
                    {actividadSeleccionada.tarifaPorHora && (
                      <p className="text-xs text-muted-foreground">
                        Tarifa: {formatCurrency(actividadSeleccionada.tarifaPorHora)}/hora
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Hora de Inicio * (formato 24h: 00:00 - 23:59)</Label>
                      <Input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        required
                        step="60"
                      />
                      <p className="text-xs text-muted-foreground">
                        Por defecto se toma la hora de entrada en puerta. Ej: 14:30, 23:00
                      </p>
                    </div>

                    {mostrarHoraFin && (
                      <div className="space-y-2">
                        <Label>Hora de Finalización (opcional)</Label>
                        <Input
                          type="time"
                          value={horaFin}
                          onChange={(e) => setHoraFin(e.target.value)}
                          step="60"
                        />
                        {horaFin && horaInicio && horaFin < horaInicio && (
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            🌙 Actividad cruza medianoche (termina día siguiente)
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Si hora fin {'<'} hora inicio, se asume día siguiente automáticamente
                        </p>
                      </div>
                    )}

                    {!mostrarHoraFin && horaInicio && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⏱️ La actividad se registrará abierta. Podrá cerrarla cuando transcurra más de 1 hora.
                      </p>
                    )}
                  </div>
                </>
              )}

              {actividadSeleccionada?.tipoPago === "POR_PRODUCCION" && (
                <div className="space-y-2">
                  <Label>
                    Cantidad Producida *
                    {actividadSeleccionada.unidadMedida && ` (${actividadSeleccionada.unidadMedida})`}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={cantidadProducida}
                    onChange={(e) => setCantidadProducida(e.target.value)}
                    required
                  />
                  {actividadSeleccionada.tarifaPorUnidad && cantidadProducida && (
                    <p className="text-sm text-muted-foreground">
                      Tarifa: {formatCurrency(actividadSeleccionada.tarifaPorUnidad)}/{actividadSeleccionada.unidadMedida}
                      {" → "}Total: {formatCurrency((parseFloat(cantidadProducida) * parseFloat(actividadSeleccionada.tarifaPorUnidad)).toString())}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Observaciones (opcional)</Label>
                <Textarea
                  placeholder="Ingrese observaciones..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={registrarProduccion}
                disabled={loading}
                className="w-full"
              >
                <Package className="mr-2 h-4 w-4" />
                Registrar Producción
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Producción del {formatDate(fechaFiltro)}</CardTitle>
                  <CardDescription>{produccionHoy.length} registro(s)</CardDescription>
                </div>
                <Input
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats del día */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/5 dark:to-blue-950/20 p-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statsDelDia.totalRegistros}</p>
                      <p className="text-xs text-muted-foreground">Registros</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border bg-gradient-to-br from-success/5 to-green-50/50 dark:from-success/5 dark:to-green-950/20 p-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-success/10 p-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statsDelDia.actividadesCompletadas}</p>
                      <p className="text-xs text-muted-foreground">Completadas</p>
                    </div>
                  </div>
                </div>
                
                {statsDelDia.actividadesActivas > 0 && (
                  <div className="rounded-lg border bg-gradient-to-br from-warning/5 to-amber-50/50 dark:from-warning/5 dark:to-amber-950/20 p-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-warning/10 p-2">
                        <Activity className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{statsDelDia.actividadesActivas}</p>
                        <p className="text-xs text-muted-foreground">Activas</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={`rounded-lg border bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 p-3 ${statsDelDia.actividadesActivas === 0 ? 'col-span-1' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-emerald-100/50 dark:bg-emerald-900/30 p-2">
                      <DollarSign className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(statsDelDia.montoTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total del día</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t" />

              {/* Lista de producción */}
              <div className="max-h-[380px] space-y-3 overflow-y-auto">
                {produccionHoy.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay registros para hoy
                  </p>
                ) : (
                  produccionHoy.map((prod) => {
                    const esActiva = prod.actividad.tipoPago === "POR_HORA" && !prod.horaFin;
                    const horaInicio = prod.horaInicio ? new Date(prod.horaInicio) : null;
                    const horaFin = prod.horaFin ? new Date(prod.horaFin) : null;
                    
                    return (
                      <div 
                        key={prod.id} 
                        className={`rounded-lg border p-3 space-y-2 transition-all ${
                          esActiva 
                            ? 'border-warning bg-warning/5 cursor-pointer hover:bg-warning/10 hover:shadow-md' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => esActiva && abrirModalCerrar(prod)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">
                                {prod.trabajador.nombres} {prod.trabajador.apellidos}
                              </p>
                              {esActiva && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                                  <Activity className="h-3 w-3 animate-pulse" />
                                  ACTIVA
                                </span>
                              )}
                              {!esActiva && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-success bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  COMPLETADA
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {prod.actividad.nombre}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                prod.actividad.tipoPago === "POR_HORA" 
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                              }`}>
                                <Clock className="h-3 w-3 mr-1" />
                                {prod.actividad.tipoPago === "POR_HORA" ? "Por Hora" : "Por Producción"}
                              </span>
                            </div>
                            {esActiva && (
                              <p className="text-xs text-warning mt-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Click para cerrar con hora personalizada
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">
                              {formatCurrency(prod.montoGenerado)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {prod.actividad.tipoPago === "POR_HORA" && (
                            <>
                              {horaInicio && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {horaInicio.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {horaFin && (
                                <span className="flex items-center gap-1">
                                  → {horaFin.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {prod.horasTrabajadas && (
                                <span className="font-medium text-foreground flex items-center gap-1">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  {Number(prod.horasTrabajadas).toFixed(2)} horas
                                </span>
                              )}
                            </>
                          )}
                          {prod.cantidadProducida && (
                            <span className="font-medium text-foreground flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {prod.cantidadProducida} unidades
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal Nueva Actividad */}
        {showNuevaActividad && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Nueva Actividad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={nuevaActividad.nombre}
                    onChange={(e) =>
                      setNuevaActividad({ ...nuevaActividad, nombre: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={nuevaActividad.descripcion}
                    onChange={(e) =>
                      setNuevaActividad({ ...nuevaActividad, descripcion: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Pago</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={nuevaActividad.tipoPago}
                    onChange={(e) =>
                      setNuevaActividad({ ...nuevaActividad, tipoPago: e.target.value })
                    }
                  >
                    <option value="POR_HORA">Por Hora</option>
                    <option value="POR_PRODUCCION">Por Producción</option>
                  </select>
                </div>

                {nuevaActividad.tipoPago === "POR_HORA" && (
                  <div className="space-y-2">
                    <Label>Tarifa por Hora</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={nuevaActividad.tarifaPorHora}
                      onChange={(e) =>
                        setNuevaActividad({ ...nuevaActividad, tarifaPorHora: e.target.value })
                      }
                    />
                  </div>
                )}

                {nuevaActividad.tipoPago === "POR_PRODUCCION" && (
                  <>
                    <div className="space-y-2">
                      <Label>Unidad de Medida</Label>
                      <Input
                        placeholder="kg, cajas, unidades, etc."
                        value={nuevaActividad.unidadMedida}
                        onChange={(e) =>
                          setNuevaActividad({ ...nuevaActividad, unidadMedida: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tarifa por Unidad</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={nuevaActividad.tarifaPorUnidad}
                        onChange={(e) =>
                          setNuevaActividad({ ...nuevaActividad, tarifaPorUnidad: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button onClick={crearActividad} disabled={loading} className="flex-1">
                    Crear
                  </Button>
                  <Button
                    onClick={() => setShowNuevaActividad(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Cerrar Actividad */}
        {modalCerrarActividad && actividadACerrar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Cerrar Actividad</CardTitle>
                <CardDescription>
                  {actividadACerrar.actividad.nombre} - {actividadACerrar.trabajador.nombres} {actividadACerrar.trabajador.apellidos}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/30 space-y-2">
                  <p className="text-sm font-medium">Información de la Actividad:</p>
                  <div className="text-sm space-y-1">
                    {actividadACerrar.horaInicio && (
                      <p>
                        <span className="text-muted-foreground">Hora Inicio:</span>{" "}
                        <span className="font-medium">
                          {new Date(actividadACerrar.horaInicio).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    )}
                    {actividadACerrar.actividad.valor && (
                      <p>
                        <span className="text-muted-foreground">Tarifa:</span>{" "}
                        <span className="font-medium">
                          {formatCurrency(actividadACerrar.actividad.valor)}/hora
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Hora de Finalización * (formato 24h: 00:00 - 23:59)</Label>
                  <Input
                    type="time"
                    value={horaFinCierre}
                    onChange={(e) => setHoraFinCierre(e.target.value)}
                    required
                    step="60"
                  />
                  {horaFinCierre && actividadACerrar?.horaInicio && (() => {
                    const horaInicioStr = new Date(actividadACerrar.horaInicio!).toTimeString().substring(0, 5);
                    return horaFinCierre < horaInicioStr && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        🌙 Actividad cruza medianoche (termina día siguiente)
                      </p>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground">
                    Formato 24h. Ej: 02:00, 14:30, 23:45. Si es menor a hora inicio, se asume día siguiente
                  </p>
                </div>

                {horaFinCierre && actividadACerrar.horaInicio && actividadACerrar.actividad.valor && (() => {
                  const horaInicio = new Date(actividadACerrar.horaInicio);
                  
                  // Extraer fecha directamente del string para evitar problemas de timezone
                  const fechaStr = actividadACerrar.fecha;
                  let year: number, month: number, day: number;
                  
                  if (typeof fechaStr === 'string') {
                    const dateMatch = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (dateMatch) {
                      year = parseInt(dateMatch[1]);
                      month = parseInt(dateMatch[2]) - 1;
                      day = parseInt(dateMatch[3]);
                    } else {
                      const fechaProd = new Date(fechaStr);
                      year = fechaProd.getFullYear();
                      month = fechaProd.getMonth();
                      day = fechaProd.getDate();
                    }
                  } else {
                    const fechaProd = new Date(fechaStr);
                    year = fechaProd.getFullYear();
                    month = fechaProd.getMonth();
                    day = fechaProd.getDate();
                  }
                  
                  const [horasFin, minutosFin] = horaFinCierre.split(':').map(Number);
                  let horaFinDate = new Date(year, month, day, horasFin, minutosFin, 0, 0);
                  
                  // DETECCIÓN AUTOMÁTICA DE CRUCE DE MEDIANOCHE
                  // Si hora fin < hora inicio, asumir que es del día siguiente
                  if (horaFinDate < horaInicio) {
                    horaFinDate = new Date(year, month, day + 1, horasFin, minutosFin, 0, 0);
                  }
                  
                  const diffMs = horaFinDate.getTime() - horaInicio.getTime();
                  const horasTrabajadas = diffMs / (1000 * 60 * 60);
                  
                  // Validar que no sea más de 24 horas (probable error)
                  if (horasTrabajadas > 24) {
                    return (
                      <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/30">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          ⚠️ Error: La actividad no puede durar más de 24 horas
                        </p>
                      </div>
                    );
                  }
                  
                  const monto = horasTrabajadas * parseFloat(actividadACerrar.actividad.valor);

                  return (
                    <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/30">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        💰 Cálculo Estimado:
                      </p>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Horas trabajadas:</span>{" "}
                          <span className="font-medium">{horasTrabajadas.toFixed(2)} horas</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Monto generado:</span>{" "}
                          <span className="font-bold text-primary">{formatCurrency(monto.toString())}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button onClick={cerrarActividadConHora} disabled={loading} className="flex-1">
                    Cerrar Actividad
                  </Button>
                  <Button
                    onClick={() => {
                      setModalCerrarActividad(false);
                      setActividadACerrar(null);
                      setHoraFinCierre("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
