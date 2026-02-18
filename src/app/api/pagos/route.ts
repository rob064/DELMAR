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

// POST - Generar nómina para un trabajador (FIJO o EVENTUAL)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "FINANZAS"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      trabajadorId, 
      fechaInicio, 
      fechaFin,
      // Campos de bonificación (para trabajadores FIJOS)
      bonificacion,
      bonificacionCalculada,
      conceptoBonificacion,
    } = body;

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
    const trabajador: any = await (prisma.trabajador as any).findUnique({
      where: { id: trabajadorId },
      include: { jornada: true },
    });

    if (!trabajador) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    const esTrabajadorFijo = trabajador.tipoTrabajador === "FIJO";

    // Verificar si ya existe un pago para este período (unique constraint ya valida esto, pero validamos antes)
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

    // Calcular transacciones (adelantos, multas, ajustes)
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
    let multasTransacciones = new Decimal(0);
    let ajustes = new Decimal(0);

    transacciones.forEach((trans) => {
      if (trans.tipo === "ADELANTO") {
        adelantos = adelantos.add(trans.monto);
      } else if (trans.tipo === "MULTA") {
        multasTransacciones = multasTransacciones.add(trans.monto);
      } else if (trans.tipo === "AJUSTE") {
        ajustes = ajustes.add(trans.monto);
      }
    });

    let pagoData: any = {
      trabajadorId,
      fechaInicio: inicio,
      fechaFin: fin,
      tipoTrabajador: trabajador.tipoTrabajador,
      adelantos,
      multasTransacciones,
      ajustes,
      generadoPor: session.user.id,
    };

    let totalNeto = new Decimal(0);

    // ============================================
    // LÓGICA PARA TRABAJADOR FIJO
    // ============================================
    if (esTrabajadorFijo) {
      if (!trabajador.jornada) {
        return NextResponse.json(
          { error: "El trabajador FIJO debe tener una jornada asignada" },
          { status: 400 }
        );
      }

      // Obtener asistencias del periodo
      const asistencias = await prisma.asistencia.findMany({
        where: {
          trabajadorId,
          fecha: {
            gte: inicio,
            lte: fin,
          },
        },
      });

      if (asistencias.length === 0) {
        return NextResponse.json(
          { error: "No hay asistencias registradas para el período seleccionado. Debe existir al menos un día de asistencia para generar la nómina." },
          { status: 400 }
        );
      }

      // Sumar horas y montos desde asistencias
      let horasNormales = new Decimal(0);
      let horasSuplementarias = new Decimal(0);
      let horasExtra = new Decimal(0);
      let sueldoTrabajado = new Decimal(0);
      let totalDescuentos = new Decimal(0);
      let totalAjustesPorJustificaciones = new Decimal(0);

      asistencias.forEach((asist: any) => {
        if (asist.horasNormales) horasNormales = horasNormales.add(asist.horasNormales);
        if (asist.horasSuplementarias) horasSuplementarias = horasSuplementarias.add(asist.horasSuplementarias);
        if (asist.horasExtra) horasExtra = horasExtra.add(asist.horasExtra);
        if (asist.montoCalculado) sueldoTrabajado = sueldoTrabajado.add(asist.montoCalculado);
        if (asist.montoAjustePorJustificacion) {
          totalAjustesPorJustificaciones = totalAjustesPorJustificaciones.add(asist.montoAjustePorJustificacion);
        }

        // Calcular descuentos automáticos (retardos/faltas)
        if (asist.horasTrabajadas && trabajador.jornada) {
          const horasProgramadas = trabajador.jornada.horasDiariasBase;
          const tarifa = trabajador.tarifaPorHoraPersonalizada ?? trabajador.jornada.tarifaPorHora;
          const horasFaltantes = new Decimal(horasProgramadas).sub(asist.horasTrabajadas);
          
          if (horasFaltantes.greaterThan(0)) {
            const descuento = new Decimal(tarifa).mul(horasFaltantes);
            totalDescuentos = totalDescuentos.add(descuento);
          }
        }
      });

      // Calcular montos por tipo de hora
      const tarifa = trabajador.tarifaPorHoraPersonalizada ?? trabajador.jornada.tarifaPorHora;
      const multSupl = trabajador.multiplicadorSuplPersonalizado ?? trabajador.jornada.multiplicadorHorasSuplementarias;
      const multExtra = trabajador.multiplicadorExtraPersonalizado ?? trabajador.jornada.multiplicadorHorasExtra;

      const montoHorasNormales = horasNormales.mul(tarifa);
      const montoHorasSuplementarias = horasSuplementarias.mul(tarifa).mul(multSupl);
      const montoHorasExtra = horasExtra.mul(tarifa).mul(multExtra);

      // Calcular salario base del periodo
      const salarioBaseMensual = trabajador.salarioBasePersonalizado ?? trabajador.jornada.salarioBaseMensual;
      const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let salarioBasePeriodo = new Decimal(0);
      if (diasPeriodo <= 15) {
        salarioBasePeriodo = new Decimal(salarioBaseMensual.toString()).div(2);
      } else if (diasPeriodo <= 30) {
        salarioBasePeriodo = new Decimal(salarioBaseMensual.toString());
      } else {
        salarioBasePeriodo = new Decimal(salarioBaseMensual.toString()).mul(diasPeriodo).div(30);
      }

      // Bonificación: usar la del frontend si existe, sino calcular
      let bonificacionFinal = new Decimal(0);
      let bonificacionCalculadaFinal = new Decimal(0);

      // Calcular bonificación automática
      // Fórmula: Valor a Pagar = Sueldo Trabajado - Descuentos + Ajustes Justificaciones
      //          Bonificación = Salario Base - Valor a Pagar
      const valorAPagar = sueldoTrabajado.sub(totalDescuentos).add(totalAjustesPorJustificaciones);
      const diferencia = salarioBasePeriodo.sub(valorAPagar);
      if (diferencia.greaterThan(0)) {
        bonificacionCalculadaFinal = diferencia;
      }

      // Si viene del frontend, usar ese valor (fue editado manualmente)
      if (bonificacion !== undefined && bonificacion !== null && !isNaN(parseFloat(bonificacion))) {
        bonificacionFinal = new Decimal(bonificacion);
      } else {
        bonificacionFinal = bonificacionCalculadaFinal;
      }

      // Validar que bonificación no sea negativa
      if (bonificacionFinal.lessThan(0)) {
        bonificacionFinal = new Decimal(0);
      }

      // Calcular totalNeto para FIJOS
      // Fórmula: Salario Base - Adelantos - Multas + Ajustes
      // (El salario base ya incluye el trabajo realizado + bonificación para alcanzarlo)
      totalNeto = salarioBasePeriodo
        .sub(adelantos)
        .sub(multasTransacciones)
        .add(ajustes);

      // Agregar campos específicos de FIJOS
      pagoData = {
        ...pagoData,
        salarioBasePeriodo,
        horasNormales,
        horasSuplementarias,
        horasExtra,
        montoHorasNormales,
        montoHorasSuplementarias,
        montoHorasExtra,
        sueldoTrabajado,
        totalDescuentos,
        bonificacion: bonificacionFinal,
        bonificacionCalculada: bonificacionCalculadaFinal,
        conceptoBonificacion: conceptoBonificacion?.trim() || null,
        totalHoras: horasNormales.add(horasSuplementarias).add(horasExtra),
        totalNeto,
        montoPagado: new Decimal(0),
        saldoPendiente: totalNeto,
      };

    // ============================================
    // LÓGICA PARA TRABAJADOR EVENTUAL
    // ============================================
    } else {
      // Calcular desde producción (lógica existente)
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

      if (produccion.length === 0) {
        return NextResponse.json(
          { error: "No hay registros de producción para el período seleccionado. Debe existir al menos un registro de producción para generar la nómina." },
          { status: 400 }
        );
      }

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

      // Calcular totalNeto para EVENTUALES
      // Fórmula: montoBase - adelantos - multas + ajustes
      totalNeto = montoBase.sub(adelantos).sub(multasTransacciones).add(ajustes);

      pagoData = {
        ...pagoData,
        totalHoras,
        totalProduccion,
        montoBase,
        totalNeto,
        montoPagado: new Decimal(0),
        saldoPendiente: totalNeto,
      };
    }

    // Crear el pago en transacción
    const pago = await prisma.$transaction(async (tx) => {
      const nuevoPago = await tx.pago.create({
        data: pagoData,
        include: {
          trabajador: {
            select: {
              nombres: true,
              apellidos: true,
              dni: true,
              tipoTrabajador: true,
            },
          },
          abonos: true,
        },
      });

      // Marcar transacciones como descontadas
      if (transacciones.length > 0) {
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
      }

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


