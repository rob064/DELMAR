"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Actividad = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipoPago: string;
  valor: number;
  unidadMedida: string | null;
  activo: boolean;
};

type Jornada = {
  id: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  diasSemana: number[];
  fechaInicio: string | null;
  fechaFin: string | null;
  esExcepcion: boolean;
  activo: boolean;
};

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  role: string;
  activo: boolean;
  createdAt: string;
};

const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export default function SuperusuarioPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para modal de actividad
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [actividadForm, setActividadForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tipoPago: "POR_HORA",
    valor: "",
    unidadMedida: "",
  });

  // Estados para modal de jornada
  const [showJornadaModal, setShowJornadaModal] = useState(false);
  const [editingJornada, setEditingJornada] = useState<Jornada | null>(null);
  const [jornadaForm, setJornadaForm] = useState({
    nombre: "",
    horaInicio: "",
    horaFin: "",
    diasSemana: [] as number[],
    fechaInicio: "",
    fechaFin: "",
    esExcepcion: false,
  });

  // Estados para modal de usuario
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [usuarioForm, setUsuarioForm] = useState({
    email: "",
    password: "",
    nombre: "",
    role: "TRABAJADOR",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [actRes, jorRes, usuRes] = await Promise.all([
        fetch("/api/actividades?incluirInactivos=true"),
        fetch("/api/jornadas"),
        fetch("/api/usuarios"),
      ]);
      
      const actividadesData = await actRes.json();
      const jornadasData = await jorRes.json();
      const usuariosData = await usuRes.json();
      
      setActividades(Array.isArray(actividadesData) ? actividadesData : []);
      setJornadas(Array.isArray(jornadasData) ? jornadasData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setActividades([]);
      setJornadas([]);
      setUsuarios([]);
    }
  };

  // Funciones para Actividades
  const abrirModalActividad = (actividad?: Actividad) => {
    if (actividad) {
      setEditingActividad(actividad);
      setActividadForm({
        codigo: actividad.codigo,
        nombre: actividad.nombre,
        descripcion: actividad.descripcion || "",
        tipoPago: actividad.tipoPago,
        valor: actividad.valor.toString(),
        unidadMedida: actividad.unidadMedida || "",
      });
    } else {
      setEditingActividad(null);
      setActividadForm({
        codigo: "",
        nombre: "",
        descripcion: "",
        tipoPago: "POR_HORA",
        valor: "",
        unidadMedida: "",
      });
    }
    setShowActividadModal(true);
  };

  const guardarActividad = async () => {
    if (!actividadForm.codigo || !actividadForm.nombre || !actividadForm.valor) {
      alert("Complete los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const url = editingActividad
        ? `/api/actividades/${editingActividad.id}`
        : "/api/actividades";
      
      const method = editingActividad ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...actividadForm,
          valor: parseFloat(actividadForm.valor),
        }),
      });

      if (res.ok) {
        alert(`Actividad ${editingActividad ? "actualizada" : "creada"} exitosamente`);
        setShowActividadModal(false);
        cargarDatos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al guardar actividad");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar actividad");
    } finally {
      setLoading(false);
    }
  };

  const eliminarActividad = async (id: string) => {
    if (!confirm("¿Está seguro de desactivar esta actividad?")) return;

    try {
      const res = await fetch(`/api/actividades/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Actividad desactivada exitosamente");
        cargarDatos();
      } else {
        alert("Error al desactivar actividad");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al desactivar actividad");
    }
  };

  // Funciones para Jornadas
  const abrirModalJornada = (jornada?: Jornada) => {
    if (jornada) {
      setEditingJornada(jornada);
      setJornadaForm({
        nombre: jornada.nombre,
        horaInicio: jornada.horaInicio,
        horaFin: jornada.horaFin,
        diasSemana: jornada.diasSemana,
        fechaInicio: jornada.fechaInicio ? jornada.fechaInicio.split('T')[0] : "",
        fechaFin: jornada.fechaFin ? jornada.fechaFin.split('T')[0] : "",
        esExcepcion: jornada.esExcepcion,
      });
    } else {
      setEditingJornada(null);
      setJornadaForm({
        nombre: "",
        horaInicio: "",
        horaFin: "",
        diasSemana: [],
        fechaInicio: "",
        fechaFin: "",
        esExcepcion: false,
      });
    }
    setShowJornadaModal(true);
  };

  const toggleDiaSemana = (dia: number) => {
    setJornadaForm(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia].sort(),
    }));
  };

  const aplicarTodosDias = () => {
    setJornadaForm(prev => ({
      ...prev,
      diasSemana: [0, 1, 2, 3, 4, 5, 6],
    }));
  };

  const guardarJornada = async () => {
    if (!jornadaForm.nombre || !jornadaForm.horaInicio || !jornadaForm.horaFin) {
      alert("Complete los campos requeridos");
      return;
    }

    if (!jornadaForm.esExcepcion && jornadaForm.diasSemana.length === 0) {
      alert("Seleccione al menos un día de la semana o marque como excepción");
      return;
    }

    setLoading(true);
    try {
      const url = editingJornada
        ? `/api/jornadas/${editingJornada.id}`
        : "/api/jornadas";
      
      const method = editingJornada ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jornadaForm),
      });

      if (res.ok) {
        alert(`Jornada ${editingJornada ? "actualizada" : "creada"} exitosamente`);
        setShowJornadaModal(false);
        cargarDatos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al guardar jornada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar jornada");
    } finally {
      setLoading(false);
    }
  };

  const eliminarJornada = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta jornada?")) return;

    try {
      const res = await fetch(`/api/jornadas/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Jornada eliminada exitosamente");
        cargarDatos();
      } else {
        alert("Error al eliminar jornada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar jornada");
    }
  };

  // Funciones para Usuarios
  const abrirModalUsuario = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setUsuarioForm({
        email: usuario.email,
        password: "",
        nombre: usuario.nombre,
        role: usuario.role,
      });
    } else {
      setEditingUsuario(null);
      setUsuarioForm({
        email: "",
        password: "",
        nombre: "",
        role: "TRABAJADOR",
      });
    }
    setShowUsuarioModal(true);
  };

  const guardarUsuario = async () => {
    if (!usuarioForm.email || !usuarioForm.nombre || !usuarioForm.role) {
      alert("Complete los campos requeridos");
      return;
    }

    if (!editingUsuario && !usuarioForm.password) {
      alert("La contraseña es requerida para nuevos usuarios");
      return;
    }

    setLoading(true);
    try {
      const url = editingUsuario
        ? `/api/usuarios/${editingUsuario.id}`
        : "/api/usuarios";
      
      const method = editingUsuario ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuarioForm),
      });

      if (res.ok) {
        alert(`Usuario ${editingUsuario ? "actualizado" : "creado"} exitosamente`);
        setShowUsuarioModal(false);
        cargarDatos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al guardar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar usuario");
    } finally {
      setLoading(false);
    }
  };

  const toggleUsuario = async (id: string, activo: boolean) => {
    if (!confirm(`¿Está seguro de ${activo ? "desactivar" : "activar"} este usuario?`)) return;

    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: activo ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activo }),
      });

      if (res.ok) {
        alert(`Usuario ${activo ? "desactivado" : "activado"} exitosamente`);
        cargarDatos();
      } else {
        const error = await res.json();
        alert(error.error || "Error al cambiar estado del usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar estado del usuario");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
          <p className="text-muted-foreground">Gestión de actividades, jornadas y usuarios del sistema</p>
        </div>

        {/* Sección de Actividades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Actividades de Producción</CardTitle>
                <CardDescription>Gestionar actividades y sus tarifas</CardDescription>
              </div>
              <Button onClick={() => abrirModalActividad()}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Actividad
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actividades.map((actividad) => (
                <div
                  key={actividad.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-primary">{actividad.codigo}</span>
                      <span className="font-medium">{actividad.nombre}</span>
                      <span className="text-sm text-muted-foreground">
                        ({actividad.tipoPago === "POR_HORA" ? "Por Hora" : actividad.tipoPago === "POR_PRODUCCION" ? "Por Producción" : "Por Jornada"})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(actividad.valor)}
                      {actividad.unidadMedida && ` / ${actividad.unidadMedida}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirModalActividad(actividad)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarActividad(actividad.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sección de Jornadas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Jornadas Laborales</CardTitle>
                <CardDescription>Configurar horarios de trabajo</CardDescription>
              </div>
              <Button onClick={() => abrirModalJornada()}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Jornada
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jornadas.map((jornada) => (
                <div
                  key={jornada.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{jornada.nombre}</span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {jornada.horaInicio} - {jornada.horaFin}
                      </span>
                      {jornada.esExcepcion && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                          Excepción
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {jornada.esExcepcion
                        ? `Fechas: ${jornada.fechaInicio} ${jornada.fechaFin ? `- ${jornada.fechaFin}` : ""}`
                        : jornada.diasSemana.length === 7
                        ? "Todos los días"
                        : jornada.diasSemana.map(d => DIAS_SEMANA.find(dia => dia.value === d)?.label).join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirModalJornada(jornada)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarJornada(jornada.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sección de Usuarios */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuarios del Sistema</CardTitle>
                <CardDescription>Gestionar usuarios y sus permisos</CardDescription>
              </div>
              <Button onClick={() => abrirModalUsuario()}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className={`flex items-center justify-between border rounded-lg p-4 ${
                    !usuario.activo ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{usuario.nombre}</span>
                      <span className="text-sm text-muted-foreground">{usuario.email}</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {usuario.role}
                      </span>
                      {!usuario.activo && (
                        <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Creado: {new Date(usuario.createdAt).toLocaleDateString('es-EC')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirModalUsuario(usuario)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleUsuario(usuario.id, usuario.activo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Actividad */}
        {showActividadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingActividad ? "Editar Actividad" : "Nueva Actividad"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowActividadModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código/Siglas *</Label>
                  <Input
                    id="codigo"
                    value={actividadForm.codigo}
                    onChange={(e) =>
                      setActividadForm({ ...actividadForm, codigo: e.target.value.toUpperCase() })
                    }
                    placeholder="BA, CM, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={actividadForm.nombre}
                    onChange={(e) =>
                      setActividadForm({ ...actividadForm, nombre: e.target.value })
                    }
                    placeholder="Nombre de la actividad"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={actividadForm.descripcion}
                    onChange={(e) =>
                      setActividadForm({ ...actividadForm, descripcion: e.target.value })
                    }
                    placeholder="Descripción opcional"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoPago">Tipo de Pago *</Label>
                  <select
                    id="tipoPago"
                    value={actividadForm.tipoPago}
                    onChange={(e) =>
                      setActividadForm({ ...actividadForm, tipoPago: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 bg-background"
                  >
                    <option value="POR_HORA">Por Hora</option>
                    <option value="POR_PRODUCCION">Por Producción</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor por Unidad ($) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={actividadForm.valor}
                    onChange={(e) =>
                      setActividadForm({ ...actividadForm, valor: e.target.value })
                    }
                    placeholder="2.00"
                  />
                </div>

                {actividadForm.tipoPago === "POR_PRODUCCION" && (
                  <div className="space-y-2">
                    <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                    <Input
                      id="unidadMedida"
                      value={actividadForm.unidadMedida}
                      onChange={(e) =>
                        setActividadForm({ ...actividadForm, unidadMedida: e.target.value })
                      }
                      placeholder="kg, unidades, cajas"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={guardarActividad}
                    disabled={loading}
                    className="flex-1"
                  >
                    {editingActividad ? "Actualizar" : "Crear"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowActividadModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Jornada */}
        {showJornadaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingJornada ? "Editar Jornada" : "Nueva Jornada"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowJornadaModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreJornada">Nombre *</Label>
                  <Input
                    id="nombreJornada"
                    value={jornadaForm.nombre}
                    onChange={(e) =>
                      setJornadaForm({ ...jornadaForm, nombre: e.target.value })
                    }
                    placeholder="Turno Mañana"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora Inicio *</Label>
                    <Input
                      id="horaInicio"
                      type="time"
                      value={jornadaForm.horaInicio}
                      onChange={(e) =>
                        setJornadaForm({ ...jornadaForm, horaInicio: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horaFin">Hora Fin *</Label>
                    <Input
                      id="horaFin"
                      type="time"
                      value={jornadaForm.horaFin}
                      onChange={(e) =>
                        setJornadaForm({ ...jornadaForm, horaFin: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="esExcepcion"
                      checked={jornadaForm.esExcepcion}
                      onChange={(e) =>
                        setJornadaForm({ ...jornadaForm, esExcepcion: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="esExcepcion">Jornada Excepcional (fecha específica)</Label>
                  </div>
                </div>

                {!jornadaForm.esExcepcion ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Días de la Semana *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={aplicarTodosDias}
                      >
                        Todos
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {DIAS_SEMANA.map((dia) => (
                        <div key={dia.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`dia-${dia.value}`}
                            checked={jornadaForm.diasSemana.includes(dia.value)}
                            onChange={() => toggleDiaSemana(dia.value)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`dia-${dia.value}`}>{dia.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Fechas de Excepción *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fechaInicio">Desde</Label>
                        <Input
                          id="fechaInicio"
                          type="date"
                          value={jornadaForm.fechaInicio}
                          onChange={(e) =>
                            setJornadaForm({ ...jornadaForm, fechaInicio: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fechaFin">Hasta (opcional)</Label>
                        <Input
                          id="fechaFin"
                          type="date"
                          value={jornadaForm.fechaFin}
                          onChange={(e) =>
                            setJornadaForm({ ...jornadaForm, fechaFin: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Si solo es un día, deje "Hasta" vacío
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={guardarJornada}
                    disabled={loading}
                    className="flex-1"
                  >
                    {editingJornada ? "Actualizar" : "Crear"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowJornadaModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Usuario */}
        {showUsuarioModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowUsuarioModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={usuarioForm.email}
                    onChange={(e) =>
                      setUsuarioForm({ ...usuarioForm, email: e.target.value })
                    }
                    placeholder="usuario@delmar.com"
                    disabled={!!editingUsuario}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreUsuario">Nombre Completo *</Label>
                  <Input
                    id="nombreUsuario"
                    value={usuarioForm.nombre}
                    onChange={(e) =>
                      setUsuarioForm({ ...usuarioForm, nombre: e.target.value })
                    }
                    placeholder="Nombre del usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Contraseña {editingUsuario ? "(dejar vacío para mantener)" : "*"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={usuarioForm.password}
                    onChange={(e) =>
                      setUsuarioForm({ ...usuarioForm, password: e.target.value })
                    }
                    placeholder={editingUsuario ? "••••••••" : "Contraseña"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleUsuario">Rol *</Label>
                  <select
                    id="roleUsuario"
                    value={usuarioForm.role}
                    onChange={(e) =>
                      setUsuarioForm({ ...usuarioForm, role: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 bg-background"
                  >
                    <option value="TRABAJADOR">Trabajador</option>
                    <option value="PUERTA">Control de Puerta</option>
                    <option value="PRODUCCION">Producción</option>
                    <option value="FINANZAS">Finanzas</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={guardarUsuario}
                    disabled={loading}
                    className="flex-1"
                  >
                    {editingUsuario ? "Actualizar" : "Crear"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowUsuarioModal(false)}
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
