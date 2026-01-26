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
  horarioEntrada: string;
  horarioSalida: string;
  salarioPorHora: string;
  activo: boolean;
  usuario: {
    email: string;
  };
}

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
    cargarTrabajadores();
  }, []);

  const cargarTrabajadores = async () => {
    try {
      const res = await fetch("/api/trabajadores");
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
      const res = await fetch("/api/trabajadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Trabajador creado exitosamente");
        setShowModal(false);
        setFormData({
          email: "",
          password: "",
          nombres: "",
          apellidos: "",
          dni: "",
          telefono: "",
          direccion: "",
        });
        cargarTrabajadores();
      } else {
        const error = await res.json();
        alert(error.error || "Error al crear trabajador");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear trabajador");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Trabajadores</h1>
            <p className="text-muted-foreground">
              Administra el personal de la empresa
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Trabajador
          </Button>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal Nuevo Trabajador */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="w-full max-w-2xl my-8">
              <CardHeader>
                <CardTitle>Nuevo Trabajador</CardTitle>
                <CardDescription>
                  Completa el formulario para registrar un nuevo trabajador
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
                        Contraseña <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        required
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
                      {loading ? "Creando..." : "Crear Trabajador"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowModal(false)}
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
