import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularMinutosRetraso } from "@/lib/utils";

// Helper para calcular horas trabajadas de trabajadores FIJOS
function calcularHorasTrabajador(
  horaEntrada: Date,
  horaSalida: Date,
  horasDiariasBase: number,
  tarifaPorHora: number,
  multiplicadorSupl: number,
  multiplicadorExtra: number,
  esFindeSemana: boolean
) {
  // Calcular total de horas trabajadas
  const diffMs = horaSalida.getTime() - horaEntrada.getTime();
  const horasTrabajadas = diffMs / (1000 * 60 * 60);

  let horasNormales = 0;
  let horasSuplementarias = 0;
  let horasExtra = 0;

  if (horasTrabajadas <= horasDiariasBase) {
    // Trabajó dentro de la jornada
    horasNormales = horasTrabajadas;
  } else {
    // Trabajó más de la jornada base
    horasNormales = horasDiariasBase;
    const horasExcedentes = horasTrabajadas - horasDiariasBase;

    if (esFindeSemana) {
      // Fin de semana: excedente es hora extra
      horasExtra = horasExcedentes;
    } else {
      // Día laborable: excedente es hora suplementaria
      horasSuplementarias = horasExcedentes;
    }
  }

  // Calcular montos por tipo de hora
  const montoHorasNormales = horasNormales * tarifaPorHora;
  const montoHorasSuplementarias = horasSuplementarias * tarifaPorHora * multiplicadorSupl;
  const montoHorasExtra = horasExtra * tarifaPorHora * multiplicadorExtra;
  const montoCalculado = montoHorasNormales + montoHorasSuplementarias + montoHorasExtra;

  return {
    horasTrabajadas,
    horasNormales,
    horasSuplementarias,
    horasExtra,
    montoCalculado,
  };
}

// GET - Obtener asistencias (con filtros opcionales)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get("fecha");
    const trabajadorId = searchParams.get("trabajadorId");

    const where: any = {};

    if (fecha) {
      where.fecha = new Date(fecha);
    }

    if (trabajadorId) {
      where.trabajadorId = trabajadorId;
    }

    const asistencias = await prisma.asistencia.findMany({
      where,
      include: {
        trabajador: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            dni: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(asistencias);
  } catch (error) {
    console.error("Error al obtener asistencias:", error);
    return NextResponse.json(
      { error: "Error al obtener asistencias" },
      { status: 500 }
    );
  }
}

// POST - Registrar entrada o salida
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { trabajadorId, tipo, fecha, turnoProgramado, observaciones, horaPersonalizada } = body; // tipo: 'entrada' o 'salida', turnoProgramado: "08:00-16:00", horaPersonalizada: "14:30:00"

    const trabajador = await prisma.trabajador.findUnique({
      where: { id: trabajadorId },
    });

    if (!trabajador) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Usar la fecha proporcionada o la fecha actual
    let fechaAsistencia: Date;
    if (fecha) {
      // Construir fecha en zona horaria local (no UTC)
      const [year, month, day] = fecha.split('-').map(Number);
      fechaAsistencia = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      fechaAsistencia = new Date();
      fechaAsistencia.setHours(0, 0, 0, 0);
    }

    // Usar hora personalizada o la hora actual
    let ahora: Date;
    if (horaPersonalizada) {
      // Construir fecha con hora personalizada
      ahora = new Date(fechaAsistencia);
      const [hora, minuto, segundo] = horaPersonalizada.split(':').map(Number);
      ahora.setHours(hora, minuto, segundo || 0, 0);
    } else {
      ahora = new Date();
    }

    // Buscar si ya existe una asistencia para esta fecha
    let asistencia = await prisma.asistencia.findUnique({
      where: {
        trabajadorId_fecha: {
          trabajadorId,
          fecha: fechaAsistencia,
        },
      },
    });

    if (tipo === "entrada") {
      // Extraer hora de entrada del turno (ej: "08:00-16:00" -> "08:00")
      const horaEntradaTurno = turnoProgramado?.split("-")[0] || "08:00";
      
      // Registrar entrada
      const minutosRetraso = calcularMinutosRetraso(ahora, horaEntradaTurno);
      
      let estado: "PRESENTE" | "TARDE" = "PRESENTE";
      if (minutosRetraso > 0) {
        estado = "TARDE";
      }

      if (asistencia) {
        // Actualizar la entrada existente
        asistencia = await prisma.asistencia.update({
          where: { id: asistencia.id },
          data: {
            horaEntrada: ahora,
            turnoProgramado,
            estado,
            minutosRetraso,
            registradoPor: session.user.id,
            observaciones,
          },
        });
      } else {
        // Crear nueva asistencia
        asistencia = await prisma.asistencia.create({
          data: {
            trabajadorId,
            fecha: fechaAsistencia,
            horaEntrada: ahora,
            turnoProgramado,
            estado,
            minutosRetraso,
            registradoPor: session.user.id,
            observaciones,
          },
        });
      }
    } else if (tipo === "salida") {
      // Registrar salida
      if (!asistencia) {
        return NextResponse.json(
          { error: "No se ha registrado entrada para esta fecha" },
          { status: 400 }
        );
      }

      // Cerrar actividades por horas activas antes de registrar la salida
      const actividadesActivas = await prisma.produccionDiaria.findMany({
        where: {
          trabajadorId,
          fecha: fechaAsistencia,
          actividad: {
            tipoPago: "POR_HORA",
          },
          horaFin: null,
        },
        include: {
          actividad: true,
        },
      });

      // Cerrar cada actividad activa con la hora de salida
      for (const produccion of actividadesActivas) {
        if (produccion.horaInicio) {
          const diffMs = ahora.getTime() - produccion.horaInicio.getTime();
          const horasTrabajadas = diffMs / (1000 * 60 * 60);

          let montoGenerado = 0;
          if (produccion.actividad.valor) {
            montoGenerado = horasTrabajadas * Number(produccion.actividad.valor);
          }

          await prisma.produccionDiaria.update({
            where: { id: produccion.id },
            data: {
              horaFin: ahora,
              horasTrabajadas,
              montoGenerado,
            },
          });
        }
      }

      // Actualizar asistencia con hora de salida
      asistencia = await prisma.asistencia.update({
        where: { id: asistencia.id },
        data: {
          horaSalida: ahora,
          observaciones,
        },
      });

      // Si es trabajador FIJO, calcular campos automáticos
      const trabajador = await prisma.trabajador.findUnique({
        where: { id: trabajadorId },
        include: { jornada: true },
      });

      if (trabajador?.tipoTrabajador === "FIJO" && trabajador.jornada && asistencia.horaEntrada) {
        // Determinar si es fin de semana (0=domingo, 6=sábado)
        const diaSemana = fecha.getDay();
        const esFindeSemana = diaSemana === 0 || diaSemana === 6;

        // Obtener configuración salarial (personalizada o estándar)
        const tarifaPorHora = trabajador.tarifaPorHoraPersonalizada 
          ?? trabajador.jornada.tarifaPorHora;
        const multiplicadorSupl = trabajador.multiplicadorSuplPersonalizado 
          ?? trabajador.jornada.multiplicadorHorasSuplementarias;
        const multiplicadorExtra = trabajador.multiplicadorExtraPersonalizado 
          ?? trabajador.jornada.multiplicadorHorasExtra;
        const horasDiariasBase = trabajador.jornada.horasDiariasBase;

        // Calcular horas
        const calculo = calcularHorasTrabajador(
          asistencia.horaEntrada,
          ahora,
          Number(horasDiariasBase),
          Number(tarifaPorHora),
          Number(multiplicadorSupl),
          Number(multiplicadorExtra),
          esFindeSemana
        );

        // Actualizar campos calculados en la asistencia
        asistencia = await prisma.asistencia.update({
          where: { id: asistencia.id },
          data: {
            horasTrabajadas: calculo.horasTrabajadas,
            horasNormales: calculo.horasNormales,
            horasSuplementarias: calculo.horasSuplementarias,
            horasExtra: calculo.horasExtra,
            montoCalculado: calculo.montoCalculado,
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Tipo de registro inválido" },
        { status: 400 }
      );
    }

    // Incluir datos del trabajador en la respuesta
    const asistenciaCompleta = await prisma.asistencia.findUnique({
      where: { id: asistencia.id },
      include: {
        trabajador: {
          select: {
            nombres: true,
            apellidos: true,
            dni: true,
          },
        },
      },
    });

    return NextResponse.json(asistenciaCompleta);
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    return NextResponse.json(
      { error: "Error al registrar asistencia" },
      { status: 500 }
    );
  }
}

// PATCH - Justificar ausencia o tardanza
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { asistenciaId, justificada, motivoJustificacion } = body;

    const asistencia = await prisma.asistencia.update({
      where: { id: asistenciaId },
      data: {
        justificada,
        motivoJustificacion,
      },
      include: {
        trabajador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    return NextResponse.json(asistencia);
  } catch (error) {
    console.error("Error al justificar asistencia:", error);
    return NextResponse.json(
      { error: "Error al justificar asistencia" },
      { status: 500 }
    );
  }
}
