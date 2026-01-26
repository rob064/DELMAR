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
  trabajador: {
    nombres: string;
    apellidos: string;
  };
  actividad: {
    nombre: string;
    tipoPago: string;
  };
}

export default function ProduccionPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [produccionHoy, setProduccionHoy] = useState<Produccion[]>([]);
  
  // Fecha para el filtro de producción (lado derecho)
  const [fechaFiltro, setFechaFiltro] = useState(getLocalDateString());
  
  // Fecha para el formulario de registro (lado izquierdo)
  const [fechaRegistro, setFechaRegistro] = useState(getLocalDateString());
  
  const [selectedTrabajador, setSelectedTrabajador] = useState("");
  const [selectedActividad, setSelectedActividad] = useState("");
  const [asistenciaDelDia, setAsistenciaDelDia] = useState<any>(null);
  const [horasTrabajadas, setHorasTrabajadas] = useState("");
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
    } else {
      setAsistenciaDelDia(null);
      setHorasTrabajadas("");
    }
  }, [selectedTrabajador, fechaRegistro]);

  // Calcular horas trabajadas automáticamente cuando haya asistencia
  useEffect(() => {
    if (asistenciaDelDia?.horaEntrada && asistenciaDelDia?.horaSalida) {
      const entrada = new Date(asistenciaDelDia.horaEntrada);
      const salida = new Date(asistenciaDelDia.horaSalida);
      
      const diferenciaMs = salida.getTime() - entrada.getTime();
      const horas = (diferenciaMs / (1000 * 60 * 60)).toFixed(2);
      
      setHorasTrabajadas(horas);
    } else {
      setHorasTrabajadas("");
    }
  }, [asistenciaDelDia]);

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

    // Validación para POR_HORA: debe tener asistencia registrada con entrada y salida
    if (actividad.tipoPago === "POR_HORA") {
      if (!asistenciaDelDia) {
        alert("El trabajador no tiene asistencia registrada para esta fecha");
        return;
      }
      if (!asistenciaDelDia.horaEntrada || !asistenciaDelDia.horaSalida) {
        alert("El trabajador no tiene hora de salida registrada");
        return;
      }
      if (!horasTrabajadas || parseFloat(horasTrabajadas) <= 0) {
        alert("No se pudieron calcular las horas trabajadas");
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
          horaInicio: asistenciaDelDia?.horaEntrada || null,
          horaFin: asistenciaDelDia?.horaSalida || null,
          horasTrabajadas: horasTrabajadas || null,
          cantidadProducida: cantidadProducida || null,
          observaciones,
        }),
      });

      if (res.ok) {
        alert("Producción registrada exitosamente");
        setSelectedTrabajador("");
        setSelectedActividad("");
        setAsistenciaDelDia(null);
        setHorasTrabajadas("");
        setCantidadProducida("");
        setObservaciones("");
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
    <div className="min-h-screen bg-gray-50">
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
                            {new Date(asistenciaDelDia.horaEntrada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hora Salida:</span>{" "}
                          <span className="font-medium">
                            {asistenciaDelDia.horaSalida 
                              ? new Date(asistenciaDelDia.horaSalida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
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
                <div className="space-y-2">
                  <Label>Horas Trabajadas (automático)</Label>
                  <Input
                    type="text"
                    value={horasTrabajadas || "0.00"}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Se calcula desde asistencia"
                  />
                  {actividadSeleccionada.tarifaPorHora && horasTrabajadas && (
                    <p className="text-sm text-muted-foreground">
                      Tarifa: {formatCurrency(actividadSeleccionada.tarifaPorHora)}/hora
                      {" → "}Total: {formatCurrency((parseFloat(horasTrabajadas) * parseFloat(actividadSeleccionada.tarifaPorHora)).toString())}
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
                  produccionHoy.map((prod) => (
                    <div key={prod.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {prod.trabajador.nombres} {prod.trabajador.apellidos}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {prod.actividad.nombre}
                          </p>
                        </div>
                        <p className="font-bold text-primary">
                          {formatCurrency(prod.montoGenerado)}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        {prod.horasTrabajadas && (
                          <span>{prod.horasTrabajadas} horas</span>
                        )}
                        {prod.cantidadProducida && (
                          <span>{prod.cantidadProducida} unidades</span>
                        )}
                      </div>
                    </div>
                  ))
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
