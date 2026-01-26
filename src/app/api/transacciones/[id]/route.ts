import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH - Editar transacción
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { monto, concepto, observaciones } = body;

    // Verificar que la transacción no esté descontada
    const transaccion = await prisma.transaccion.findUnique({
      where: { id: params.id },
    });

    if (!transaccion) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    if (transaccion.descontado) {
      return NextResponse.json(
        { error: "No se puede editar una transacción ya descontada en una nómina" },
        { status: 400 }
      );
    }

    const transaccionActualizada = await prisma.transaccion.update({
      where: { id: params.id },
      data: {
        monto: monto ? parseFloat(monto) : undefined,
        concepto: concepto || undefined,
        observaciones: observaciones !== undefined ? observaciones : undefined,
      },
    });

    return NextResponse.json(transaccionActualizada);
  } catch (error) {
    console.error("Error al editar transacción:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al editar transacción: ${mensaje}` },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar transacción
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que la transacción no esté descontada
    const transaccion = await prisma.transaccion.findUnique({
      where: { id: params.id },
    });

    if (!transaccion) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    if (transaccion.descontado) {
      return NextResponse.json(
        { error: "No se puede eliminar una transacción ya descontada en una nómina" },
        { status: 400 }
      );
    }

    await prisma.transaccion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar transacción:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al eliminar transacción: ${mensaje}` },
      { status: 500 }
    );
  }
}
