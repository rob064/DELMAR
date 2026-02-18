"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTime, formatDate, getLocalDateString, parseDateString } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, AlertCircle, Search, User, LogIn, LogOut, Users, TrendingUp, Award } from "lucide-react";

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
      toast.warning("Trabajador requerido", {
        description: "Por favor seleccione un trabajador de la lista",
      });
      return;
    }

    // Validar que no se registre salida sin entrada
    let turnoParaEnviar: string | undefined = turnoProgramado;
    if (tipo === "salida") {
      const asistenciaExistente = asistenciasHoy.find(
        (a) => a.trabajadorId === selectedTrabajador
      );
      
      if (!asistenciaExistente || !asistenciaExistente.horaEntrada) {
        toast.error("Entrada no registrada", {
          description: "No se puede registrar salida sin una entrada previa en esta fecha",
        });
        return;
      }
      
      if (asistenciaExistente.horaSalida) {
        toast.error("Salida ya registrada", {
          description: "Ya existe una salida registrada para este trabajador en esta fecha",
        });
        return;
      }
      
      // Al registrar salida, usar el turno de la entrada registrada (para cálculos)
      turnoParaEnviar = asistenciaExistente.turnoProgramado || undefined;
    }

    // Validar hora manual si está activada
    if (usarHoraManual && !horaManual) {
      toast.warning("Hora requerida", {
        description: "Debe seleccionar una hora cuando usa hora manual",
      });
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
        toast.success(`${tipo === "entrada" ? "Entrada" : "Salida"} registrada`, {
          description: `${tipo === "entrada" ? "Entrada" : "Salida"} registrada exitosamente para ${trabajadores.find(t => t.id === selectedTrabajador)?.nombres}`,
        });
        setSelectedTrabajador("");
        setSearchDni("");
        setObservaciones("");
        setHoraManual("");
        cargarAsistenciasHoy();
      } else {
        const error = await res.json();
        toast.error("Error al registrar", {
          description: error.error || "Error al registrar asistencia",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error inesperado", {
        description: "Ocurrió un error al registrar la asistencia",
      });
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

  const getEstadoBadge = (estado: string) => {
    const styles = {
      PRESENTE: "bg-success/10 text-success border-success/20",
      TARDE: "bg-warning/10 text-warning border-warning/20",
      AUSENTE: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return styles[estado as keyof typeof styles] || "bg-muted text-muted-foreground border-muted";
  };

  // Stats del día
  const statsDelDia = {
    totalTrabajadores: trabajadores.filter(t => t.tipoTrabajador === "FIJO").length,
    totalAsistencias: asistenciasHoy.length,
    tardanzas: asistenciasHoy.filter(a => a.estado === "TARDE").length,
    porcentajeAsistencia: trabajadores.filter(t => t.tipoTrabajador === "FIJO").length > 0
      ? Math.round((asistenciasHoy.length / trabajadores.filter(t => t.tipoTrabajador === "FIJO").length) * 100)
      : 0,
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
                        className="gap-2 bg-gradient-to-r from-success to-green-700 hover:from-success/90 hover:to-green-700/90"
                      >
                        <LogIn className="h-4 w-4" />
                        Registrar Entrada
                      </Button>
                    );
                  } else if (tieneEntrada && !tieneSalida) {
                    return (
                      <Button
                        onClick={() => registrarAsistencia("salida")}
                        disabled={loading}
                        variant="secondary"
                        className="gap-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                      >
                        <LogOut className="h-4 w-4" />
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Escriba DNI o nombre..."
                    value={searchDni}
                    onChange={(e) => setSearchDni(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchDni && (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                  {trabajadoresFiltrados.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No se encontraron trabajadores
                    </p>
                  ) : (
                    trabajadoresFiltrados.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTrabajador(t.id);
                          setSearchDni(`${t.nombres} ${t.apellidos} - ${t.dni}`);
                        }}
                        className={`w-full rounded-md p-3 text-left transition-colors hover:bg-accent ${
                          selectedTrabajador === t.id ? "bg-primary/10 border border-primary/20" : ""
                        }`}
                      >
                        <p className="font-medium">
                          {t.nombres} {t.apellidos}
                        </p>
                        <p className="text-sm text-muted-foreground">DNI: {t.dni}</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Card informativa del trabajador seleccionado */}
              {selectedTrabajador && (() => {
                const trabajador = trabajadores.find(t => t.id === selectedTrabajador);
                const asistencia = asistenciasHoy.find(a => a.trabajadorId === selectedTrabajador);
                const tieneEntrada = asistencia?.horaEntrada;
                const tieneSalida = asistencia?.horaSalida;

                if (!trabajador) return null;

                return (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">
                              {trabajador.nombres} {trabajador.apellidos}
                            </p>
                            <p className="text-sm text-muted-foreground">DNI: {trabajador.dni}</p>
                            <div className="mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-background">
                              {trabajador.tipoTrabajador}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {!tieneEntrada && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              <Clock className="h-3 w-3" />
                              Sin entrada
                            </div>
                          )}
                          {tieneEntrada && !tieneSalida && asistencia?.horaEntrada && (
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                <LogIn className="h-3 w-3" />
                                Entrada registrada
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(new Date(asistencia.horaEntrada!))}
                              </p>
                            </div>
                          )}
                          {tieneEntrada && tieneSalida && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              <CheckCircle className="h-3 w-3" />
                              Asistencia completa
                            </div>
                          )}
                        </div>
                      </div>
                      {asistencia?.turnoProgramado && (
                        <div className="mt-3 rounded-md border bg-background p-2">
                          <p className="text-xs text-muted-foreground">Jornada programada:</p>
                          <p className="text-sm font-medium">{asistencia.turnoProgramado}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

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
            <CardContent className="space-y-4">
              {/* Stats del día */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-blue-50/50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statsDelDia.totalAsistencias}</p>
                      <p className="text-xs text-muted-foreground">Asistencias</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border bg-gradient-to-br from-warning/5 to-yellow-50/50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-warning/10 p-2">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statsDelDia.tardanzas}</p>
                      <p className="text-xs text-muted-foreground">Tardanzas</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border bg-gradient-to-br from-success/5 to-green-50/50 p-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-success/10 p-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{statsDelDia.porcentajeAsistencia}%</p>
                        <p className="text-xs text-muted-foreground">Asistencia del día</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {statsDelDia.totalAsistencias} de {statsDelDia.totalTrabajadores}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t" />

              {/* Lista de asistencias */}
              <div className="max-h-[380px] space-y-3 overflow-y-auto">
                {asistenciasHoy.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay registros para esta fecha
                  </p>
                ) : (
                  asistenciasHoy.map((asistencia) => (
                    <div
                      key={asistencia.id}
                      className="flex items-start justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getEstadoIcon(asistencia.estado)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {asistencia.trabajador.nombres} {asistencia.trabajador.apellidos}
                            </p>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getEstadoBadge(asistencia.estado)}`}>
                              {asistencia.estado}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            DNI: {asistencia.trabajador.dni}
                          </p>
                          {asistencia.turnoProgramado && (
                            <p className="text-xs text-muted-foreground">
                              Jornada: {asistencia.turnoProgramado}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {asistencia.horaEntrada && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <LogIn className="h-3 w-3 text-muted-foreground" />
                            <span>{formatTime(new Date(asistencia.horaEntrada!))}</span>
                          </div>
                        )}
                        {asistencia.horaSalida && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <LogOut className="h-3 w-3 text-muted-foreground" />
                            <span>{formatTime(new Date(asistencia.horaSalida!))}</span>
                          </div>
                        )}
                        {asistencia.minutosRetraso > 0 && (() => {
                          const minutos = asistencia.minutosRetraso;
                          const horas = Math.floor(minutos / 60);
                          const mins = minutos % 60;
                          
                          let mensaje = "";
                          if (horas > 0 && mins > 0) {
                            mensaje = `${horas}h ${mins}m tarde`;
                          } else if (horas > 0) {
                            mensaje = `${horas}h tarde`;
                          } else {
                            mensaje = `${mins}m tarde`;
                          }
                          
                          return (
                            <div className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                              <AlertCircle className="h-3 w-3" />
                              {mensaje}
                            </div>
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
