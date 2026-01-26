import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH - Actualizar trabajador
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
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
      activo,
      tipoTrabajador,
      jornadaId,
      salarioBasePersonalizado,
      tarifaPorHoraPersonalizada,
      multiplicadorSuplPersonalizado,
      multiplicadorExtraPersonalizado,
    } = body;

    const trabajadorId = id;

    // Obtener el trabajador actual
    const trabajadorActual = await prisma.trabajador.findUnique({
      where: { id: trabajadorId },
      include: { usuario: true },
    });

    if (!trabajadorActual) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el DNI ya existe (excepto el actual)
    if (dni && dni !== trabajadorActual.dni) {
      const dniExiste = await prisma.trabajador.findUnique({
        where: { dni },
      });

      if (dniExiste) {
        return NextResponse.json(
          { error: "El DNI ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Verificar si el email ya existe (excepto el actual)
    if (email && email !== trabajadorActual.usuario.email) {
      const emailExiste = await prisma.usuario.findUnique({
        where: { email },
      });

      if (emailExiste) {
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 400 }
        );
      }
    }

    // Actualizar en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar usuario
      const updateUserData: any = {
        nombre: `${nombres} ${apellidos}`,
      };

      if (email) {
        updateUserData.email = email;
      }

      if (password) {
        const bcrypt = require("bcryptjs");
        updateUserData.password = await bcrypt.hash(password, 10);
      }

      const usuario = await tx.usuario.update({
        where: { id: trabajadorActual.usuarioId },
        data: updateUserData,
      });

      // Actualizar trabajador
      const trabajadorData: any = {
        telefono,
        direccion,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        cuentaBancaria,
      };

      // Solo actualizar estos campos si se proporcionan (para evitar sobreescribir con undefined)
      if (nombres !== undefined) trabajadorData.nombres = nombres;
      if (apellidos !== undefined) trabajadorData.apellidos = apellidos;
      if (dni !== undefined) trabajadorData.dni = dni;
      if (activo !== undefined) trabajadorData.activo = activo;
      
      // Campos FIJOS
      if (tipoTrabajador !== undefined) trabajadorData.tipoTrabajador = tipoTrabajador;
      if (jornadaId !== undefined) trabajadorData.jornadaId = tipoTrabajador === "FIJO" ? jornadaId : null;
      if (salarioBasePersonalizado !== undefined) trabajadorData.salarioBasePersonalizado = salarioBasePersonalizado;
      if (tarifaPorHoraPersonalizada !== undefined) trabajadorData.tarifaPorHoraPersonalizada = tarifaPorHoraPersonalizada;
      if (multiplicadorSuplPersonalizado !== undefined) trabajadorData.multiplicadorSuplPersonalizado = multiplicadorSuplPersonalizado;
      if (multiplicadorExtraPersonalizado !== undefined) trabajadorData.multiplicadorExtraPersonalizado = multiplicadorExtraPersonalizado;

      const trabajador = await tx.trabajador.update({
        where: { id: trabajadorId },
        data: trabajadorData,
      });

      return { usuario, trabajador };
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al actualizar trabajador:", error);
    return NextResponse.json(
      { error: "Error al actualizar trabajador" },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar trabajador (no eliminar físicamente)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const trabajadorId = id;

    // Verificar que existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: trabajadorId },
    });

    if (!trabajador) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Desactivar trabajador
    const resultado = await prisma.trabajador.update({
      where: { id: trabajadorId },
      data: { activo: false },
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al desactivar trabajador:", error);
    return NextResponse.json(
      { error: "Error al desactivar trabajador" },
      { status: 500 }
    );
  }
}
