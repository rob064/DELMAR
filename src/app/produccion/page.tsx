"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency } from "@/lib/utils";
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
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split("T")[0]);
  
  // Fecha para el formulario de registro (lado izquierdo)
  const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().split("T")[0]);
  
  const [selectedTrabajador, setSelectedTrabajador] = useState("");
  const [selectedActividad, setSelectedActividad] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
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

  // Calcular horas trabajadas automáticamente cuando cambien hora inicio o hora fin
  useEffect(() => {
    const actividad = actividades.find((a) => a.id === selectedActividad);
    
    if (actividad?.tipoPago === "POR_HORA" && horaInicio && horaFin) {
      const [horaI, minI] = horaInicio.split(":").map(Number);
      const [horaF, minF] = horaFin.split(":").map(Number);
      
      const minutosInicio = horaI * 60 + minI;
      const minutosFin = horaF * 60 + minF;
      
      let diferenciaMinutos = minutosFin - minutosInicio;
      
      // Si la hora fin es menor que la hora inicio, asumimos que cruzó la medianoche
      if (diferenciaMinutos < 0) {
        diferenciaMinutos += 24 * 60;
      }
      
      const horas = (diferenciaMinutos / 60).toFixed(2);
      setHorasTrabajadas(horas);
    } else if (actividad?.tipoPago === "POR_HORA" && (!horaInicio || !horaFin)) {
      setHorasTrabajadas("");
    }
  }, [horaInicio, horaFin, selectedActividad, actividades]);

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

    // Validación para POR_HORA: debe tener hora inicio y hora fin
    if (actividad.tipoPago === "POR_HORA") {
      if (!horaInicio || !horaFin) {
        alert("Por favor ingrese hora de inicio y hora de fin");
        return;
      }
      if (!horasTrabajadas || parseFloat(horasTrabajadas) <= 0) {
        alert("Las horas trabajadas deben ser mayores a 0");
        return;
      }
    }

    // Validación para POR_PRODUCCION: debe tener al menos hora inicio
    if (actividad.tipoPago === "POR_PRODUCCION") {
      if (!horaInicio) {
        alert("Por favor ingrese al menos la hora de inicio");
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
          horaInicio: horaInicio ? `${fechaRegistro}T${horaInicio}:00` : null,
          horaFin: horaFin ? `${fechaRegistro}T${horaFin}:00` : null,
          horasTrabajadas: horasTrabajadas || null,
          cantidadProducida: cantidadProducida || null,
          observaciones,
        }),
      });

      if (res.ok) {
        alert("Producción registrada exitosamente");
        setSelectedTrabajador("");
        setSelectedActividad("");
        setHoraInicio("");
        setHoraFin("");
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

              {actividadSeleccionada?.tipoPago === "POR_HORA" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Hora Inicio *</Label>
                      <Input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Fin *</Label>
                      <Input
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Horas Trabajadas (calculado)</Label>
                    <Input
                      type="text"
                      value={horasTrabajadas}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Se calcula automáticamente"
                    />
                    {actividadSeleccionada.tarifaPorHora && horasTrabajadas && (
                      <p className="text-sm text-muted-foreground">
                        Tarifa: {formatCurrency(actividadSeleccionada.tarifaPorHora)}/hora
                        {" → "}Total: {formatCurrency((parseFloat(horasTrabajadas) * parseFloat(actividadSeleccionada.tarifaPorHora)).toString())}
                      </p>
                    )}
                  </div>
                </>
              )}

              {actividadSeleccionada?.tipoPago === "POR_PRODUCCION" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Hora Inicio *</Label>
                      <Input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora Fin (opcional)</Label>
                      <Input
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                      />
                    </div>
                  </div>

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
                </>
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
