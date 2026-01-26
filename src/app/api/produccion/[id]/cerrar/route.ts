import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// PATCH - Cerrar actividad por horas (marcar hora fin)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { horaFin } = body;

    // Buscar la producción
    const produccion = await prisma.produccionDiaria.findUnique({
      where: { id },
      include: {
        actividad: true,
      },
    });

    if (!produccion) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que sea actividad por horas
    if (produccion.actividad.tipoPago !== "POR_HORA") {
      return NextResponse.json(
        { error: "Solo se pueden cerrar actividades por horas" },
        { status: 400 }
      );
    }

    // Verificar que no esté ya cerrada
    if (produccion.horaFin) {
      return NextResponse.json(
        { error: "Esta actividad ya está cerrada" },
        { status: 400 }
      );
    }

    if (!produccion.horaInicio) {
      return NextResponse.json(
        { error: "Esta actividad no tiene hora de inicio" },
        { status: 400 }
      );
    }

    // Determinar hora fin (usar proporcionada o actual)
    const horaFinDate = horaFin ? new Date(horaFin) : new Date();

    // Validar que hora fin sea posterior a hora inicio
    if (horaFinDate <= produccion.horaInicio) {
      return NextResponse.json(
        { error: "La hora de fin debe ser posterior a la hora de inicio" },
        { status: 400 }
      );
    }

    // Calcular horas trabajadas
    const diffMs = horaFinDate.getTime() - produccion.horaInicio.getTime();
    const horasTrabajadas = new Decimal(diffMs / (1000 * 60 * 60));

    // Calcular monto generado
    let montoGenerado = new Decimal(0);
    if (produccion.actividad.valor) {
      montoGenerado = horasTrabajadas.mul(produccion.actividad.valor);
    }

    // Actualizar producción
    const produccionActualizada = await prisma.produccionDiaria.update({
      where: { id },
      data: {
        horaFin: horaFinDate,
        horasTrabajadas,
        montoGenerado,
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

    return NextResponse.json(produccionActualizada);
  } catch (error) {
    console.error("Error al cerrar actividad:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al cerrar actividad: ${mensaje}` },
      { status: 500 }
    );
  }
}
