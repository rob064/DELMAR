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
        abonos: {
          orderBy: {
            fecha: "desc",
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

    if (!trabajadorId || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Debe seleccionar un trabajador y las fechas de inicio y fin" },
        { status: 400 }
      );
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return NextResponse.json(
        { error: "Las fechas proporcionadas no son válidas" },
        { status: 400 }
      );
    }

    if (inicio > fin) {
      return NextResponse.json(
        { error: "La fecha de inicio no puede ser posterior a la fecha de fin" },
        { status: 400 }
      );
    }

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

    if (produccion.length === 0) {
      return NextResponse.json(
        { error: "No hay registros de producción para el período seleccionado. Debe existir al menos un registro de producción para generar la nómina." },
        { status: 400 }
      );
    }

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
          montoPagado: new Decimal(0),
          saldoPendiente: totalNeto,
          generadoPor: session.user.id,
        },
        include: {
          trabajador: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          abonos: true,
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
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar pago: ${mensaje}` },
      { status: 500 }
    );
  }
}


