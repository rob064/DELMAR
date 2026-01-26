import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// GET - Obtener abonos de un pago
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const pagoId = searchParams.get("pagoId");

    if (!pagoId) {
      return NextResponse.json(
        { error: "pagoId es requerido" },
        { status: 400 }
      );
    }

    const abonos = await prisma.abono.findMany({
      where: { pagoId },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(abonos);
  } catch (error) {
    console.error("Error al obtener abonos:", error);
    return NextResponse.json(
      { error: "Error al obtener abonos" },
      { status: 500 }
    );
  }
}

// POST - Registrar un abono
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { pagoId, monto, metodoPago, numeroReferencia, observaciones } = body;

    if (!pagoId || !monto || !metodoPago) {
      return NextResponse.json(
        { error: "pagoId, monto y metodoPago son requeridos" },
        { status: 400 }
      );
    }

    const montoDecimal = new Decimal(monto);

    if (montoDecimal.lte(0)) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      );
    }

    // Verificar que el pago existe
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
    });

    if (!pago) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el abono no exceda el saldo pendiente
    if (montoDecimal.gt(pago.saldoPendiente)) {
      return NextResponse.json(
        { error: "El monto del abono excede el saldo pendiente" },
        { status: 400 }
      );
    }

    // Crear el abono y actualizar el pago en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const abono = await tx.abono.create({
        data: {
          pagoId,
          monto: montoDecimal,
          metodoPago,
          numeroReferencia,
          observaciones,
          registradoPor: session.user.id,
        },
      });

      const nuevoMontoPagado = pago.montoPagado.add(montoDecimal);
      const nuevoSaldoPendiente = pago.totalNeto.sub(nuevoMontoPagado);
      const estaPagado = nuevoSaldoPendiente.lte(0);

      const pagoActualizado = await tx.pago.update({
        where: { id: pagoId },
        data: {
          montoPagado: nuevoMontoPagado,
          saldoPendiente: nuevoSaldoPendiente,
          pagado: estaPagado,
        },
      });

      return { abono, pago: pagoActualizado };
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al registrar abono:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al registrar abono: ${mensaje}` },
      { status: 500 }
    );
  }
}
