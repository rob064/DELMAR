import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener una jornada específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const jornada = await prisma.jornada.findUnique({
      where: { id: params.id },
    });

    if (!jornada) {
      return NextResponse.json({ error: "Jornada no encontrada" }, { status: 404 });
    }

    return NextResponse.json(jornada);
  } catch (error) {
    console.error("Error al obtener jornada:", error);
    return NextResponse.json(
      { error: "Error al obtener jornada" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar jornada
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, horaInicio, horaFin, diasSemana, fechaInicio, fechaFin, esExcepcion, activo } = body;

    const jornada = await prisma.jornada.update({
      where: { id: params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(horaInicio !== undefined && { horaInicio }),
        ...(horaFin !== undefined && { horaFin }),
        ...(diasSemana !== undefined && { diasSemana }),
        ...(fechaInicio !== undefined && { fechaInicio: fechaInicio ? new Date(fechaInicio) : null }),
        ...(fechaFin !== undefined && { fechaFin: fechaFin ? new Date(fechaFin) : null }),
        ...(esExcepcion !== undefined && { esExcepcion }),
        ...(activo !== undefined && { activo }),
      },
    });

    return NextResponse.json(jornada);
  } catch (error) {
    console.error("Error al actualizar jornada:", error);
    return NextResponse.json(
      { error: "Error al actualizar jornada" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar jornada
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.jornada.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar jornada:", error);
    return NextResponse.json(
      { error: "Error al eliminar jornada" },
      { status: 500 }
    );
  }
}
