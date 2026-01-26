import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener una actividad específica
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    const actividad = await prisma.actividad.findUnique({
      where: { id },
    });

    if (!actividad) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
    }

    return NextResponse.json(actividad);
  } catch (error) {
    console.error("Error al obtener actividad:", error);
    return NextResponse.json(
      { error: "Error al obtener actividad" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar actividad
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { codigo, nombre, descripcion, tipoPago, valor, unidadMedida, activo } = body;

    const actividad = await prisma.actividad.update({
      where: { id },
      data: {
        ...(codigo !== undefined && { codigo }),
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(tipoPago !== undefined && { tipoPago }),
        ...(valor !== undefined && { valor }),
        ...(unidadMedida !== undefined && { unidadMedida }),
        ...(activo !== undefined && { activo }),
      },
    });

    return NextResponse.json(actividad);
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    return NextResponse.json(
      { error: "Error al actualizar actividad" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar actividad (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    await prisma.actividad.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    return NextResponse.json(
      { error: "Error al eliminar actividad" },
      { status: 500 }
    );
  }
}
