"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTime, formatDate, getLocalDateString, parseDateString } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Trabajador {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  tipoTrabajador: string;
}

interface Jornada {
  id: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  diasSemana: number[];
  fechaInicio: string | null;
  fechaFin: string | null;
  esExcepcion: boolean;
  activo: boolean;
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
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState<Asistencia[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getLocalDateString());
  const [selectedTrabajador, setSelectedTrabajador] = useState<string>("");
  const [searchDni, setSearchDni] = useState("");
  const [turnoProgramado, setTurnoProgramado] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());
  
  // Estados para registro manual de hora
  const [usarHoraManual, setUsarHoraManual] = useState(true);
  const [horaManual, setHoraManual] = useState("");

  useEffect(() => {
    cargarTrabajadores();
    cargarJornadas();
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

  const cargarJornadas = async () => {
    try {
      const res = await fetch("/api/jornadas");
      const data = await res.json();
      if (Array.isArray(data)) {
        setJornadas(data.filter((j: Jornada) => j.activo));
      }
    } catch (error) {
      console.error("Error al cargar jornadas:", error);
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
    let turnoParaEnviar: string | undefined = turnoProgramado;
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
      
      // Al registrar salida, usar el turno de la entrada registrada (para cálculos)
      turnoParaEnviar = asistenciaExistente.turnoProgramado || undefined;
    }

    // Validar hora manual si está activada
    if (usarHoraManual && !horaManual) {
      alert("Debe seleccionar una hora");
      return;
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
          turnoProgramado: tipo === "entrada" ? turnoProgramado : turnoParaEnviar,
          observaciones,
          horaPersonalizada: usarHoraManual ? horaManual : undefined,
        }),
      });

      if (res.ok) {
        alert(`${tipo === "entrada" ? "Entrada" : "Salida"} registrada exitosamente`);
        setSelectedTrabajador("");
        setSearchDni("");
        setObservaciones("");
        setHoraManual("");
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
    if (fechaSeleccionada !== getLocalDateString()) {
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
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold">Control de Puerta</h1>
              <p className="text-muted-foreground">Registro de asistencias</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2">
              <input
                type="checkbox"
                id="usarHoraManual"
                checked={usarHoraManual}
                onChange={(e) => setUsarHoraManual(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="usarHoraManual" className="cursor-pointer text-sm font-medium m-0">
                Hora manual
              </Label>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatTime(horaActual)}</p>
            <p className="text-sm text-muted-foreground">{formatDate(horaActual)}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Registrar Asistencia</CardTitle>
                  <CardDescription>Marcar entrada o salida de trabajador</CardDescription>
                </div>
                {selectedTrabajador && (() => {
                  const asistencia = asistenciasHoy.find(a => a.trabajadorId === selectedTrabajador);
                  const tieneEntrada = asistencia?.horaEntrada;
                  const tieneSalida = asistencia?.horaSalida;

                  if (!tieneEntrada) {
                    return (
                      <Button
                        onClick={() => registrarAsistencia("entrada")}
                        disabled={loading}
                        size="sm"
                      >
                        Registrar Entrada
                      </Button>
                    );
                  } else if (tieneEntrada && !tieneSalida) {
                    return (
                      <Button
                        onClick={() => registrarAsistencia("salida")}
                        disabled={loading}
                        variant="secondary"
                        size="sm"
                      >
                        Registrar Salida
                      </Button>
                    );
                  } else {
                    return null;
                  }
                })()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="hora">{usarHoraManual ? "Hora específica" : "Hora actual"}</Label>
                  {usarHoraManual ? (
                    <Input
                      id="hora"
                      type="time"
                      step="1"
                      value={horaManual}
                      onChange={(e) => setHoraManual(e.target.value)}
                      className="bg-background"
                    />
                  ) : (
                    <Input
                      id="hora"
                      type="text"
                      value={formatTime(horaActual)}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </div>
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

              {selectedTrabajador && (() => {
                const trabajador = trabajadores.find(t => t.id === selectedTrabajador);
                const asistencia = asistenciasHoy.find(a => a.trabajadorId === selectedTrabajador);
                const tieneEntrada = asistencia?.horaEntrada;
                const esTrabajadorFijo = trabajador?.tipoTrabajador === "FIJO";
                
                // Solo mostrar selector si es FIJO y NO tiene entrada registrada
                if (esTrabajadorFijo && !tieneEntrada) {
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="turno">
                        {fechaSeleccionada === getLocalDateString()
                          ? "¿Qué jornada trabajará hoy?"
                          : `¿Qué jornada trabajó el ${parseDateString(fechaSeleccionada).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}?`}
                      </Label>
                      <select
                        id="turno"
                        value={turnoProgramado}
                        onChange={(e) => setTurnoProgramado(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="">Seleccione una jornada...</option>
                        {jornadas.map((jornada) => {
                          const horario = `${jornada.horaInicio}-${jornada.horaFin}`;
                          const yaPaso = turnoYaPaso(horario);
                          return (
                            <option key={jornada.id} value={horario} disabled={yaPaso}>
                              {jornada.nombre} ({jornada.horaInicio} - {jornada.horaFin}){yaPaso ? " - Jornada finalizada" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  );
                }
                
                // Si tiene entrada y es FIJO, mostrar la jornada registrada
                if (esTrabajadorFijo && tieneEntrada && asistencia?.turnoProgramado) {
                  return (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600 font-medium mb-1">Jornada registrada:</p>
                      <p className="text-sm text-blue-800 font-semibold">{asistencia.turnoProgramado}</p>
                    </div>
                  );
                }
                
                // Para EVENTUALES, mostrar mensaje informativo
                if (!esTrabajadorFijo && !tieneEntrada) {
                  return (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs text-gray-600">Trabajador EVENTUAL - No requiere jornada</p>
                    </div>
                  );
                }
                
                return null;
              })()}

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

              {selectedTrabajador && (() => {
                const asistencia = asistenciasHoy.find(a => a.trabajadorId === selectedTrabajador);
                const tieneEntrada = asistencia?.horaEntrada;
                const tieneSalida = asistencia?.horaSalida;

                if (tieneEntrada && tieneSalida) {
                  return (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Asistencia completa registrada para esta fecha
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {!selectedTrabajador && (
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Seleccione un trabajador para registrar asistencia
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asistencias del {formatDate(parseDateString(fechaSeleccionada))}</CardTitle>
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
                        {asistencia.minutosRetraso > 0 && (() => {
                          const minutos = asistencia.minutosRetraso;
                          const horas = Math.floor(minutos / 60);
                          const mins = minutos % 60;
                          
                          let mensaje = "";
                          if (horas > 0 && mins > 0) {
                            mensaje = `${horas} ${horas === 1 ? 'hora' : 'horas'} y ${mins} ${mins === 1 ? 'minuto' : 'minutos'} de atraso`;
                          } else if (horas > 0) {
                            mensaje = `${horas} ${horas === 1 ? 'hora' : 'horas'} de atraso`;
                          } else {
                            mensaje = `${mins} ${mins === 1 ? 'minuto' : 'minutos'} de atraso`;
                          }
                          
                          return (
                            <p className="text-xs text-yellow-600 font-medium mt-1">
                              {mensaje}
                            </p>
                          );
                        })()}
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
