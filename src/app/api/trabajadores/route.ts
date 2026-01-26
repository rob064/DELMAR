import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obtener todos los trabajadores
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const trabajadores = await prisma.trabajador.findMany({
      where: includeInactive ? {} : { activo: true },
      include: {
        usuario: {
          select: {
            email: true,
            role: true,
          },
        },
        jornada: true, // Incluir jornada para FIJOS
      },
      orderBy: {
        apellidos: "asc",
      },
    });

    return NextResponse.json(trabajadores);
  } catch (error) {
    console.error("Error al obtener trabajadores:", error);
    return NextResponse.json(
      { error: "Error al obtener trabajadores" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo trabajador
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      nombres,
      apellidos,
      dni,
      telefono,
      direccion,
      fechaNacimiento,
      cuentaBancaria,
      tipoTrabajador,
      jornadaId,
      salarioBasePersonalizado,
      tarifaPorHoraPersonalizada,
      multiplicadorSuplPersonalizado,
      multiplicadorExtraPersonalizado,
    } = body;

    // Verificar si el email o DNI ya existen
    const emailExiste = await prisma.usuario.findUnique({
      where: { email },
    });

    if (emailExiste) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    const dniExiste = await prisma.trabajador.findUnique({
      where: { dni },
    });

    if (dniExiste) {
      return NextResponse.json(
        { error: "El DNI ya está registrado" },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario y trabajador en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
          password: hashedPassword,
          nombre: `${nombres} ${apellidos}`,
          role: "TRABAJADOR",
        },
      });

      const trabajador = await tx.trabajador.create({
        data: {
          usuarioId: usuario.id,
          nombres,
          apellidos,
          dni,
          telefono,
          direccion,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          cuentaBancaria,
          tipoTrabajador: tipoTrabajador || "EVENTUAL",
          jornadaId: tipoTrabajador === "FIJO" ? jornadaId : null,
          salarioBasePersonalizado,
          tarifaPorHoraPersonalizada,
          multiplicadorSuplPersonalizado,
          multiplicadorExtraPersonalizado,
        },
      });

      return { usuario, trabajador };
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al crear trabajador:", error);
    return NextResponse.json(
      { error: "Error al crear trabajador" },
      { status: 500 }
    );
  }
}
