-- CreateEnum
CREATE TYPE "TipoTrabajador" AS ENUM ('FIJO', 'EVENTUAL');

-- AlterTable
ALTER TABLE "asistencias" ADD COLUMN     "horasExtra" DECIMAL(10,2),
ADD COLUMN     "horasNormales" DECIMAL(10,2),
ADD COLUMN     "horasSuplementarias" DECIMAL(10,2),
ADD COLUMN     "horasTrabajadas" DECIMAL(10,2),
ADD COLUMN     "montoCalculado" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "jornadas" ADD COLUMN     "horasDiariasBase" DECIMAL(10,2) NOT NULL DEFAULT 8.00,
ADD COLUMN     "multiplicadorHorasExtra" DECIMAL(10,2) NOT NULL DEFAULT 2.50,
ADD COLUMN     "multiplicadorHorasSuplementarias" DECIMAL(10,2) NOT NULL DEFAULT 1.75,
ADD COLUMN     "salarioBaseMensual" DECIMAL(10,2) NOT NULL DEFAULT 433.33,
ADD COLUMN     "tarifaPorHora" DECIMAL(10,4) NOT NULL DEFAULT 2.71;

-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "bonificacion" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bonificacionCalculada" DECIMAL(10,2),
ADD COLUMN     "conceptoBonificacion" TEXT,
ADD COLUMN     "horasExtra" DECIMAL(10,2),
ADD COLUMN     "horasNormales" DECIMAL(10,2),
ADD COLUMN     "horasSuplementarias" DECIMAL(10,2),
ADD COLUMN     "montoHorasExtra" DECIMAL(10,2),
ADD COLUMN     "montoHorasNormales" DECIMAL(10,2),
ADD COLUMN     "montoHorasSuplementarias" DECIMAL(10,2),
ADD COLUMN     "salarioBasePeriodo" DECIMAL(10,2),
ADD COLUMN     "sueldoTrabajado" DECIMAL(10,2),
ADD COLUMN     "tipoTrabajador" TEXT,
ADD COLUMN     "totalMultas" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "trabajadores" ADD COLUMN     "jornadaId" TEXT,
ADD COLUMN     "multiplicadorExtraPersonalizado" DECIMAL(10,2),
ADD COLUMN     "multiplicadorSuplPersonalizado" DECIMAL(10,2),
ADD COLUMN     "salarioBasePersonalizado" DECIMAL(10,2),
ADD COLUMN     "tarifaPorHoraPersonalizada" DECIMAL(10,4),
ADD COLUMN     "tipoTrabajador" "TipoTrabajador" NOT NULL DEFAULT 'EVENTUAL';

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "jornadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
