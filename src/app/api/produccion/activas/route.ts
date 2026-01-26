import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener actividades activas (sin hora fin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trabajadorId = searchParams.get("trabajadorId");
    const fecha = searchParams.get("fecha");

    if (!trabajadorId) {
      return NextResponse.json(
        { error: "trabajadorId es requerido" },
        { status: 400 }
      );
    }

    const fechaFiltro = fecha ? new Date(fecha) : new Date();
    fechaFiltro.setHours(0, 0, 0, 0);

    const actividadesActivas = await prisma.produccionDiaria.findMany({
      where: {
        trabajadorId,
        fecha: fechaFiltro,
        actividad: {
          tipoPago: "POR_HORA",
        },
        horaFin: null,
      },
      include: {
        actividad: {
          select: {
            nombre: true,
            tipoPago: true,
            valor: true,
          },
        },
      },
      orderBy: {
        horaInicio: "asc",
      },
    });

    return NextResponse.json(actividadesActivas);
  } catch (error) {
    console.error("Error al obtener actividades activas:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al obtener actividades activas: ${mensaje}` },
      { status: 500 }
    );
  }
}
