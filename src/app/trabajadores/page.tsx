"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit, Trash2 } from "lucide-react";

interface Trabajador {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  usuario: {
    email: string;
  };
}

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
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
  });

  useEffect(() => {
    const cargarTrabajadores = async () => {
      try {
        const res = await fetch(`/api/trabajadores?includeInactive=${showInactive}`);
        const data = await res.json();
        setTrabajadores(data);
      } catch (error) {
        console.error("Error al cargar trabajadores:", error);
      }
    };
    
    cargarTrabajadores();
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
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                            DNI: {trabajador.dni}
                          </p>
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
                        DNI <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dni"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        maxLength={8}
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
                  </div>

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
