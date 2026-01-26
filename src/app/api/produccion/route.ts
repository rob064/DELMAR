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

    // Obtener la actividad para calcular el monto
    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!actividad) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    let montoGenerado = new Decimal(0);

    if (actividad.tipoPago === "POR_HORA" && horasTrabajadas && actividad.valor) {
      montoGenerado = new Decimal(horasTrabajadas).mul(actividad.valor);
    } else if (actividad.tipoPago === "POR_PRODUCCION" && cantidadProducida && actividad.valor) {
      montoGenerado = new Decimal(cantidadProducida).mul(actividad.valor);
    }

    const produccion = await prisma.produccionDiaria.create({
      data: {
        trabajadorId,
        actividadId,
        fecha: fecha ? new Date(fecha) : new Date(),
        horasTrabajadas: horasTrabajadas ? new Decimal(horasTrabajadas) : null,
        cantidadProducida: cantidadProducida ? new Decimal(cantidadProducida) : null,
        montoGenerado,
        horaInicio: horaInicio ? new Date(horaInicio) : null,
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
  } catch (error) {
    console.error("Error al registrar producción:", error);
    return NextResponse.json(
      { error: "Error al registrar producción" },
      { status: 500 }
    );
  }
}
