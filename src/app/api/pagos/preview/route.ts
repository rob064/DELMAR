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
    const trabajador: any = await (prisma.trabajador as any).findUnique({
      where: { id: trabajadorId },
      include: {
        jornada: true,
      },
    });

    if (!trabajador) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    const esTrabajadorFijo = (trabajador as any).tipoTrabajador === "FIJO";

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

    // Inicializar variables
    let totalHoras = new Decimal(0);
    let totalProduccion = new Decimal(0);
    let montoBase = new Decimal(0);
    
    // Variables para trabajadores FIJOS
    let horasNormales = new Decimal(0);
    let horasSuplementarias = new Decimal(0);
    let horasExtra = new Decimal(0);
    let montoHorasNormales = new Decimal(0);
    let montoHorasSuplementarias = new Decimal(0);
    let montoHorasExtra = new Decimal(0);
    let sueldoTrabajado = new Decimal(0);
    let salarioBasePeriodo = new Decimal(0);
    let totalAjustesPorJustificaciones = new Decimal(0);

    if (esTrabajadorFijo && (trabajador as any).jornada) {
      // TRABAJADOR FIJO: Sumar campos calculados de asistencias
      asistencias.forEach((asist: any) => {
        if (asist.horasNormales) horasNormales = horasNormales.add(asist.horasNormales);
        if (asist.horasSuplementarias) horasSuplementarias = horasSuplementarias.add(asist.horasSuplementarias);
        if (asist.horasExtra) horasExtra = horasExtra.add(asist.horasExtra);
        if (asist.montoCalculado) sueldoTrabajado = sueldoTrabajado.add(asist.montoCalculado);
        // Sumar ajustes por justificaciones
        if (asist.montoAjustePorJustificacion) {
          totalAjustesPorJustificaciones = totalAjustesPorJustificaciones.add(asist.montoAjustePorJustificacion);
        }
      });

      // Calcular montos por tipo de hora
      const trab = trabajador as any;
      const tarifa = trab.tarifaPorHoraPersonalizada ?? trab.jornada.tarifaPorHora;
      const multSupl = trab.multiplicadorSuplPersonalizado ?? trab.jornada.multiplicadorHorasSuplementarias;
      const multExtra = trab.multiplicadorExtraPersonalizado ?? trab.jornada.multiplicadorHorasExtra;

      montoHorasNormales = horasNormales.mul(tarifa);
      montoHorasSuplementarias = horasSuplementarias.mul(tarifa).mul(multSupl);
      montoHorasExtra = horasExtra.mul(tarifa).mul(multExtra);

      // Calcular salario base del periodo (asumiendo quincenal = mitad del mensual)
      const salarioBaseMensual = trab.salarioBasePersonalizado ?? trab.jornada.salarioBaseMensual;
      const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calcular proporción del salario base según días del periodo
      if (diasPeriodo <= 15) {
        salarioBasePeriodo = new Decimal(salarioBaseMensual.toString()).div(2);
      } else if (diasPeriodo <= 30) {
        salarioBasePeriodo = new Decimal(salarioBaseMensual.toString());
      } else {
        // Más de un mes, prorratear
        salarioBasePeriodo = new Decimal(salarioBaseMensual.toString()).mul(diasPeriodo).div(30);
      }

      // El monto base incluye el sueldo trabajado + ajustes por justificaciones
      montoBase = sueldoTrabajado.add(totalAjustesPorJustificaciones);
    } else {
      // TRABAJADOR EVENTUAL: Calcular desde producción
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

      produccion.forEach((prod) => {
        if (prod.horasTrabajadas) {
          totalHoras = totalHoras.add(prod.horasTrabajadas);
        }
        if (prod.cantidadProducida) {
          totalProduccion = totalProduccion.add(prod.cantidadProducida);
        }
        montoBase = montoBase.add(prod.montoGenerado);
      });
    }

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

    // Calcular bonificación para trabajadores FIJOS
    let bonificacionCalculada = new Decimal(0);
    if (esTrabajadorFijo) {
      // FÓRMULA CORRECTA: bonificación = salarioBase - sueldoTrabajado (sin restar multas)
      // Las multas se descuentan del totalNeto final
      const diferencia = salarioBasePeriodo.sub(sueldoTrabajado);
      if (diferencia.greaterThan(0)) {
        bonificacionCalculada = diferencia;
      }
    }

    // Calcular total neto
    let totalNeto = new Decimal(0);
    if (esTrabajadorFijo) {
      // Para FIJOS: salarioBase + bonificacion - adelantos - multas + ajustes
      totalNeto = salarioBasePeriodo.add(bonificacionCalculada).sub(adelantos).sub(multasTransacciones).add(ajustes);
    } else {
      // Para EVENTUALES: montoBase - adelantos - multas + ajustes
      totalNeto = montoBase.sub(adelantos).sub(multasTransacciones).add(ajustes);
    }

    // Calcular días trabajados
    const diasTrabajados = asistencias.length;
    const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const trab = trabajador as any;

    return NextResponse.json({
      trabajador: {
        id: trabajador.id,
        nombres: trabajador.nombres,
        apellidos: trabajador.apellidos,
        dni: trabajador.dni,
        tipoTrabajador: trab.tipoTrabajador,
        jornada: trab.jornada,
      },
      periodo: {
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
        diasPeriodo,
        diasTrabajados,
      },
      asistencias,
      transacciones,
      resumen: {
        // Datos generales
        totalHoras: totalHoras.toString(),
        totalProduccion: totalProduccion.toString(),
        montoBase: montoBase.toString(),
        
        // Trabajadores FIJOS
        salarioBasePeriodo: salarioBasePeriodo.toString(),
        horasNormales: horasNormales.toString(),
        horasSuplementarias: horasSuplementarias.toString(),
        horasExtra: horasExtra.toString(),
        montoHorasNormales: montoHorasNormales.toString(),
        montoHorasSuplementarias: montoHorasSuplementarias.toString(),
        montoHorasExtra: montoHorasExtra.toString(),
        sueldoTrabajado: sueldoTrabajado.toString(),
        totalAjustesPorJustificaciones: totalAjustesPorJustificaciones.toString(),
        
        // Descuentos y bonificaciones
        adelantos: adelantos.toString(),
        multasTransacciones: multasTransacciones.toString(), // Multas manuales
        ajustes: ajustes.toString(),
        bonificacionCalculada: bonificacionCalculada.toString(),
        
        // Total
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
