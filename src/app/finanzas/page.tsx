"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, obtenerFechaSemana } from "@/lib/utils";
import { DollarSign, Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import Decimal from "decimal.js";

interface Trabajador {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
}

interface Transaccion {
  id: string;
  tipo: string;
  monto: string;
  concepto: string;
  fecha: string;
  descontado: boolean;
  trabajador: {
    nombres: string;
    apellidos: string;
  };
}

interface Abono {
  id: string;
  monto: string;
  metodoPago: string;
  numeroReferencia: string | null;
  fecha: string;
  observaciones: string | null;
}

interface Pago {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  montoBase: string;
  adelantos: string;
  multas: string;
  ajustes: string;
  totalNeto: string;
  montoPagado: string;
  saldoPendiente: string;
  pagado: boolean;
  trabajador: {
    nombres: string;
    apellidos: string;
  };
  abonos: Abono[];
}

export default function FinanzasPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal transacción
  const [showNuevaTransaccion, setShowNuevaTransaccion] = useState(false);
  const [nuevaTransaccion, setNuevaTransaccion] = useState({
    trabajadorId: "",
    tipo: "ADELANTO",
    monto: "",
    concepto: "",
    observaciones: "",
  });

  // Generar nómina
  const [trabajadorNomina, setTrabajadorNomina] = useState("");
  const [fechaInicioNomina, setFechaInicioNomina] = useState("");
  const [fechaFinNomina, setFechaFinNomina] = useState("");
  
  // Modal abono
  const [showModalAbono, setShowModalAbono] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [nuevoAbono, setNuevoAbono] = useState({
    monto: "",
    metodoPago: "Efectivo",
    numeroReferencia: "",
    observaciones: "",
  });

  // Vista previa nómina
  const [showPreviewNomina, setShowPreviewNomina] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Editar transacción
  const [showEditarTransaccion, setShowEditarTransaccion] = useState(false);
  const [transaccionEditar, setTransaccionEditar] = useState<any>(null);

  // Modales de detalle
  const [showDetalleAsistencias, setShowDetalleAsistencias] = useState(false);
  const [showDetalleMultas, setShowDetalleMultas] = useState(false);

  // Editar bonificación
  const [bonificacionEditable, setBonificacionEditable] = useState("");
  const [conceptoBonificacion, setConceptoBonificacion] = useState("");

  // Modal justificación
  const [showModalJustificacion, setShowModalJustificacion] = useState(false);
  const [asistenciaJustificar, setAsistenciaJustificar] = useState<any>(null);
  const [justificacionForm, setJustificacionForm] = useState({
    montoDescuentoFinal: "",
    motivoJustificacion: "",
  });

  useEffect(() => {
    cargarDatos();
    // Establecer semana actual por defecto
    const { inicio, fin } = obtenerFechaSemana();
    setFechaInicioNomina(inicio.toISOString().split("T")[0]);
    setFechaFinNomina(fin.toISOString().split("T")[0]);
  }, []);

  const cargarDatos = async () => {
    try {
      const [trabajadoresRes, transaccionesRes, pagosRes] = await Promise.all([
        fetch("/api/trabajadores"),
        fetch("/api/transacciones"),
        fetch("/api/pagos"),
      ]);

      const trabajadoresData = await trabajadoresRes.json();
      const transaccionesData = await transaccionesRes.json();
      const pagosData = await pagosRes.json();

      setTrabajadores(Array.isArray(trabajadoresData) ? trabajadoresData : []);
      setTransacciones(Array.isArray(transaccionesData) ? transaccionesData : []);
      setPagos(Array.isArray(pagosData) ? pagosData : []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const crearTransaccion = async () => {
    if (!nuevaTransaccion.trabajadorId || !nuevaTransaccion.monto || !nuevaTransaccion.concepto) {
      toast.warning("Por favor complete todos los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transacciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaTransaccion),
      });

      if (res.ok) {
        toast.success("Transacción registrada exitosamente");
        setShowNuevaTransaccion(false);
        setNuevaTransaccion({
          trabajadorId: "",
          tipo: "ADELANTO",
          monto: "",
          concepto: "",
          observaciones: "",
        });
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al registrar transacción");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al registrar transacción");
    } finally {
      setLoading(false);
    }
  };

  const generarNomina = async () => {
    if (!trabajadorNomina) {
      toast.warning("Por favor seleccione un trabajador");
      return;
    }

    if (!fechaInicioNomina || !fechaFinNomina) {
      toast.warning("Por favor seleccione las fechas");
      return;
    }

    // Validar bonificación si fue editada para trabajadores FIJOS
    if (previewData && previewData.trabajador.tipoTrabajador === "FIJO") {
      const bonificacionNumero = parseFloat(bonificacionEditable);
      if (isNaN(bonificacionNumero) || bonificacionNumero < 0) {
        toast.warning("La bonificación debe ser un valor válido y no negativo");
        return;
      }

      // Si la bonificación fue editada manualmente (diferente a la calculada), exigir concepto
      const bonifCalc = parseFloat(previewData.resumen.bonificacionCalculada || "0");
      if (Math.abs(bonificacionNumero - bonifCalc) > 0.01 && !conceptoBonificacion.trim()) {
        toast.warning("Debe proporcionar un concepto/justificación al editar la bonificación manualmente");
        return;
      }
    }

    setLoading(true);
    try {
      const body: any = {
        trabajadorId: trabajadorNomina,
        fechaInicio: fechaInicioNomina,
        fechaFin: fechaFinNomina,
      };

      // Para trabajadores FIJOS, incluir bonificación
      if (previewData && previewData.trabajador.tipoTrabajador === "FIJO") {
        body.bonificacion = parseFloat(bonificacionEditable);
        body.bonificacionCalculada = parseFloat(previewData.resumen.bonificacionCalculada || "0");
        body.conceptoBonificacion = conceptoBonificacion.trim() || null;
      }

      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Nómina generada exitosamente");
        setTrabajadorNomina("");
        setShowPreviewNomina(false);
        setPreviewData(null);
        setBonificacionEditable("");
        setConceptoBonificacion("");
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al generar nómina");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al generar nómina");
    } finally {
      setLoading(false);
    }
  };

  const verPreviewNomina = async () => {
    if (!trabajadorNomina || !fechaInicioNomina || !fechaFinNomina) {
      toast.warning("Por favor seleccione un trabajador y las fechas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pagos/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabajadorId: trabajadorNomina,
          fechaInicio: fechaInicioNomina,
          fechaFin: fechaFinNomina,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setBonificacionEditable(data.resumen.bonificacionCalculada || "0");
        setConceptoBonificacion("");
        setShowPreviewNomina(true);
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al obtener vista previa");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al obtener vista previa");
    } finally {
      setLoading(false);
    }
  };

  const editarTransaccion = async () => {
    if (!transaccionEditar) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/transacciones/${transaccionEditar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: transaccionEditar.monto,
          concepto: transaccionEditar.concepto,
          observaciones: transaccionEditar.observaciones,
        }),
      });

      if (res.ok) {
        toast.success("Transacción actualizada exitosamente");
        setShowEditarTransaccion(false);
        setTransaccionEditar(null);
        cargarDatos();
        if (showPreviewNomina) {
          verPreviewNomina(); // Actualizar preview si está abierto
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al editar transacción");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al editar transacción");
    } finally {
      setLoading(false);
    }
  };

  const eliminarTransaccion = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta transacción?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/transacciones/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Transacción eliminada exitosamente");
        cargarDatos();
        if (showPreviewNomina) {
          verPreviewNomina(); // Actualizar preview si está abierto
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al eliminar transacción");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar transacción");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalJustificacion = (asistencia: any) => {
    if (!previewData) return;

    // Calcular descuento automático
    const trabajador = previewData.trabajador;
    const horasProgramadas = trabajador.jornada.horasDiariasBase;
    const tarifa = new Decimal(trabajador.jornada.tarifaPorHora);
    const horasFaltantes = horasProgramadas - asistencia.horasTrabajadas;
    const descuentoAutomatico = tarifa.mul(horasFaltantes);

    setAsistenciaJustificar(asistencia);
    setJustificacionForm({
      montoDescuentoFinal: descuentoAutomatico.toFixed(2),
      motivoJustificacion: asistencia.motivoJustificacion || "",
    });
    setShowModalJustificacion(true);
  };

  const guardarJustificacion = async () => {
    if (!asistenciaJustificar || !previewData) return;

    const motivoTrim = justificacionForm.motivoJustificacion.trim();
    if (!motivoTrim) {
      toast.warning("Debe proporcionar un motivo de justificación");
      return;
    }

    const descuentoFinal = parseFloat(justificacionForm.montoDescuentoFinal);
    if (isNaN(descuentoFinal) || descuentoFinal < 0) {
      toast.warning("El monto de descuento debe ser válido y no negativo");
      return;
    }

    // Calcular descuento automático
    const trabajador = previewData.trabajador;
    const horasProgramadas = trabajador.jornada.horasDiariasBase;
    const tarifa = new Decimal(trabajador.jornada.tarifaPorHora);
    const horasFaltantes = horasProgramadas - asistenciaJustificar.horasTrabajadas;
    const descuentoAutomatico = tarifa.mul(horasFaltantes).toNumber();

    // Calcular ajuste (cuánto recuperamos)
    const ajuste = descuentoAutomatico - descuentoFinal;

    setLoading(true);
    try {
      const res = await fetch("/api/asistencias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asistenciaId: asistenciaJustificar.id,
          motivoJustificacion: motivoTrim,
          montoAjustePorJustificacion: ajuste,
        }),
      });

      if (res.ok) {
        toast.success("Justificación guardada exitosamente");
        setShowModalJustificacion(false);
        setAsistenciaJustificar(null);
        setJustificacionForm({ montoDescuentoFinal: "", motivoJustificacion: "" });
        // Recargar preview
        await verPreviewNomina();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al guardar justificación");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar justificación");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalAbono = (pago: Pago) => {
    setPagoSeleccionado(pago);
    setNuevoAbono({
      monto: pago.saldoPendiente,
      metodoPago: "Efectivo",
      numeroReferencia: "",
      observaciones: "",
    });
    setShowModalAbono(true);
  };

  const registrarAbono = async () => {
    if (!pagoSeleccionado || !nuevoAbono.monto || !nuevoAbono.metodoPago) {
      toast.warning("Por favor complete todos los campos requeridos");
      return;
    }

    const monto = parseFloat(nuevoAbono.monto);
    const saldoPendiente = parseFloat(pagoSeleccionado.saldoPendiente);

    if (monto <= 0) {
      toast.warning("El monto debe ser mayor a 0");
      return;
    }

    if (monto > saldoPendiente) {
      toast.warning("El monto del abono no puede exceder el saldo pendiente");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/abonos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagoId: pagoSeleccionado.id,
          ...nuevoAbono,
        }),
      });

      if (res.ok) {
        toast.success("Abono registrado exitosamente");
        setShowModalAbono(false);
        setPagoSeleccionado(null);
        setNuevoAbono({
          monto: "",
          metodoPago: "Efectivo",
          numeroReferencia: "",
          observaciones: "",
        });
        cargarDatos();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al registrar abono");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al registrar abono");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Módulo Financiero</h1>
            <p className="text-muted-foreground">Gestión de adelantos, multas y nómina</p>
          </div>
          <Button onClick={() => setShowNuevaTransaccion(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Adelantos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(
                  transacciones
                    .filter((t) => t.tipo === "ADELANTO" && !t.descontado)
                    .reduce((sum, t) => sum + parseFloat(t.monto), 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Multas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  transacciones
                    .filter((t) => t.tipo === "MULTA" && !t.descontado)
                    .reduce((sum, t) => sum + parseFloat(t.monto), 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {pagos.filter((p) => !p.pagado).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generar Nómina</CardTitle>
            <CardDescription>Calcular y generar pago para un período específico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Trabajador</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={trabajadorNomina}
                  onChange={(e) => setTrabajadorNomina(e.target.value)}
                >
                  <option value="">Seleccione un trabajador</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombres} {t.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicioNomina}
                  onChange={(e) => setFechaInicioNomina(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={fechaFinNomina}
                  onChange={(e) => setFechaFinNomina(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={verPreviewNomina} disabled={loading} variant="outline">
                Ver Vista Previa
              </Button>
              <Button onClick={generarNomina} disabled={loading}>
                <DollarSign className="mr-2 h-4 w-4" />
                Generar Nómina
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>{transacciones.length} transacción(es)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] space-y-3 overflow-y-auto">
                {transacciones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay transacciones registradas
                  </p>
                ) : (
                  transacciones.slice(0, 20).map((trans) => (
                    <div key={trans.id} className="flex items-start justify-between rounded-lg border p-3">
                      <div className="flex gap-3">
                        {trans.tipo === "ADELANTO" ? (
                          <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
                        ) : trans.tipo === "MULTA" ? (
                          <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">
                            {trans.trabajador.nombres} {trans.trabajador.apellidos}
                          </p>
                          <p className="text-sm text-muted-foreground">{trans.concepto}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(trans.fecha))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(trans.monto)}</p>
                        {trans.descontado && (
                          <p className="text-xs text-green-600">Descontado</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagos Generados</CardTitle>
              <CardDescription>{pagos.length} pago(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] space-y-3 overflow-y-auto">
                {pagos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay pagos generados
                  </p>
                ) : (
                  pagos.map((pago) => (
                    <div key={pago.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {pago.trabajador.nombres} {pago.trabajador.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(pago.fechaInicio))} -{" "}
                            {formatDate(new Date(pago.fechaFin))}
                          </p>
                        </div>
                        {pago.pagado ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Pagado
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Pendiente
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Base: </span>
                          <span>{formatCurrency(pago.montoBase)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Adelantos: </span>
                          <span className="text-orange-600">-{formatCurrency(pago.adelantos)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Multas: </span>
                          <span className="text-red-600">-{formatCurrency(pago.adelantos)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Neto: </span>
                          <span className="font-bold">{formatCurrency(pago.totalNeto)}</span>
                        </div>
                        <div className="col-span-2 border-t pt-2 mt-1">
                          <span className="text-muted-foreground">Pagado: </span>
                          <span className="text-green-600 font-medium">{formatCurrency(pago.montoPagado)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Saldo: </span>
                          <span className="text-orange-600 font-medium">{formatCurrency(pago.saldoPendiente)}</span>
                        </div>
                      </div>
                      {pago.abonos && pago.abonos.length > 0 && (
                        <div className="text-xs border-t pt-2">
                          <p className="font-medium mb-1">Abonos registrados:</p>
                          <div className="space-y-1">
                            {pago.abonos.map((abono) => (
                              <div key={abono.id} className="flex justify-between text-muted-foreground">
                                <span>{formatDate(new Date(abono.fecha))} - {abono.metodoPago}</span>
                                <span>{formatCurrency(abono.monto)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {!pago.pagado && (
                        <Button
                          size="sm"
                          onClick={() => abrirModalAbono(pago)}
                          disabled={loading}
                          className="w-full mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Registrar Pago
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal Nueva Transacción */}
        {showNuevaTransaccion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Nueva Transacción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Trabajador</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={nuevaTransaccion.trabajadorId}
                    onChange={(e) =>
                      setNuevaTransaccion({ ...nuevaTransaccion, trabajadorId: e.target.value })
                    }
                  >
                    <option value="">Seleccione un trabajador</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombres} {t.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={nuevaTransaccion.tipo}
                    onChange={(e) =>
                      setNuevaTransaccion({ ...nuevaTransaccion, tipo: e.target.value })
                    }
                  >
                    <option value="ADELANTO">Adelanto</option>
                    <option value="MULTA">Multa</option>
                    <option value="AJUSTE">Ajuste</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={nuevaTransaccion.monto}
                    onChange={(e) =>
                      setNuevaTransaccion({ ...nuevaTransaccion, monto: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Input
                    value={nuevaTransaccion.concepto}
                    onChange={(e) =>
                      setNuevaTransaccion({ ...nuevaTransaccion, concepto: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    value={nuevaTransaccion.observaciones}
                    onChange={(e) =>
                      setNuevaTransaccion({ ...nuevaTransaccion, observaciones: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={crearTransaccion} disabled={loading} className="flex-1">
                    Registrar
                  </Button>
                  <Button
                    onClick={() => setShowNuevaTransaccion(false)}
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

        {/* Modal Registrar Pago */}
        {showModalAbono && pagoSeleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Registrar Pago</CardTitle>
                <CardDescription>
                  {pagoSeleccionado.trabajador.nombres} {pagoSeleccionado.trabajador.apellidos}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total neto:</span>
                    <span className="font-medium">{formatCurrency(pagoSeleccionado.totalNeto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagado:</span>
                    <span className="text-green-600">{formatCurrency(pagoSeleccionado.montoPagado)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Saldo pendiente:</span>
                    <span className="font-bold text-orange-600">{formatCurrency(pagoSeleccionado.saldoPendiente)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Monto del abono</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={nuevoAbono.monto}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, monto: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={nuevoAbono.metodoPago}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, metodoPago: e.target.value })}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Número de referencia (opcional)</Label>
                  <Input
                    value={nuevoAbono.numeroReferencia}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, numeroReferencia: e.target.value })}
                    placeholder="Ej: número de cheque, referencia de transferencia"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observaciones (opcional)</Label>
                  <Textarea
                    value={nuevoAbono.observaciones}
                    onChange={(e) => setNuevoAbono({ ...nuevoAbono, observaciones: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={registrarAbono} disabled={loading} className="flex-1">
                    Registrar Pago
                  </Button>
                  <Button
                    onClick={() => {
                      setShowModalAbono(false);
                      setPagoSeleccionado(null);
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

        {/* Modal Vista Previa Nómina */}
        {showPreviewNomina && previewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
            <Card className="w-full max-w-5xl max-h-[95vh] flex flex-col">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl">Vista Previa de Nómina</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      {previewData.trabajador.nombres} {previewData.trabajador.apellidos} - DNI: {previewData.trabajador.dni}
                      {previewData.trabajador.tipoTrabajador && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          previewData.trabajador.tipoTrabajador === "FIJO" 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        }`}>
                          {previewData.trabajador.tipoTrabajador}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowPreviewNomina(false);
                      setPreviewData(null);
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6">
                {/* Información del período */}
                <div className="rounded-lg border bg-muted/50 p-3">
                  <h3 className="font-medium text-sm mb-2">Período</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>Inicio: {formatDate(new Date(previewData.periodo.fechaInicio))}</div>
                    <div>Fin: {formatDate(new Date(previewData.periodo.fechaFin))}</div>
                    <div>Días del período: {previewData.periodo.diasPeriodo}</div>
                    <div>Días trabajados: {previewData.periodo.diasTrabajados}</div>
                  </div>
                </div>

                {/* Resumen financiero - TRABAJADOR FIJO */}
                {previewData.trabajador.tipoTrabajador === "FIJO" && (
                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm mb-3">Resumen Financiero - Trabajador FIJO</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {/* Salario base */}
                      <div className="flex justify-between bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                        <span className="font-medium">Salario base periodo:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(previewData.resumen.salarioBasePeriodo)}</span>
                      </div>

                      {/* Desglose de horas */}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Horas trabajadas (desglose):</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDetalleAsistencias(true)}
                            className="h-7 text-xs"
                          >
                            VER DETALLE
                          </Button>
                        </div>
                        <div className="ml-4 space-y-1 mt-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horas normales ({previewData.resumen.horasNormales} hrs):</span>
                            <span>{formatCurrency(previewData.resumen.montoHorasNormales)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horas suplementarias ({previewData.resumen.horasSuplementarias} hrs):</span>
                            <span>{formatCurrency(previewData.resumen.montoHorasSuplementarias)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horas extra ({previewData.resumen.horasExtra} hrs):</span>
                            <span>{formatCurrency(previewData.resumen.montoHorasExtra)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-medium">
                            <span>Sueldo trabajado:</span>
                            <span className="text-green-600">{formatCurrency(previewData.resumen.sueldoTrabajado)}</span>
                          </div>
                          {/* Ajustes por justificaciones */}
                          {previewData.resumen.totalAjustesPorJustificaciones && 
                           parseFloat(previewData.resumen.totalAjustesPorJustificaciones) > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-600">Ajustes por justificaciones:</span>
                              <span className="text-blue-600 font-medium">+{formatCurrency(previewData.resumen.totalAjustesPorJustificaciones)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Multas manuales (transacciones tipo MULTA) */}
                      {parseFloat(previewData.resumen.multasTransacciones || "0") > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Multas aplicadas:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">-{formatCurrency(previewData.resumen.multasTransacciones)}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowDetalleMultas(true)}
                            >
                              VER
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Bonificación editable */}
                      <div className="border-t pt-2 mt-2 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Bonificación:</span>
                          <span className="text-xs text-muted-foreground">
                            (Calculada: {formatCurrency(previewData.resumen.bonificacionCalculada)})
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={bonificacionEditable}
                            onChange={(e) => setBonificacionEditable(e.target.value)}
                            placeholder="0.00"
                            className="text-right"
                          />
                          <Textarea
                            value={conceptoBonificacion}
                            onChange={(e) => setConceptoBonificacion(e.target.value)}
                            placeholder="Concepto/justificación de bonificación (opcional)"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Adelantos */}
                      {parseFloat(previewData.resumen.adelantos) > 0 && (
                        <div className="flex justify-between">
                          <span>Adelantos:</span>
                          <span className="text-orange-600">-{formatCurrency(previewData.resumen.adelantos)}</span>
                        </div>
                      )}

                      {/* Ajustes */}
                      {parseFloat(previewData.resumen.ajustes) !== 0 && (
                        <div className="flex justify-between">
                          <span>Ajustes:</span>
                          <span className={parseFloat(previewData.resumen.ajustes) >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(previewData.resumen.ajustes)}
                          </span>
                        </div>
                      )}

                      {/* Total neto calculado dinámicamente */}
                      <div className="flex justify-between border-t-2 pt-2">
                        <span className="font-bold text-lg">Total Neto:</span>
                        <span className="font-bold text-lg text-blue-600">
                          {formatCurrency(
                            parseFloat(previewData.resumen.salarioBasePeriodo || "0") -
                            parseFloat(previewData.resumen.adelantos || "0") -
                            parseFloat(previewData.resumen.multasTransacciones || "0") +
                            parseFloat(previewData.resumen.ajustes || "0")
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Salario base garantizado menos descuentos externos
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumen financiero - TRABAJADOR EVENTUAL */}
                {previewData.trabajador.tipoTrabajador === "EVENTUAL" && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-3">Resumen Financiero - Trabajador EVENTUAL</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Horas trabajadas:</span>
                        <span className="font-medium">{previewData.resumen.totalHoras} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Producción total:</span>
                        <span className="font-medium">{previewData.resumen.totalProduccion}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Monto base:</span>
                        <span className="font-bold text-green-600">{formatCurrency(previewData.resumen.montoBase)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adelantos:</span>
                        <span className="text-orange-600">-{formatCurrency(previewData.resumen.adelantos)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Multas aplicadas:</span>
                        <span className="text-red-600">-{formatCurrency(previewData.resumen.multasTransacciones || "0")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ajustes:</span>
                        <span className={parseFloat(previewData.resumen.ajustes) >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(previewData.resumen.ajustes)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t-2 pt-2">
                        <span className="font-bold text-lg">Total Neto:</span>
                        <span className="font-bold text-lg text-blue-600">{formatCurrency(previewData.resumen.totalNeto)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transacciones */}
                {previewData.transacciones && previewData.transacciones.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-3">Transacciones del Período</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {previewData.transacciones.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t.concepto}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.tipo} - {formatDate(new Date(t.fecha))}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              t.tipo === "ADELANTO" ? "text-orange-600" : 
                              t.tipo === "MULTA" ? "text-red-600" : "text-blue-600"
                            }`}>
                              {formatCurrency(t.monto)}
                            </span>
                            {!t.descontado && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setTransaccionEditar(t);
                                    setShowEditarTransaccion(true);
                                  }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => eliminarTransaccion(t.id)}
                                  className="text-red-600"
                                >
                                  Eliminar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewData.pagoExistente && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3">
                    <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-200">
                      ⚠️ Ya existe una nómina generada para este período
                    </p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex-shrink-0 gap-2 border-t pt-4 px-4 sm:px-6">
                <Button
                  onClick={generarNomina}
                  disabled={loading || previewData.pagoExistente}
                  className="flex-1"
                  size="sm"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Confirmar y </span>Generar Nómina
                </Button>
                <Button
                  onClick={() => {
                    setShowPreviewNomina(false);
                    setPreviewData(null);
                    setBonificacionEditable("");
                    setConceptoBonificacion("");
                  }}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Cancelar
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Modal Editar Transacción */}
        {showEditarTransaccion && transaccionEditar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Editar Transacción</CardTitle>
                <CardDescription>{transaccionEditar.tipo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={transaccionEditar.monto}
                    onChange={(e) => setTransaccionEditar({ ...transaccionEditar, monto: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Input
                    value={transaccionEditar.concepto}
                    onChange={(e) => setTransaccionEditar({ ...transaccionEditar, concepto: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observaciones / Justificación</Label>
                  <Textarea
                    value={transaccionEditar.observaciones || ""}
                    onChange={(e) => setTransaccionEditar({ ...transaccionEditar, observaciones: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={editarTransaccion} disabled={loading} className="flex-1">
                    Guardar Cambios
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEditarTransaccion(false);
                      setTransaccionEditar(null);
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

        {/* Modal Detalle Asistencias */}
        {showDetalleAsistencias && previewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Detalle de Asistencias</CardTitle>
                  <CardDescription>
                    {previewData.trabajador.tipoTrabajador === "FIJO" 
                      ? "Desglose diario con descuentos por atrasos/inasistencias"
                      : "Desglose diario de horas trabajadas"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetalleAsistencias(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <div className="space-y-2">
                  {previewData.asistencias && previewData.asistencias.length > 0 ? (
                    previewData.asistencias.map((asist: any) => {
                      // Calcular descuento automático solo para trabajadores FIJOS
                      const trabajador = previewData.trabajador;
                      let descuentoAutomatico = 0;
                      let tieneDescuento = false;
                      
                      if (trabajador.tipoTrabajador === "FIJO" && asist.horasTrabajadas) {
                        const horasProgramadas = trabajador.jornada.horasDiariasBase;
                        const tarifa = new Decimal(trabajador.jornada.tarifaPorHora);
                        const horasFaltantes = horasProgramadas - asist.horasTrabajadas;
                        if (horasFaltantes > 0) {
                          descuentoAutomatico = tarifa.mul(horasFaltantes).toNumber();
                          tieneDescuento = true;
                        }
                      }

                      return (
                        <div key={asist.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{formatDate(new Date(asist.fecha))}</p>
                              <p className="text-xs text-muted-foreground">
                                {asist.horaEntrada ? new Date(asist.horaEntrada).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '-'} - 
                                {asist.horaSalida ? new Date(asist.horaSalida).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              asist.estado === "PRESENTE" ? "bg-green-100 text-green-800" :
                              asist.estado === "TARDE" ? "bg-yellow-100 text-yellow-800" :
                              asist.estado === "FALTA" ? "bg-red-100 text-red-800" : "bg-gray-100"
                            }`}>
                              {asist.estado}
                            </span>
                          </div>
                          
                          {/* Para trabajador EVENTUAL - mostrar horas desglosadas */}
                          {trabajador.tipoTrabajador === "EVENTUAL" && asist.horasTrabajadas && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Total: </span>
                                <span className="font-medium">{Number(asist.horasTrabajadas).toFixed(2)} hrs</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Normales: </span>
                                <span>{Number(asist.horasNormales || 0).toFixed(2)} hrs</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Suplementarias: </span>
                                <span>{Number(asist.horasSuplementarias || 0).toFixed(2)} hrs</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Extra: </span>
                                <span>{Number(asist.horasExtra || 0).toFixed(2)} hrs</span>
                              </div>
                              <div className="col-span-2 border-t pt-2 mt-1">
                                <span className="text-muted-foreground">Monto día: </span>
                                <span className="font-bold text-green-600">{formatCurrency(asist.montoCalculado || 0)}</span>
                              </div>
                            </div>
                          )}

                          {/* Para trabajador FIJO - mostrar horas trabajadas y descuentos */}
                          {trabajador.tipoTrabajador === "FIJO" && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Horas trabajadas: </span>
                                  <span className="font-medium">{Number(asist.horasTrabajadas || 0).toFixed(2)} hrs</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Monto base: </span>
                                  <span className="font-medium text-green-600">{formatCurrency(asist.montoCalculado || 0)}</span>
                                </div>
                              </div>

                              {/* Mostrar descuento si existe */}
                              {tieneDescuento && (
                                <div className="bg-red-50 border border-red-200 rounded p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-red-800">
                                      {asist.estado === "FALTA" ? "⚠️ INASISTENCIA" : "⏰ ATRASO"}
                                    </span>
                                    {!asist.justificada && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs"
                                        onClick={() => abrirModalJustificacion(asist)}
                                      >
                                        Justificar
                                      </Button>
                                    )}
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Descuento automático:</span>
                                      <span className="font-medium text-red-600">-{formatCurrency(descuentoAutomatico)}</span>
                                    </div>
                                    {asist.justificada && asist.montoAjustePorJustificacion && (
                                      <>
                                        <div className="flex justify-between text-green-700">
                                          <span>Monto recuperado:</span>
                                          <span className="font-medium">+{formatCurrency(asist.montoAjustePorJustificacion)}</span>
                                        </div>
                                        <div className="border-t border-red-300 pt-1 mt-1">
                                          <div className="flex justify-between font-medium">
                                            <span>Descuento aplicado:</span>
                                            <span className="text-red-700">-{formatCurrency(descuentoAutomatico - Number(asist.montoAjustePorJustificacion))}</span>
                                          </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded p-1 mt-1">
                                          <p className="text-[10px] text-blue-800">
                                            <strong>Motivo:</strong> {asist.motivoJustificacion}
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Monto total del día */}
                              <div className="border-t pt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Monto total día:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(
                                      Number(asist.montoCalculado || 0) + 
                                      Number(asist.montoAjustePorJustificacion || 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {asist.observaciones && (
                            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                              {asist.observaciones}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay asistencias registradas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Justificar Asistencia */}
        {showModalJustificacion && asistenciaJustificar && previewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Justificar Atraso/Inasistencia</CardTitle>
                <CardDescription>
                  {formatDate(new Date(asistenciaJustificar.fecha))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información de la asistencia */}
                <div className="bg-gray-50 border rounded p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas trabajadas:</span>
                    <span className="font-medium">{Number(asistenciaJustificar.horasTrabajadas || 0).toFixed(2)} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto ganado:</span>
                    <span className="font-medium text-green-600">{formatCurrency(asistenciaJustificar.montoCalculado || 0)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descuento automático:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(
                          new Decimal(previewData.trabajador.jornada.tarifaPorHora)
                            .mul(previewData.trabajador.jornada.horasDiariasBase - asistenciaJustificar.horasTrabajadas)
                            .toNumber()
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input monto descuento final */}
                <div>
                  <Label htmlFor="montoDescuentoFinal">Monto de descuento a aplicar ($)</Label>
                  <Input
                    id="montoDescuentoFinal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={justificacionForm.montoDescuentoFinal}
                    onChange={(e) =>
                      setJustificacionForm({
                        ...justificacionForm,
                        montoDescuentoFinal: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Edite este valor para perdonar parcial o totalmente el descuento
                  </p>
                </div>

                {/* Preview del cálculo */}
                {justificacionForm.montoDescuentoFinal && !isNaN(parseFloat(justificacionForm.montoDescuentoFinal)) && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Descuento automático:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          new Decimal(previewData.trabajador.jornada.tarifaPorHora)
                            .mul(previewData.trabajador.jornada.horasDiariasBase - asistenciaJustificar.horasTrabajadas)
                            .toNumber()
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Descuento aplicado:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(parseFloat(justificacionForm.montoDescuentoFinal))}
                      </span>
                    </div>
                    <div className="border-t border-blue-300 pt-1 flex justify-between">
                      <span className="font-bold">Monto recuperado:</span>
                      <span className="font-bold text-green-600">
                        +{formatCurrency(
                          new Decimal(previewData.trabajador.jornada.tarifaPorHora)
                            .mul(previewData.trabajador.jornada.horasDiariasBase - asistenciaJustificar.horasTrabajadas)
                            .sub(parseFloat(justificacionForm.montoDescuentoFinal))
                            .toNumber()
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Motivo justificación */}
                <div>
                  <Label htmlFor="motivoJustificacion">Motivo de justificación *</Label>
                  <textarea
                    id="motivoJustificacion"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={justificacionForm.motivoJustificacion}
                    onChange={(e) =>
                      setJustificacionForm({
                        ...justificacionForm,
                        motivoJustificacion: e.target.value,
                      })
                    }
                    placeholder="Ej: Cita médica, emergencia familiar, etc."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModalJustificacion(false);
                    setAsistenciaJustificar(null);
                    setJustificacionForm({ montoDescuentoFinal: "", motivoJustificacion: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={guardarJustificacion} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Justificación"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Modal Detalle Multas */}
        {showDetalleMultas && previewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Detalle de Multas</CardTitle>
                  <CardDescription>Multas por retardos y faltas del período</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetalleMultas(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <div className="space-y-2">
                  {previewData.transacciones && previewData.transacciones.filter((t: any) => t.tipo === "MULTA").length > 0 ? (
                    previewData.transacciones
                      .filter((t: any) => t.tipo === "MULTA")
                      .map((multa: any) => (
                        <div key={multa.id} className="border rounded-lg p-3 bg-red-50 dark:bg-red-950/20">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-red-800 dark:text-red-200">{multa.concepto}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(new Date(multa.fecha))}
                              </p>
                              {multa.observaciones && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  {multa.observaciones}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-red-600">{formatCurrency(multa.monto)}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setTransaccionEditar(multa);
                                  setShowEditarTransaccion(true);
                                  setShowDetalleMultas(false);
                                }}
                                className="mt-1 text-xs"
                              >
                                Editar/Justificar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay multas en este período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
