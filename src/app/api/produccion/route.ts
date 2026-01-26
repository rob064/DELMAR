import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// GET - Obtener producción (con filtros)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get("fecha");
    const trabajadorId = searchParams.get("trabajadorId");
    const actividadId = searchParams.get("actividadId");

    const where: any = {};

    if (fecha) {
      where.fecha = new Date(fecha);
    }

    if (trabajadorId) {
      where.trabajadorId = trabajadorId;
    }

    if (actividadId) {
      where.actividadId = actividadId;
    }

    const produccion = await prisma.produccionDiaria.findMany({
      where,
      include: {
        trabajador: {
          select: {
            nombres: true,
            apellidos: true,
            dni: true,
          },
        },
        actividad: {
          select: {
            nombre: true,
            tipoPago: true,
            unidadMedida: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(produccion);
  } catch (error) {
    console.error("Error al obtener producción:", error);
    return NextResponse.json(
      { error: "Error al obtener producción" },
      { status: 500 }
    );
  }
}

// POST - Registrar producción diaria
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      trabajadorId,
      actividadId,
      fecha,
      horasTrabajadas,
      cantidadProducida,
      horaInicio,
      horaFin,
      observaciones,
    } = body;

    const fechaProduccion = fecha ? new Date(fecha) : new Date();
    fechaProduccion.setHours(0, 0, 0, 0);

    // Obtener la actividad para calcular el monto y validar tipo
    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!actividad) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    // VALIDACIONES SEGÚN TIPO DE ACTIVIDAD

    if (actividad.tipoPago === "POR_HORA") {
      // 1. Verificar que no haya otra actividad por horas activa (sin horaFin)
      const actividadActiva = await prisma.produccionDiaria.findFirst({
        where: {
          trabajadorId,
          fecha: fechaProduccion,
          actividad: {
            tipoPago: "POR_HORA",
          },
          horaFin: null,
        },
        include: {
          actividad: true,
        },
      });

      if (actividadActiva) {
        return NextResponse.json(
          { 
            error: `Ya existe una actividad por horas activa: ${actividadActiva.actividad.nombre}. Debe cerrarla antes de iniciar otra.` 
          },
          { status: 400 }
        );
      }

      // 2. Determinar hora de inicio
      let horaInicioFinal: Date | null = null;

      if (horaInicio) {
        horaInicioFinal = new Date(horaInicio);
      } else {
        // Verificar si hay producción previa ese día
        const produccionPrevia = await prisma.produccionDiaria.findFirst({
          where: {
            trabajadorId,
            fecha: fechaProduccion,
          },
        });

        if (!produccionPrevia) {
          // No hay producción previa, usar hora de entrada de asistencia
          const asistencia = await prisma.asistencia.findUnique({
            where: {
              trabajadorId_fecha: {
                trabajadorId,
                fecha: fechaProduccion,
              },
            },
          });

          if (asistencia?.horaEntrada) {
            horaInicioFinal = asistencia.horaEntrada;
          } else {
            return NextResponse.json(
              { error: "No se encontró hora de entrada para este día. Por favor registre la asistencia primero." },
              { status: 400 }
            );
          }
        } else {
          // Hay producción previa, debe especificar hora de inicio
          return NextResponse.json(
            { error: "Ya existen actividades registradas hoy. Debe especificar la hora de inicio de esta actividad." },
            { status: 400 }
          );
        }
      }

      if (!horaInicioFinal) {
        return NextResponse.json(
          { error: "Debe especificar una hora de inicio para actividades por horas" },
          { status: 400 }
        );
      }

      // Validar que no se solape con otras actividades por horas del mismo día
      if (horaFin) {
        const horaFinDate = new Date(horaFin);
        const solapamiento = await prisma.produccionDiaria.findFirst({
          where: {
            trabajadorId,
            fecha: fechaProduccion,
            actividad: {
              tipoPago: "POR_HORA",
            },
            OR: [
              {
                AND: [
                  { horaInicio: { lte: horaInicioFinal } },
                  { horaFin: { gte: horaInicioFinal } },
                ],
              },
              {
                AND: [
                  { horaInicio: { lte: horaFinDate } },
                  { horaFin: { gte: horaFinDate } },
                ],
              },
              {
                AND: [
                  { horaInicio: { gte: horaInicioFinal } },
                  { horaFin: { lte: horaFinDate } },
                ],
              },
            ],
          },
          include: {
            actividad: true,
          },
        });

        if (solapamiento) {
          return NextResponse.json(
            { error: `Esta actividad se solapa con: ${solapamiento.actividad.nombre}` },
            { status: 400 }
          );
        }
      }

      // Calcular horas trabajadas si tiene hora fin
      let horasTrabajadas = null;
      if (horaFin) {
        const horaFinDate = new Date(horaFin);
        const diffMs = horaFinDate.getTime() - horaInicioFinal.getTime();
        horasTrabajadas = new Decimal(diffMs / (1000 * 60 * 60)); // Convertir a horas
      }

      let montoGenerado = new Decimal(0);
      if (horasTrabajadas && actividad.valor) {
        montoGenerado = horasTrabajadas.mul(actividad.valor);
      }

      const produccion = await prisma.produccionDiaria.create({
        data: {
          trabajadorId,
          actividadId,
          fecha: fechaProduccion,
          horasTrabajadas,
          cantidadProducida: null,
          montoGenerado,
          horaInicio: horaInicioFinal,
          horaFin: horaFin ? new Date(horaFin) : null,
          observaciones,
          registradoPor: session.user.id,
        },
        include: {
          trabajador: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          actividad: {
            select: {
              nombre: true,
              tipoPago: true,
            },
          },
        },
      });

      return NextResponse.json(produccion);

    } else if (actividad.tipoPago === "POR_PRODUCCION") {
      // Verificar que NO haya actividad por horas activa
      const actividadHorasActiva = await prisma.produccionDiaria.findFirst({
        where: {
          trabajadorId,
          fecha: fechaProduccion,
          actividad: {
            tipoPago: "POR_HORA",
          },
          horaFin: null,
        },
        include: {
          actividad: true,
        },
      });

      if (actividadHorasActiva) {
        return NextResponse.json(
          { 
            error: `Hay una actividad por horas activa: ${actividadHorasActiva.actividad.nombre}. Debe cerrarla antes de registrar producción.` 
          },
          { status: 400 }
        );
      }

      if (!cantidadProducida) {
        return NextResponse.json(
          { error: "Debe especificar la cantidad producida" },
          { status: 400 }
        );
      }

      let montoGenerado = new Decimal(0);
      if (cantidadProducida && actividad.valor) {
        montoGenerado = new Decimal(cantidadProducida).mul(actividad.valor);
      }

      const produccion = await prisma.produccionDiaria.create({
        data: {
          trabajadorId,
          actividadId,
          fecha: fechaProduccion,
          horasTrabajadas: null,
          cantidadProducida: new Decimal(cantidadProducida),
          montoGenerado,
          horaInicio: null,
          horaFin: null,
          observaciones,
          registradoPor: session.user.id,
        },
        include: {
          trabajador: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          actividad: {
            select: {
              nombre: true,
              tipoPago: true,
            },
          },
        },
      });

      return NextResponse.json(produccion);
    }

    return NextResponse.json(
      { error: "Tipo de actividad no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error al registrar producción:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al registrar producción: ${mensaje}` },
      { status: 500 }
    );
  }
}
