"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTime, formatDate } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Trabajador {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
}

interface Asistencia {
  id: string;
  fecha: string;
  trabajadorId: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  turnoProgramado: string | null;
  estado: string;
  minutosRetraso: number;
  trabajador: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export default function PuertaPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState<Asistencia[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTrabajador, setSelectedTrabajador] = useState<string>("");
  const [searchDni, setSearchDni] = useState("");
  const [turnoProgramado, setTurnoProgramado] = useState<string>("08:00-16:00");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    cargarTrabajadores();
    cargarAsistenciasHoy();

    const interval = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [fechaSeleccionada]);

  const cargarTrabajadores = async () => {
    try {
      const res = await fetch("/api/trabajadores");
      const data = await res.json();
      setTrabajadores(data);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
    }
  };

  const cargarAsistenciasHoy = async () => {
    try {
      const res = await fetch(`/api/asistencias?fecha=${fechaSeleccionada}`);
      const data = await res.json();
      setAsistenciasHoy(data);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
    }
  };

  const registrarAsistencia = async (tipo: "entrada" | "salida") => {
    if (!selectedTrabajador) {
      alert("Por favor seleccione un trabajador");
      return;
    }

    // Validar que no se registre salida sin entrada
    if (tipo === "salida") {
      const asistenciaExistente = asistenciasHoy.find(
        (a) => a.trabajadorId === selectedTrabajador
      );
      
      if (!asistenciaExistente || !asistenciaExistente.horaEntrada) {
        alert("No se puede registrar salida sin una entrada previa en esta fecha");
        return;
      }
      
      if (asistenciaExistente.horaSalida) {
        alert("Ya existe una salida registrada para este trabajador en esta fecha");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabajadorId: selectedTrabajador,
          tipo,
          fecha: fechaSeleccionada,
          turnoProgramado: tipo === "entrada" ? turnoProgramado : undefined,
          observaciones,
        }),
      });

      if (res.ok) {
        alert(`${tipo === "entrada" ? "Entrada" : "Salida"} registrada exitosamente`);
        setSelectedTrabajador("");
        setSearchDni("");
        setObservaciones("");
        cargarAsistenciasHoy();
      } else {
        const error = await res.json();
        alert(error.error || "Error al registrar asistencia");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar asistencia");
    } finally {
      setLoading(false);
    }
  };

  // Verificar si un turno ya pasó (solo para fecha actual)
  const turnoYaPaso = (turno: string): boolean => {
    if (fechaSeleccionada !== new Date().toISOString().split("T")[0]) {
      return false; // Si no es hoy, no bloquear ningún turno
    }

    const horaFin = turno.split("-")[1];
    const [horaFinHora, horaFinMin] = horaFin.split(":").map(Number);
    
    const ahora = new Date();
    const horaActualHora = ahora.getHours();
    const horaActualMin = ahora.getMinutes();
    
    // Convertir a minutos totales para comparar
    const minutosActuales = horaActualHora * 60 + horaActualMin;
    const minutosFinTurno = horaFinHora * 60 + horaFinMin;
    
    return minutosActuales > minutosFinTurno;
  };

  const trabajadoresFiltrados = trabajadores.filter(
    (t) =>
      t.dni.includes(searchDni) ||
      t.nombres.toLowerCase().includes(searchDni.toLowerCase()) ||
      t.apellidos.toLowerCase().includes(searchDni.toLowerCase())
  );

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "PRESENTE":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "TARDE":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "AUSENTE":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Control de Puerta</h1>
            <p className="text-muted-foreground">Registro de asistencias</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatTime(horaActual)}</p>
            <p className="text-sm text-muted-foreground">{formatDate(horaActual)}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Asistencia</CardTitle>
              <CardDescription>Marcar entrada o salida de trabajador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Buscar Trabajador (DNI o Nombre)</Label>
                <Input
                  id="search"
                  placeholder="Escriba DNI o nombre..."
                  value={searchDni}
                  onChange={(e) => setSearchDni(e.target.value)}
                />
              </div>

              {searchDni && (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                  {trabajadoresFiltrados.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTrabajador(t.id);
                        setSearchDni(`${t.nombres} ${t.apellidos} - ${t.dni}`);
                      }}
                      className={`w-full rounded-md p-3 text-left hover:bg-gray-100 ${
                        selectedTrabajador === t.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <p className="font-medium">
                        {t.nombres} {t.apellidos}
                      </p>
                      <p className="text-sm text-muted-foreground">DNI: {t.dni}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedTrabajador && (
                <div className="space-y-2">
                  <Label htmlFor="turno">
                    {fechaSeleccionada === new Date().toISOString().split("T")[0]
                      ? "¿Qué turno trabajará hoy?"
                      : `¿Qué turno trabajó el ${new Date(fechaSeleccionada).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}?`}
                  </Label>
                  <select
                    id="turno"
                    value={turnoProgramado}
                    onChange={(e) => setTurnoProgramado(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="08:00-16:00" disabled={turnoYaPaso("08:00-16:00")}>
                      Mañana (08:00 - 16:00){turnoYaPaso("08:00-16:00") ? " - Turno finalizado" : ""}
                    </option>
                    <option value="16:00-24:00" disabled={turnoYaPaso("16:00-24:00")}>
                      Tarde (16:00 - 24:00){turnoYaPaso("16:00-24:00") ? " - Turno finalizado" : ""}
                    </option>
                    <option value="00:00-08:00" disabled={turnoYaPaso("00:00-08:00")}>
                      Noche (00:00 - 08:00){turnoYaPaso("00:00-08:00") ? " - Turno finalizado" : ""}
                    </option>
                    <option value="06:00-14:00" disabled={turnoYaPaso("06:00-14:00")}>
                      Temprano (06:00 - 14:00){turnoYaPaso("06:00-14:00") ? " - Turno finalizado" : ""}
                    </option>
                    <option value="14:00-22:00" disabled={turnoYaPaso("14:00-22:00")}>
                      Vespertino (14:00 - 22:00){turnoYaPaso("14:00-22:00") ? " - Turno finalizado" : ""}
                    </option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Ingrese observaciones..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => registrarAsistencia("entrada")}
                  disabled={loading || !selectedTrabajador}
                  className="flex-1"
                >
                  Registrar Entrada
                </Button>
                <Button
                  onClick={() => registrarAsistencia("salida")}
                  disabled={loading || !selectedTrabajador}
                  variant="secondary"
                  className="flex-1"
                >
                  Registrar Salida
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asistencias del {formatDate(new Date(fechaSeleccionada))}</CardTitle>
                  <CardDescription>
                    {asistenciasHoy.length} registro(s)
                  </CardDescription>
                </div>
                <Input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] space-y-3 overflow-y-auto">
                {asistenciasHoy.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay registros para esta fecha
                  </p>
                ) : (
                  asistenciasHoy.map((asistencia) => (
                    <div
                      key={asistencia.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {getEstadoIcon(asistencia.estado)}
                        <div>
                          <p className="font-medium">
                            {asistencia.trabajador.nombres} {asistencia.trabajador.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            DNI: {asistencia.trabajador.dni}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {asistencia.horaEntrada && (
                          <p className="text-sm">
                            Entrada: {formatTime(new Date(asistencia.horaEntrada))}
                          </p>
                        )}
                        {asistencia.horaSalida && (
                          <p className="text-sm">
                            Salida: {formatTime(new Date(asistencia.horaSalida))}
                          </p>
                        )}
                        {asistencia.minutosRetraso > 0 && (
                          <p className="text-xs text-yellow-600">
                            +{asistencia.minutosRetraso} min
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
