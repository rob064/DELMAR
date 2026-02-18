"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit, Trash2, Users, UserCheck, UserX, Briefcase, Mail, Phone, MapPin, Clock, CheckCircle2, X, AlertCircle, IdCard } from "lucide-react";
import { validarCedulaEcuatoriana } from "@/lib/validaciones";

interface Trabajador {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string; // Cédula ecuatoriana
  telefono?: string;
  direccion?: string;
  activo: boolean;
  tipoTrabajador: string;
  jornadaId?: string;
  jornada?: {
    id: string;
    nombre: string;
    horaInicio: string;
    horaFin: string;
  };
  salarioBasePersonalizado?: number;
  usuario: {
    email: string;
  };
}

interface Jornada {
  id: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  salarioBaseMensual: number;
  activo: boolean;
}

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombres: "",
    apellidos: "",
    dni: "",
    telefono: "",
    direccion: "",
    tipoTrabajador: "EVENTUAL",
    jornadaId: "",
    salarioBasePersonalizado: "",
    tarifaPorHoraPersonalizada: "",
    multiplicadorSuplPersonalizado: "",
    multiplicadorExtraPersonalizado: "",
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [trabajadoresRes, jornadasRes] = await Promise.all([
          fetch(`/api/trabajadores?includeInactive=${showInactive}`),
          fetch('/api/jornadas')
        ]);
        const trabajadoresData = await trabajadoresRes.json();
        const jornadasData = await jornadasRes.json();
        setTrabajadores(trabajadoresData);
        setJornadas(jornadasData.filter((j: Jornada) => j.activo));
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    
    cargarDatos();
  }, [showInactive]);

  const recargarTrabajadores = async () => {
    try {
      const res = await fetch(`/api/trabajadores?includeInactive=${showInactive}`);
      const data = await res.json();
      setTrabajadores(data);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar cédula ecuatoriana
    if (!validarCedulaEcuatoriana(formData.dni)) {
      toast.error("Cédula inválida", {
        description: "Debe ingresar una cédula ecuatoriana válida de 10 dígitos."
      });
      return;
    }

    setLoading(true);

    try {
      const url = editingId ? `/api/trabajadores/${editingId}` : "/api/trabajadores";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? "Trabajador actualizado exitosamente" : "Trabajador creado exitosamente");
        setShowModal(false);
        setEditingId(null);
        setFormData({
          email: "",
          password: "",
          nombres: "",
          apellidos: "",
          dni: "",
          telefono: "",
          direccion: "",
          tipoTrabajador: "EVENTUAL",
          jornadaId: "",
          salarioBasePersonalizado: "",
          tarifaPorHoraPersonalizada: "",
          multiplicadorSuplPersonalizado: "",
          multiplicadorExtraPersonalizado: "",
        });
        recargarTrabajadores();
      } else {
        const error = await res.json();
        toast.error(`Error al ${editingId ? "actualizar" : "crear"} trabajador`, {
          description: error.error
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Error al ${editingId ? "actualizar" : "crear"} trabajador`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trabajador: Trabajador) => {
    setEditingId(trabajador.id);
    setFormData({
      email: trabajador.usuario.email,
      password: "", // No mostrar password actual
      nombres: trabajador.nombres,
      apellidos: trabajador.apellidos,
      dni: trabajador.dni,
      telefono: trabajador.telefono || "",
      direccion: trabajador.direccion || "",
      tipoTrabajador: trabajador.tipoTrabajador || "EVENTUAL",
      jornadaId: trabajador.jornadaId || "",
      salarioBasePersonalizado: trabajador.salarioBasePersonalizado?.toString() || "",
      tarifaPorHoraPersonalizada: "",
      multiplicadorSuplPersonalizado: "",
      multiplicadorExtraPersonalizado: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de desactivar a ${nombre}?`)) return;

    try {
      const res = await fetch(`/api/trabajadores/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Trabajador desactivado exitosamente");
        recargarTrabajadores();
      } else {
        const error = await res.json();
        toast.error("Error al desactivar trabajador", {
          description: error.error
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al desactivar trabajador");
    }
  };

  const handleReactivate = async (id: string, nombre: string) => {
    if (!confirm(`¿Desea reactivar a ${nombre}?`)) return;

    try {
      const res = await fetch(`/api/trabajadores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: true }),
      });

      if (res.ok) {
        toast.success("Trabajador reactivado exitosamente");
        recargarTrabajadores();
      } else {
        const error = await res.json();
        toast.error("Error al reactivar trabajador", {
          description: error.error
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al reactivar trabajador");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      email: "",
      password: "",
      nombres: "",
      apellidos: "",
      dni: "",
      telefono: "",
      direccion: "",
      tipoTrabajador: "EVENTUAL",
      jornadaId: "",
      salarioBasePersonalizado: "",
      tarifaPorHoraPersonalizada: "",
      multiplicadorSuplPersonalizado: "",
      multiplicadorExtraPersonalizado: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">
              Gestión de Trabajadores
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra el personal de la empresa
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Mostrar desactivados</span>
            </label>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Trabajador
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-primary bg-gradient-to-br from-primary/5 to-blue-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Trabajadores</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {trabajadores.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Personal registrado
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-success bg-gradient-to-br from-success/5 to-green-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                <div className="rounded-lg bg-success/10 p-2.5">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {trabajadores.filter(t => t.activo).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Trabajando actualmente
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-destructive bg-gradient-to-br from-destructive/5 to-red-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
                <div className="rounded-lg bg-destructive/10 p-2.5">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {trabajadores.filter(t => !t.activo).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Desactivados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-warning bg-gradient-to-br from-warning/5 to-orange-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Eventuales</CardTitle>
                <div className="rounded-lg bg-warning/10 p-2.5">
                  <Briefcase className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {trabajadores.filter(t => t.tipoTrabajador === "EVENTUAL").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vs. {trabajadores.filter(t => t.tipoTrabajador === "FIJO").length} fijos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Trabajadores</CardTitle>
            <CardDescription>
              {trabajadores.length} trabajador(es) registrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trabajadores.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay trabajadores registrados
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trabajadores.map((trabajador) => (
                    <div
                      key={trabajador.id}
                      className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow bg-card"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {trabajador.nombres} {trabajador.apellidos}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <IdCard className="h-3.5 w-3.5" />
                            {trabajador.dni}
                          </p>
                        </div>
                        {trabajador.activo ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success border border-success/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Activo
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive border border-destructive/20">
                            <X className="h-3 w-3" />
                            Inactivo
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${
                          trabajador.tipoTrabajador === "FIJO"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        }`}>
                          <Briefcase className="h-3 w-3" />
                          {trabajador.tipoTrabajador === "FIJO" ? "FIJO" : "EVENTUAL"}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm border-t pt-3">
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{trabajador.usuario.email}</span>
                        </p>
                        {trabajador.jornada && (
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{trabajador.jornada.nombre} ({trabajador.jornada.horaInicio} - {trabajador.jornada.horaFin})</span>
                          </p>
                        )}
                        {trabajador.telefono && (
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{trabajador.telefono}</span>
                          </p>
                        )}
                        {trabajador.direccion && (
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{trabajador.direccion}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        {trabajador.activo ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(trabajador)}
                              className="flex-1 gap-1.5"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(trabajador.id, `${trabajador.nombres} ${trabajador.apellidos}`)}
                              className="flex-1 gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Desactivar
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleReactivate(trabajador.id, `${trabajador.nombres} ${trabajador.apellidos}`)}
                            className="w-full gap-1.5"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal Nuevo/Editar Trabajador */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">
                      {editingId ? "Editar Trabajador" : "Nuevo Trabajador"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {editingId 
                        ? "Actualiza los datos del trabajador" 
                        : "Completa el formulario para registrar un nuevo trabajador"}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Datos Personales */}
                    <div className="space-y-2">
                      <Label htmlFor="nombres" className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Nombres <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nombres"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apellidos" className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Apellidos <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="apellidos"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dni" className="flex items-center gap-1.5">
                        <IdCard className="h-4 w-4" />
                        Cédula <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dni"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        maxLength={10}
                        placeholder="0123456789"
                        pattern="[0-9]{10}"
                        title="Debe ingresar una cédula ecuatoriana válida de 10 dígitos"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="0999999999"
                      />
                    </div>

                    {/* Cuenta de Usuario */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        Email (para login) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="trabajador@delmar.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Contraseña {editingId ? "(dejar vacío para no cambiar)" : <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={editingId ? "Dejar vacío para mantener" : "Mínimo 6 caracteres"}
                        minLength={6}
                        required={!editingId}
                      />
                    </div>

                    {/* Tipo de Trabajador */}
                    <div className="space-y-2">
                      <Label htmlFor="tipoTrabajador" className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        Tipo de Trabajador <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="tipoTrabajador"
                        name="tipoTrabajador"
                        value={formData.tipoTrabajador}
                        onChange={handleChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        required
                      >
                        <option value="EVENTUAL">💼 EVENTUAL (Producción)</option>
                        <option value="FIJO">🏢 FIJO (Jornada)</option>
                      </select>
                    </div>

                    {/* Jornada - solo para FIJOS */}
                    {formData.tipoTrabajador === "FIJO" && (
                      <div className="space-y-2">
                        <Label htmlFor="jornadaId">
                          Jornada <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="jornadaId"
                          name="jornadaId"
                          value={formData.jornadaId}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          required={formData.tipoTrabajador === "FIJO"}
                        >
                          <option value="">Seleccione una jornada</option>
                          {jornadas.map((jornada) => (
                            <option key={jornada.id} value={jornada.id}>
                              {jornada.nombre} ({jornada.horaInicio} - {jornada.horaFin})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Configuración Salarial Personalizada (opcional para FIJOS) */}
                  {formData.tipoTrabajador === "FIJO" && (
                    <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 dark:bg-blue-950/20">
                      <h3 className="font-semibold text-sm">Configuración Salarial Personalizada (Opcional)</h3>
                      <p className="text-xs text-muted-foreground">
                        Si no se especifica, se usarán los valores de la jornada seleccionada
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="salarioBasePersonalizado">Salario Base Mensual</Label>
                          <Input
                            id="salarioBasePersonalizado"
                            name="salarioBasePersonalizado"
                            type="number"
                            step="0.01"
                            value={formData.salarioBasePersonalizado}
                            onChange={handleChange}
                            placeholder="$433.33"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tarifaPorHoraPersonalizada">Tarifa por Hora</Label>
                          <Input
                            id="tarifaPorHoraPersonalizada"
                            name="tarifaPorHoraPersonalizada"
                            type="number"
                            step="0.0001"
                            value={formData.tarifaPorHoraPersonalizada}
                            onChange={handleChange}
                            placeholder="$2.71"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="multiplicadorSuplPersonalizado">Multiplicador H. Suplementarias</Label>
                          <Input
                            id="multiplicadorSuplPersonalizado"
                            name="multiplicadorSuplPersonalizado"
                            type="number"
                            step="0.01"
                            value={formData.multiplicadorSuplPersonalizado}
                            onChange={handleChange}
                            placeholder="1.75"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="multiplicadorExtraPersonalizado">Multiplicador H. Extra</Label>
                          <Input
                            id="multiplicadorExtraPersonalizado"
                            name="multiplicadorExtraPersonalizado"
                            type="number"
                            step="0.01"
                            value={formData.multiplicadorExtraPersonalizado}
                            onChange={handleChange}
                            placeholder="2.50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="direccion" className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button type="submit" disabled={loading} className="flex-1 gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {loading 
                        ? (editingId ? "Actualizando..." : "Creando...") 
                        : (editingId ? "Actualizar Trabajador" : "Crear Trabajador")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCloseModal}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
