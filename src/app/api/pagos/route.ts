import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { obtenerFechaSemana } from "@/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";

// GET - Obtener pagos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const trabajadorId = searchParams.get("trabajadorId");

    const where: any = {};

    if (trabajadorId) {
      where.trabajadorId = trabajadorId;
    }

    const pagos = await prisma.pago.findMany({
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
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}

// POST - Generar nómina semanal para un trabajador
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { trabajadorId, fechaInicio, fechaFin } = body;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Verificar si ya existe un pago para este período
    const pagoExistente = await prisma.pago.findFirst({
      where: {
        trabajadorId,
        fechaInicio: inicio,
        fechaFin: fin,
      },
    });

    if (pagoExistente) {
      return NextResponse.json(
        { error: "Ya existe un pago para este período" },
        { status: 400 }
      );
    }

    // Calcular total de horas y producción
    const produccion = await prisma.produccionDiaria.findMany({
      where: {
        trabajadorId,
        fecha: {
          gte: inicio,
          lte: fin,
        },
      },
      include: {
        actividad: true,
      },
    });

    let totalHoras = new Decimal(0);
    let totalProduccion = new Decimal(0);
    let montoBase = new Decimal(0);

    produccion.forEach((prod) => {
      if (prod.horasTrabajadas) {
        totalHoras = totalHoras.add(prod.horasTrabajadas);
      }
      if (prod.cantidadProducida) {
        totalProduccion = totalProduccion.add(prod.cantidadProducida);
      }
      montoBase = montoBase.add(prod.montoGenerado);
    });

    // Calcular adelantos y multas no descontados
    const transacciones = await prisma.transaccion.findMany({
      where: {
        trabajadorId,
        fecha: {
          gte: inicio,
          lte: fin,
        },
        descontado: false,
      },
    });

    let adelantos = new Decimal(0);
    let multas = new Decimal(0);
    let ajustes = new Decimal(0);

    transacciones.forEach((trans) => {
      if (trans.tipo === "ADELANTO") {
        adelantos = adelantos.add(trans.monto);
      } else if (trans.tipo === "MULTA") {
        multas = multas.add(trans.monto);
      } else if (trans.tipo === "AJUSTE") {
        ajustes = ajustes.add(trans.monto);
      }
    });

    // Calcular total neto
    const totalNeto = montoBase.sub(adelantos).sub(multas).add(ajustes);

    // Crear el pago
    const pago = await prisma.$transaction(async (tx) => {
      const nuevoPago = await tx.pago.create({
        data: {
          trabajadorId,
          fechaInicio: inicio,
          fechaFin: fin,
          totalHoras,
          totalProduccion,
          montoBase,
          adelantos,
          multas,
          ajustes,
          totalNeto,
          generadoPor: session.user.id,
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

      // Marcar transacciones como descontadas
      await tx.transaccion.updateMany({
        where: {
          id: {
            in: transacciones.map((t) => t.id),
          },
        },
        data: {
          descontado: true,
          pagoId: nuevoPago.id,
        },
      });

      return nuevoPago;
    });

    return NextResponse.json(pago);
  } catch (error) {
    console.error("Error al generar pago:", error);
    return NextResponse.json(
      { error: "Error al generar pago" },
      { status: 500 }
    );
  }
}

// PATCH - Marcar pago como pagado
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { pagoId, metodoPago, observaciones } = body;

    const pago = await prisma.pago.update({
      where: { id: pagoId },
      data: {
        pagado: true,
        fechaPago: new Date(),
        metodoPago,
        observaciones,
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

    return NextResponse.json(pago);
  } catch (error) {
    console.error("Error al marcar pago:", error);
    return NextResponse.json(
      { error: "Error al marcar pago" },
      { status: 500 }
    );
  }
}
