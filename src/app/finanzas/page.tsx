"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, obtenerFechaSemana } from "@/lib/utils";
import { DollarSign, Plus, TrendingDown, TrendingUp } from "lucide-react";

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

      setTrabajadores(trabajadoresData);
      setTransacciones(transaccionesData);
      setPagos(pagosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const crearTransaccion = async () => {
    if (!nuevaTransaccion.trabajadorId || !nuevaTransaccion.monto || !nuevaTransaccion.concepto) {
      alert("Por favor complete todos los campos requeridos");
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
        alert("Transacción registrada exitosamente");
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
        alert(error.error || "Error al registrar transacción");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar transacción");
    } finally {
      setLoading(false);
    }
  };

  const generarNomina = async () => {
    if (!trabajadorNomina) {
      alert("Por favor seleccione un trabajador");
      return;
    }

    if (!fechaInicioNomina || !fechaFinNomina) {
      alert("Por favor seleccione las fechas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabajadorId: trabajadorNomina,
          fechaInicio: fechaInicioNomina,
          fechaFin: fechaFinNomina,
        }),
      });

      if (res.ok) {
        alert("Nómina generada exitosamente");
        setTrabajadorNomina("");
        cargarDatos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al generar nómina");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar nómina");
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
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    const monto = parseFloat(nuevoAbono.monto);
    const saldoPendiente = parseFloat(pagoSeleccionado.saldoPendiente);

    if (monto <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    if (monto > saldoPendiente) {
      alert("El monto del abono no puede exceder el saldo pendiente");
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
        alert("Abono registrado exitosamente");
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
        alert(error.error || "Error al registrar abono");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar abono");
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
            <div className="flex justify-end">
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
                          <span className="text-red-600">-{formatCurrency(pago.multas)}</span>
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
                          Registrar Abono
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

        {/* Modal Registrar Abono */}
        {showModalAbono && pagoSeleccionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Registrar Abono</CardTitle>
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
                    Registrar Abono
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
      </div>
    </div>
  );
}
