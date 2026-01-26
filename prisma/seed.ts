import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...\n");

  // ==========================================
  // LIMPIAR BASE DE DATOS
  // ==========================================
  console.log("🗑️  Limpiando base de datos...");
  await prisma.produccionDiaria.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.transaccion.deleteMany();
  await prisma.asistencia.deleteMany();
  await prisma.actividad.deleteMany();
  await prisma.trabajador.deleteMany();
  await prisma.usuario.deleteMany();

  // ==========================================
  // USUARIOS Y ROLES
  // ==========================================
  console.log("\n👤 Creando usuarios...");
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.usuario.create({
    data: {
      email: "admin@delmar.com",
      password: hashedPassword,
      nombre: "Administrador",
      role: "ADMIN",
    },
  });
  console.log("✓ Admin creado: admin@delmar.com / admin123");

  const puertaUser = await prisma.usuario.create({
    data: {
      email: "puerta@delmar.com",
      password: await bcrypt.hash("puerta123", 10),
      nombre: "Control Puerta",
      role: "PUERTA",
    },
  });
  console.log("✓ Puerta creado: puerta@delmar.com / puerta123");

  const produccionUser = await prisma.usuario.create({
    data: {
      email: "produccion@delmar.com",
      password: await bcrypt.hash("produccion123", 10),
      nombre: "Control Producción",
      role: "PRODUCCION",
    },
  });
  console.log("✓ Producción creado: produccion@delmar.com / produccion123");

  const finanzasUser = await prisma.usuario.create({
    data: {
      email: "finanzas@delmar.com",
      password: await bcrypt.hash("finanzas123", 10),
      nombre: "Control Finanzas",
      role: "FINANZAS",
    },
  });
  console.log("✓ Finanzas creado: finanzas@delmar.com / finanzas123");

  // ==========================================
  // TRABAJADORES DE PRUEBA
  // ==========================================
  console.log("\n👷 Creando trabajadores de prueba...");

  const trabajador1User = await prisma.usuario.create({
    data: {
      email: "juan.perez@delmar.com",
      password: await bcrypt.hash("123456", 10),
      nombre: "Juan Pérez García",
      role: "TRABAJADOR",
    },
  });

  const trabajador1 = await prisma.trabajador.create({
    data: {
      usuarioId: trabajador1User.id,
      nombres: "Juan Carlos",
      apellidos: "Pérez García",
      dni: "45678901",
      telefono: "987654321",
      direccion: "Av. Principal 123, Lima",
    },
  });
  console.log("✓ Trabajador 1: Juan Pérez (DNI: 45678901)");

  const trabajador2User = await prisma.usuario.create({
    data: {
      email: "maria.lopez@delmar.com",
      password: await bcrypt.hash("123456", 10),
      nombre: "María López Torres",
      role: "TRABAJADOR",
    },
  });

  const trabajador2 = await prisma.trabajador.create({
    data: {
      usuarioId: trabajador2User.id,
      nombres: "María Isabel",
      apellidos: "López Torres",
      dni: "45678902",
      telefono: "987654322",
      direccion: "Jr. Los Pinos 456, Lima",
    },
  });
  console.log("✓ Trabajador 2: María López (DNI: 45678902)");

  // ==========================================
  // ACTIVIDADES DE PRODUCCIÓN
  // ==========================================
  console.log("\n📦 Creando actividades de producción...");

  const actividades = [
    // Actividades de BODEGA
    { codigo: "BA", nombre: "BODEGA APOYO", tipo: "POR_HORA", valor: 2.00 },
    { codigo: "BE", nombre: "BODEGA ETIQUETADO OVAL", tipo: "POR_PRODUCCION", valor: 0.19, unidad: "unidades" },
    { codigo: "BT", nombre: "BODEGA ETIQUETADO TINAPA", tipo: "POR_PRODUCCION", valor: 0.25, unidad: "unidades" },
    { codigo: "BL", nombre: "BODEGA LIMPIEZA OVAL", tipo: "POR_PRODUCCION", valor: 0.30, unidad: "unidades" },
    
    // Actividades de CUARTO (Por Hora y Por Producción)
    { codigo: "CM", nombre: "Cu. MAQUINA", tipo: "POR_HORA", valor: 2.00 },
    { codigo: "CP", nombre: "Cu. PROCESO", tipo: "POR_HORA", valor: 2.00 },
    { codigo: "CE", nombre: "Cu. PROCESO EMPAQUE OVAL", tipo: "POR_PRODUCCION", valor: 0.45, unidad: "kg" },
    { codigo: "CT", nombre: "Cu. PROCESO EMPAQUE TINAPA", tipo: "POR_PRODUCCION", valor: 0.75, unidad: "kg" },
    { codigo: "MA", nombre: "MAQUINA APOYO", tipo: "POR_HORA", valor: 2.00 },
    
    // Otros roles
    { codigo: "PA", nombre: "PASTERO", tipo: "POR_HORA", valor: 2.50 },
    { codigo: "PR", nombre: "PROCESO APOYO", tipo: "POR_HORA", valor: 2.00 },
    { codigo: "PO", nombre: "PROCESO EMPAQUE OVAL", tipo: "POR_PRODUCCION", valor: 0.42, unidad: "kg" },
    { codigo: "SU", nombre: "SUPERVISOR", tipo: "POR_HORA", valor: 2.25 },
  ];

  for (const act of actividades) {
    await prisma.actividad.create({
      data: {
        codigo: act.codigo,
        nombre: act.nombre,
        tipoPago: act.tipo as any,
        valor: act.valor,
        unidadMedida: act.unidad || null,
      },
    });
    console.log(`✓ ${act.codigo}: ${act.nombre} (${act.tipo}) - $ ${act.valor}${act.unidad ? ' por ' + act.unidad : ''}`);
  }

  // ==========================================
  // ASISTENCIAS DE PRUEBA
  // ==========================================
  console.log("\n📋 Creando asistencias de prueba...");

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const entrada1 = new Date();
  entrada1.setHours(8, 5, 0, 0);

  await prisma.asistencia.create({
    data: {
      trabajadorId: trabajador1.id,
      fecha: hoy,
      horaEntrada: entrada1,
      turnoProgramado: "08:00-16:00",
      estado: "TARDE",
      minutosRetraso: 5,
    },
  });
  console.log("✓ Asistencia de Juan (llegó a las 08:05)");

  const entrada2 = new Date();
  entrada2.setHours(7, 55, 0, 0);

  await prisma.asistencia.create({
    data: {
      trabajadorId: trabajador2.id,
      fecha: hoy,
      horaEntrada: entrada2,
      turnoProgramado: "08:00-16:00",
      estado: "PRESENTE",
      minutosRetraso: 0,
    },
  });
  console.log("✓ Asistencia de María (llegó a las 07:55)");

  // ==========================================
  // PRODUCCIÓN DE PRUEBA
  // ==========================================
  console.log("\n🏭 Creando registros de producción de prueba...");

  const actividadDescarga = await prisma.actividad.findFirst({
    where: { codigo: "BA" },
  });

  if (actividadDescarga) {
    await prisma.produccionDiaria.create({
      data: {
        trabajadorId: trabajador1.id,
        actividadId: actividadDescarga.id,
        fecha: hoy,
        horasTrabajadas: 8,
        montoGenerado: 16.00, // 8 horas * 2.00
      },
    });
    console.log("✓ Producción de Juan: 8 horas de Bodega Apoyo (S/ 16.00)");
  }

  const actividadEmpaque = await prisma.actividad.findFirst({
    where: { codigo: "PO" },
  });

  if (actividadEmpaque) {
    await prisma.produccionDiaria.create({
      data: {
        trabajadorId: trabajador2.id,
        actividadId: actividadEmpaque.id,
        fecha: hoy,
        cantidadProducida: 50,
        montoGenerado: 21.00, // 50 kg * 0.42
      },
    });
    console.log("✓ Producción de María: 50 kg de Proceso Empaque Oval (S/ 21.00)");
  }

  console.log("\n✅ Seed completado exitosamente!");
  console.log("\n📝 Resumen de credenciales:");
  console.log("════════════════════════════════════════════");
  console.log("Admin:      admin@delmar.com / admin123");
  console.log("Puerta:     puerta@delmar.com / puerta123");
  console.log("Producción: produccion@delmar.com / produccion123");
  console.log("Finanzas:   finanzas@delmar.com / finanzas123");
  console.log("Trabajador: juan.perez@delmar.com / 123456");
  console.log("Trabajador: maria.lopez@delmar.com / 123456");
  console.log("════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
