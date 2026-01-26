import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener todas las actividades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const incluirInactivos = searchParams.get("incluirInactivos") === "true";

    const actividades = await prisma.actividad.findMany({
      where: incluirInactivos ? {} : { activo: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    return NextResponse.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva actividad
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "PRODUCCION"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      codigo,
      nombre,
      descripcion,
      tipoPago,
      valor,
      unidadMedida,
    } = body;

    const actividad = await prisma.actividad.create({
      data: {
        codigo,
        nombre,
        descripcion,
        tipoPago,
        valor,
        unidadMedida: unidadMedida || null,
      },
    });

    return NextResponse.json(actividad);
  } catch (error) {
    console.error("Error al crear actividad:", error);
    return NextResponse.json(
      { error: "Error al crear actividad" },
      { status: 500 }
    );
  }
}
