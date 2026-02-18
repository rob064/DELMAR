-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PUERTA', 'PRODUCCION', 'FINANZAS', 'TRABAJADOR');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('POR_HORA', 'POR_PRODUCCION');

-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'TARDE', 'AUSENTE', 'JUSTIFICADO');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('ADELANTO', 'MULTA', 'PAGO', 'AJUSTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TRABAJADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "cuentaBancaria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipoPago" "TipoPago" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "unidadMedida" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jornadas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "diasSemana" INTEGER[],
    "fechaInicio" DATE,
    "fechaFin" DATE,
    "esExcepcion" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jornadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turnoProgramado" TEXT,
    "horaEntrada" TIMESTAMP(3),
    "horaSalida" TIMESTAMP(3),
    "estado" "EstadoAsistencia" NOT NULL DEFAULT 'PRESENTE',
    "minutosRetraso" INTEGER NOT NULL DEFAULT 0,
    "justificada" BOOLEAN NOT NULL DEFAULT false,
    "motivoJustificacion" TEXT,
    "registradoPor" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_diaria" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "actividadId" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horasTrabajadas" DECIMAL(10,2),
    "cantidadProducida" DECIMAL(10,2),
    "montoGenerado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "horaInicio" TIMESTAMP(3),
    "horaFin" TIMESTAMP(3),
    "observaciones" TEXT,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_diaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descontado" BOOLEAN NOT NULL DEFAULT false,
    "pagoId" TEXT,
    "observaciones" TEXT,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "totalHoras" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalProduccion" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "adelantos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "multas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ajustes" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalNeto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoPagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldoPendiente" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "generadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "numeroReferencia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abonos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_usuarioId_key" ON "trabajadores"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_dni_key" ON "trabajadores"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "actividades_codigo_key" ON "actividades"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "actividades_nombre_key" ON "actividades"("nombre");

-- CreateIndex
CREATE INDEX "asistencias_fecha_idx" ON "asistencias"("fecha");

-- CreateIndex
CREATE INDEX "asistencias_trabajadorId_idx" ON "asistencias"("trabajadorId");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_trabajadorId_fecha_key" ON "asistencias"("trabajadorId", "fecha");

-- CreateIndex
CREATE INDEX "produccion_diaria_fecha_idx" ON "produccion_diaria"("fecha");

-- CreateIndex
CREATE INDEX "produccion_diaria_trabajadorId_idx" ON "produccion_diaria"("trabajadorId");

-- CreateIndex
CREATE INDEX "produccion_diaria_actividadId_idx" ON "produccion_diaria"("actividadId");

-- CreateIndex
CREATE INDEX "transacciones_trabajadorId_idx" ON "transacciones"("trabajadorId");

-- CreateIndex
CREATE INDEX "transacciones_fecha_idx" ON "transacciones"("fecha");

-- CreateIndex
CREATE INDEX "transacciones_tipo_idx" ON "transacciones"("tipo");

-- CreateIndex
CREATE INDEX "pagos_trabajadorId_idx" ON "pagos"("trabajadorId");

-- CreateIndex
CREATE INDEX "pagos_fechaInicio_fechaFin_idx" ON "pagos"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "abonos_pagoId_idx" ON "abonos"("pagoId");

-- CreateIndex
CREATE INDEX "abonos_fecha_idx" ON "abonos"("fecha");

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_diaria" ADD CONSTRAINT "produccion_diaria_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_diaria" ADD CONSTRAINT "produccion_diaria_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "pagos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
