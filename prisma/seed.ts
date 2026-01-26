import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  // Limpiar datos (excepto usuarios y trabajadores, los recrearemos)
  console.log("🗑️  Limpiando datos existentes...");
  
  await prisma.abono.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.transaccion.deleteMany();
  await prisma.produccionDiaria.deleteMany();
  await prisma.asistencia.deleteMany();
  await prisma.actividad.deleteMany();
  await prisma.trabajador.deleteMany();
  await prisma.jornada.deleteMany();
  await prisma.usuario.deleteMany();

  // Hash de contraseña común para testing
  const hashedPassword = await bcrypt.hash("123456", 10);

  console.log("👤 Creando usuarios del sistema...");

  // 1. Superadministrador
  const superadmin = await prisma.usuario.create({
    data: {
      email: "admin@delmar.com",
      password: hashedPassword,
      nombre: "Roberto",
      role: "ADMIN",
    },
  });
  console.log("✅ Superadministrador creado");

  // 2. Supervisor de Puerta
  const puerta = await prisma.usuario.create({
    data: {
      email: "puerta@delmar.com",
      password: hashedPassword,
      nombre: "Carlos Portero",
      role: "PUERTA",
    },
  });
  console.log("✅ Usuario PUERTA creado");

  // 3. Supervisor de Producción
  const produccion = await prisma.usuario.create({
    data: {
      email: "produccion@delmar.com",
      password: hashedPassword,
      nombre: "María Supervisora",
      role: "PRODUCCION",
    },
  });
  console.log("✅ Usuario PRODUCCION creado");

  // 4. Encargado de Finanzas
  const finanzas = await prisma.usuario.create({
    data: {
      email: "finanzas@delmar.com",
      password: hashedPassword,
      nombre: "Juan Contador",
      role: "FINANZAS",
    },
  });
  console.log("✅ Usuario FINANZAS creado");

  console.log("⏰ Creando jornadas laborales...");

  // Crear jornadas
  const jornadaMatutina = await prisma.jornada.create({
    data: {
      nombre: "Matutina",
      horaInicio: "08:00",
      horaFin: "17:00",
      horasDiariasBase: 8.0,
      salarioBaseMensual: 433.33,
      tarifaPorHora: 2.71,
      multiplicadorHorasSuplementarias: 1.75,
      multiplicadorHorasExtra: 2.50,
      activo: true,
    },
  });

  const jornadaNocturna = await prisma.jornada.create({
    data: {
      nombre: "Nocturna",
      horaInicio: "20:00",
      horaFin: "05:00",
      horasDiariasBase: 8.0,
      salarioBaseMensual: 500.00,
      tarifaPorHora: 3.13,
      multiplicadorHorasSuplementarias: 1.75,
      multiplicadorHorasExtra: 2.50,
      activo: true,
    },
  });

  console.log("✅ Jornadas creadas");

  console.log("👷 Creando trabajadores...");

  // TRABAJADOR EVENTUAL 1
  const userEventual1 = await prisma.usuario.create({
    data: {
      email: "eventual1@delmar.com",
      password: hashedPassword,
      nombre: "Pedro Eventual",
      role: "TRABAJADOR",
    },
  });

  await prisma.trabajador.create({
    data: {
      usuarioId: userEventual1.id,
      nombres: "Pedro",
      apellidos: "García López",
      dni: "0926543210",
      telefono: "0987654321",
      direccion: "Manta, Ecuador",
      tipoTrabajador: "EVENTUAL",
      activo: true,
    },
  });
  console.log("✅ Trabajador EVENTUAL 1 creado");

  // TRABAJADOR EVENTUAL 2
  const userEventual2 = await prisma.usuario.create({
    data: {
      email: "eventual2@delmar.com",
      password: hashedPassword,
      nombre: "Luis Eventual",
      role: "TRABAJADOR",
    },
  });

  await prisma.trabajador.create({
    data: {
      usuarioId: userEventual2.id,
      nombres: "Luis",
      apellidos: "Mendoza Vera",
      dni: "1305678901",
      telefono: "0991234567",
      direccion: "Manta, Ecuador",
      tipoTrabajador: "EVENTUAL",
      activo: true,
    },
  });
  console.log("✅ Trabajador EVENTUAL 2 creado");

  // TRABAJADOR FIJO 1
  const userFijo1 = await prisma.usuario.create({
    data: {
      email: "fijo1@delmar.com",
      password: hashedPassword,
      nombre: "Ana Fija",
      role: "TRABAJADOR",
    },
  });

  await prisma.trabajador.create({
    data: {
      usuarioId: userFijo1.id,
      nombres: "Ana",
      apellidos: "Martínez Suárez",
      dni: "1312345678",
      telefono: "0998765432",
      direccion: "Manta, Ecuador",
      tipoTrabajador: "FIJO",
      jornadaId: jornadaMatutina.id,
      activo: true,
    },
  });
  console.log("✅ Trabajador FIJO 1 creado (Jornada Matutina)");

  // TRABAJADOR FIJO 2
  const userFijo2 = await prisma.usuario.create({
    data: {
      email: "fijo2@delmar.com",
      password: hashedPassword,
      nombre: "Carlos Fijo",
      role: "TRABAJADOR",
    },
  });

  await prisma.trabajador.create({
    data: {
      usuarioId: userFijo2.id,
      nombres: "Carlos",
      apellidos: "Rodríguez Zambrano",
      dni: "0912345678",
      telefono: "0987123456",
      direccion: "Manta, Ecuador",
      tipoTrabajador: "FIJO",
      jornadaId: jornadaNocturna.id,
      activo: true,
    },
  });
  console.log("✅ Trabajador FIJO 2 creado (Jornada Nocturna)");

  console.log("🎣 Creando actividades de producción...");

  // Crear actividades
  await prisma.actividad.create({
    data: {
      codigo: "DESC-PESC",
      nombre: "Descarga de Pescado",
      descripcion: "Descarga de pescado del barco",
      tipoPago: "POR_HORA",
      valor: 3.50,
      activo: true,
    },
  });

  await prisma.actividad.create({
    data: {
      codigo: "LIMP-PESC",
      nombre: "Limpieza de Pescado",
      descripcion: "Limpieza y eviscerado",
      tipoPago: "POR_HORA",
      valor: 3.00,
      activo: true,
    },
  });

  await prisma.actividad.create({
    data: {
      codigo: "EMPAQUE",
      nombre: "Empaque",
      descripcion: "Empaque de producto terminado",
      tipoPago: "POR_PRODUCCION",
      valor: 0.50,
      unidadMedida: "caja",
      activo: true,
    },
  });

  await prisma.actividad.create({
    data: {
      codigo: "CARG-HIELO",
      nombre: "Carga de Hielo",
      descripcion: "Carga de hielo en bodegas",
      tipoPago: "POR_HORA",
      valor: 2.50,
      activo: true,
    },
  });

  console.log("✅ Actividades creadas");

  console.log("\n✨ Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ADMIN:      admin@delmar.com      / 123456");
  console.log("PUERTA:     puerta@delmar.com     / 123456");
  console.log("PRODUCCION: produccion@delmar.com / 123456");
  console.log("FINANZAS:   finanzas@delmar.com   / 123456");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("EVENTUAL 1: eventual1@delmar.com  / 123456");
  console.log("EVENTUAL 2: eventual2@delmar.com  / 123456");
  console.log("FIJO 1:     fijo1@delmar.com      / 123456");
  console.log("FIJO 2:     fijo2@delmar.com      / 123456");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
