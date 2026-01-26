import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";

// GET - Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, nombre, role, activo } = body;

    const data: any = {
      ...(email !== undefined && { email }),
      ...(nombre !== undefined && { nombre }),
      ...(role !== undefined && { role }),
      ...(activo !== undefined && { activo }),
    };

    // Solo hashear password si se proporciona uno nuevo
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        activo: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar usuario (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // No permitir que el admin se desactive a sí mismo
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: "No puede desactivarse a sí mismo" },
        { status: 400 }
      );
    }

    await prisma.usuario.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al desactivar usuario:", error);
    return NextResponse.json(
      { error: "Error al desactivar usuario" },
      { status: 500 }
    );
  }
}
