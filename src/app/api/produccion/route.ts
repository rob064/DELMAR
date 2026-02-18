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
      // Normalizar fecha correctamente para búsqueda
      const [year, month, day] = fecha.includes('-') 
        ? fecha.split('-').map(Number) 
        : fecha.split('/').reverse().map(Number);
      where.fecha = new Date(year, month - 1, day, 0, 0, 0, 0);
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

    // Normalizar fecha correctamente en zona horaria local (Ecuador)
    let fechaProduccion: Date;
    if (fecha) {
      // Construir fecha desde string YYYY-MM-DD o DD/MM/YYYY
      const [year, month, day] = fecha.includes('-') 
        ? fecha.split('-').map(Number) 
        : fecha.split('/').reverse().map(Number);
      fechaProduccion = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      fechaProduccion = new Date();
      fechaProduccion.setHours(0, 0, 0, 0);
    }

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

    // Verificar que el trabajador tenga asistencia registrada ese día
    const asistencia = await prisma.asistencia.findUnique({
      where: {
        trabajadorId_fecha: {
          trabajadorId,
          fecha: fechaProduccion,
        },
      },
    });

    if (!asistencia || !asistencia.horaEntrada) {
      return NextResponse.json(
        { error: "El trabajador no tiene hora de entrada registrada para esta fecha. Debe registrar la asistencia primero en el módulo PUERTA." },
        { status: 400 }
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

      // 2. Determinar y validar hora de inicio
      let horaInicioFinal: Date;

      if (horaInicio) {
        horaInicioFinal = new Date(horaInicio);
      } else {
        // Por defecto usar hora de entrada de asistencia
        horaInicioFinal = asistencia.horaEntrada;
      }

      // 3. Validar que hora de inicio esté dentro del rango de asistencia
      // Normalizar fechas a minutos para comparación
      const horaEntrada = new Date(asistencia.horaEntrada);
      horaEntrada.setSeconds(0, 0);
      
      let horaInicioNormalizada = new Date(horaInicioFinal);
      horaInicioNormalizada.setSeconds(0, 0);

      // La hora de inicio NO puede ser anterior a la hora de entrada
      if (horaInicioNormalizada < horaEntrada) {
        return NextResponse.json(
          { 
            error: `La hora de inicio (${horaInicioNormalizada.toTimeString().slice(0, 5)}) no puede ser anterior a la hora de entrada registrada (${horaEntrada.toTimeString().slice(0, 5)})` 
          },
          { status: 400 }
        );
      }

      // Si hay hora de salida registrada, validar que inicio no sea posterior
      if (asistencia.horaSalida) {
        const horaSalida = new Date(asistencia.horaSalida);
        horaSalida.setSeconds(0, 0);
        
        if (horaInicioNormalizada > horaSalida) {
          return NextResponse.json(
            { 
              error: `La hora de inicio (${horaInicioNormalizada.toTimeString().slice(0, 5)}) no puede ser posterior a la hora de salida registrada (${horaSalida.toTimeString().slice(0, 5)})` 
            },
            { status: 400 }
          );
        }
      }

      // 4. Si se proporciona hora fin, validar duración
      if (horaFin) {
        const horaFinDate = new Date(horaFin);
        const horaFinNormalizada = new Date(horaFinDate);
        horaFinNormalizada.setSeconds(0, 0);
        
        // Validar que hora fin sea posterior a hora inicio
        if (horaFinNormalizada <= horaInicioNormalizada) {
          return NextResponse.json(
            { error: "La hora de finalización debe ser posterior a la hora de inicio" },
            { status: 400 }
          );
        }

        // Validar que no dure más de 24 horas (probable error)
        const diffMs = horaFinNormalizada.getTime() - horaInicioNormalizada.getTime();
        const horasTrabajadas = diffMs / (1000 * 60 * 60);
        if (horasTrabajadas > 24) {
          return NextResponse.json(
            { error: "La actividad no puede durar más de 24 horas. Verifica las horas ingresadas." },
            { status: 400 }
          );
        }
      }

      // 5. Calcular horas trabajadas y monto si tiene hora fin
      let horasTrabajadas = null;
      let montoGenerado = new Decimal(0);
      
      if (horaFin) {
        const horaFinDate = new Date(horaFin);
        const diffMs = horaFinDate.getTime() - horaInicioFinal.getTime();
        horasTrabajadas = new Decimal(diffMs / (1000 * 60 * 60)); // Convertir a horas
        
        if (actividad.valor) {
          montoGenerado = horasTrabajadas.mul(actividad.valor);
        }
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
