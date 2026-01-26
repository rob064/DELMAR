import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// POST - Obtener preview de nómina sin generarla
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

    // Obtener información del trabajador
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: trabajadorId },
      select: {
        nombres: true,
        apellidos: true,
        dni: true,
      },
    });

    if (!trabajador) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
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

    // Obtener asistencias del período
    const asistencias = await prisma.asistencia.findMany({
      where: {
        trabajadorId,
        fecha: {
          gte: inicio,
          lte: fin,
        },
      },
      orderBy: { fecha: "asc" },
    });

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
      orderBy: { fecha: "asc" },
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
      orderBy: { fecha: "desc" },
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

    // Calcular días trabajados
    const diasTrabajados = asistencias.length;
    const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return NextResponse.json({
      trabajador,
      periodo: {
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
        diasPeriodo,
        diasTrabajados,
      },
      asistencias,
      produccion,
      transacciones,
      resumen: {
        totalHoras: totalHoras.toString(),
        totalProduccion: totalProduccion.toString(),
        montoBase: montoBase.toString(),
        adelantos: adelantos.toString(),
        multas: multas.toString(),
        ajustes: ajustes.toString(),
        totalNeto: totalNeto.toString(),
      },
      pagoExistente: !!pagoExistente,
    });
  } catch (error) {
    console.error("Error al generar preview:", error);
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar preview: ${mensaje}` },
      { status: 500 }
    );
  }
}
