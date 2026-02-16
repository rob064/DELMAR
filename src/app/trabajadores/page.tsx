"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit, Trash2 } from "lucide-react";
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
      alert("La cédula ingresada no es válida. Debe ser una cédula ecuatoriana de 10 dígitos.");
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
        alert(editingId ? "Trabajador actualizado exitosamente" : "Trabajador creado exitosamente");
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
        alert(error.error || `Error al ${editingId ? "actualizar" : "crear"} trabajador`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`Error al ${editingId ? "actualizar" : "crear"} trabajador`);
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
        alert("Trabajador desactivado exitosamente");
        recargarTrabajadores();
      } else {
        const error = await res.json();
        alert(error.error || "Error al desactivar trabajador");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al desactivar trabajador");
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
        alert("Trabajador reactivado exitosamente");
        recargarTrabajadores();
      } else {
        const error = await res.json();
        alert(error.error || "Error al reactivar trabajador");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al reactivar trabajador");
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
            <h1 className="text-3xl font-bold">Gestión de Trabajadores</h1>
            <p className="text-muted-foreground">
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
            <Button onClick={() => setShowModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Trabajador
            </Button>
          </div>
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
                      className="border rounded-lg p-4 space-y-3 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {trabajador.nombres} {trabajador.apellidos}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Cédula: {trabajador.dni}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            trabajador.tipoTrabajador === "FIJO"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}>
                            {trabajador.tipoTrabajador === "FIJO" ? "FIJO" : "EVENTUAL"}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            trabajador.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trabajador.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Email:</span>{" "}
                          {trabajador.usuario.email}
                        </p>
                        {trabajador.jornada && (
                          <p>
                            <span className="font-medium">Jornada:</span>{" "}
                            {trabajador.jornada.nombre} ({trabajador.jornada.horaInicio} - {trabajador.jornada.horaFin})
                          </p>
                        )}
                        {trabajador.telefono && (
                          <p>
                            <span className="font-medium">Teléfono:</span>{" "}
                            {trabajador.telefono}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        {trabajador.activo ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(trabajador)}
                              className="flex-1"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(trabajador.id, `${trabajador.nombres} ${trabajador.apellidos}`)}
                              className="flex-1"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Desactivar
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleReactivate(trabajador.id, `${trabajador.nombres} ${trabajador.apellidos}`)}
                            className="w-full"
                          >
                            <UserPlus className="mr-1 h-3 w-3" />
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
              <CardHeader>
                <CardTitle>{editingId ? "Editar Trabajador" : "Nuevo Trabajador"}</CardTitle>
                <CardDescription>
                  {editingId 
                    ? "Actualiza los datos del trabajador" 
                    : "Completa el formulario para registrar un nuevo trabajador"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Datos Personales */}
                    <div className="space-y-2">
                      <Label htmlFor="nombres">
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
                      <Label htmlFor="apellidos">
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
                      <Label htmlFor="dni">
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
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Cuenta de Usuario */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
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
                      <Label htmlFor="password">
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
                      <Label htmlFor="tipoTrabajador">
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
                        <option value="EVENTUAL">EVENTUAL (Producción)</option>
                        <option value="FIJO">FIJO (Jornada)</option>
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
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading 
                        ? (editingId ? "Actualizando..." : "Creando...") 
                        : (editingId ? "Actualizar Trabajador" : "Crear Trabajador")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCloseModal}
                      variant="outline"
                      className="flex-1"
                    >
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
