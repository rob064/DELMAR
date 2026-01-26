import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener transacciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const trabajadorId = searchParams.get("trabajadorId");
    const tipo = searchParams.get("tipo");

    const where: any = {};

    if (trabajadorId) {
      where.trabajadorId = trabajadorId;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const transacciones = await prisma.transaccion.findMany({
      where,
      include: {
        trabajador: {
          select: {
            nombres: true,
            apellidos: true,
            dni: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(transacciones);
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    return NextResponse.json(
      { error: "Error al obtener transacciones" },
      { status: 500 }
    );
  }
}

// POST - Crear transacción (adelanto, multa, ajuste)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { trabajadorId, tipo, monto, concepto, observaciones } = body;

    const transaccion = await prisma.transaccion.create({
      data: {
        trabajadorId,
        tipo,
        monto,
        concepto,
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
      },
    });

    return NextResponse.json(transaccion);
  } catch (error) {
    console.error("Error al crear transacción:", error);
    return NextResponse.json(
      { error: "Error al crear transacción" },
      { status: 500 }
    );
  }
}
