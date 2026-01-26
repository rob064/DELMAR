import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener todas las jornadas
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const jornadas = await prisma.jornada.findMany({
      orderBy: [
        { esExcepcion: "asc" },
        { nombre: "asc" },
      ],
    });

    return NextResponse.json(jornadas);
  } catch (error) {
    console.error("Error al obtener jornadas:", error);
    return NextResponse.json(
      { error: "Error al obtener jornadas" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva jornada
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, horaInicio, horaFin, diasSemana, fechaInicio, fechaFin, esExcepcion } = body;

    const jornada = await prisma.jornada.create({
      data: {
        nombre,
        horaInicio,
        horaFin,
        diasSemana: diasSemana || [],
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        esExcepcion: esExcepcion || false,
      },
    });

    return NextResponse.json(jornada);
  } catch (error) {
    console.error("Error al crear jornada:", error);
    return NextResponse.json(
      { error: "Error al crear jornada" },
      { status: 500 }
    );
  }
}
