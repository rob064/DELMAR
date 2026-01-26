"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency, getLocalDateString } from "@/lib/utils";
import { Package, Plus } from "lucide-react";

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
        alert("Actividad cerrada exitosamente");
        cargarActividadesActivas();
        cargarDatos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al cerrar actividad");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cerrar actividad");
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
      alert("Por favor seleccione trabajador y actividad");
      return;
    }

    const actividad = actividades.find((a) => a.id === selectedActividad);
    if (!actividad) return;

    // Validación: No se puede registrar producción si hay actividad por horas activa
    if (actividadesActivas.length > 0) {
      alert("Hay actividades por horas activas. Debe cerrarlas antes de continuar.");
      return;
    }

    // Validación para POR_HORA: debe tener asistencia registrada con entrada
    if (actividad.tipoPago === "POR_HORA") {
      if (!asistenciaDelDia || !asistenciaDelDia.horaEntrada) {
        alert("El trabajador no tiene asistencia registrada para esta fecha");
        return;
      }
    }

    // Validación para POR_PRODUCCION: debe tener asistencia registrada con al menos entrada
    if (actividad.tipoPago === "POR_PRODUCCION") {
      if (!asistenciaDelDia || !asistenciaDelDia.horaEntrada) {
        alert("El trabajador no tiene asistencia (hora de entrada) registrada para esta fecha");
        return;
      }
      if (!cantidadProducida) {
        alert("Por favor ingrese la cantidad producida");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabajadorId: selectedTrabajador,
          actividadId: selectedActividad,
          fecha: fechaRegistro,
          horaInicio: actividad.tipoPago === "POR_HORA" ? null : undefined, // null para que el backend lo maneje
          horaFin: null,
          horasTrabajadas: null,
          cantidadProducida: cantidadProducida || null,
          observaciones,
        }),
      });

      if (res.ok) {
        alert("Producción registrada exitosamente");
        setSelectedTrabajador("");
        setSelectedActividad("");
        setAsistenciaDelDia(null);
        setCantidadProducida("");
        setObservaciones("");
        setActividadesActivas([]);
        cargarDatos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al registrar producción");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar producción");
    } finally {
      setLoading(false);
    }
  };

  const crearActividad = async () => {
    if (!nuevaActividad.nombre) {
      alert("Por favor ingrese el nombre de la actividad");
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
        alert("Actividad creada exitosamente");
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
        alert(error.error || "Error al crear actividad");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear actividad");
    } finally {
      setLoading(false);
    }
  };

  const actividadSeleccionada = actividades.find((a) => a.id === selectedActividad);

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Módulo de Producción</h1>
            <p className="text-muted-foreground">Registro de actividades y producción diaria</p>
          </div>
          <Button onClick={() => setShowNuevaActividad(true)}>
            <Plus className="mr-2 h-4 w-4" />
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
                <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
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
                      <div key={act.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{act.actividad.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              Inicio: {horaInicio?.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                              Tiempo: {horas}h {minutos}m
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cerrarActividad(act.id)}
                            disabled={loading}
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Debe cerrar estas actividades antes de registrar producción
                  </p>
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
                <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/30 space-y-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ℹ️ Actividad Por Horas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se iniciará automáticamente y se debe cerrar manualmente cuando termine la actividad.
                  </p>
                  {actividadSeleccionada.tarifaPorHora && (
                    <p className="text-sm text-muted-foreground">
                      Tarifa: {formatCurrency(actividadSeleccionada.tarifaPorHora)}/hora
                    </p>
                  )}
                </div>
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
            <CardContent>
              <div className="max-h-[500px] space-y-3 overflow-y-auto">
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
                        className={`rounded-lg border p-3 space-y-2 ${
                          esActiva ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {prod.trabajador.nombres} {prod.trabajador.apellidos}
                              </p>
                              {esActiva && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                                  ACTIVA
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {prod.actividad.nombre}
                              {prod.actividad.tipoPago === "POR_HORA" ? " (Por Hora)" : " (Por Producción)"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {formatCurrency(prod.montoGenerado)}
                            </p>
                            {esActiva && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => cerrarActividad(prod.id)}
                                disabled={loading}
                                className="mt-1"
                              >
                                Cerrar
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {prod.actividad.tipoPago === "POR_HORA" && (
                            <>
                              {horaInicio && (
                                <span>Inicio: {horaInicio.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                              {horaFin && (
                                <span>Fin: {horaFin.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                              {prod.horasTrabajadas && (
                                <span className="font-medium text-foreground">
                                  {Number(prod.horasTrabajadas).toFixed(2)} horas
                                </span>
                              )}
                            </>
                          )}
                          {prod.cantidadProducida && (
                            <span className="font-medium text-foreground">
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
      </div>
    </div>
  );
}
