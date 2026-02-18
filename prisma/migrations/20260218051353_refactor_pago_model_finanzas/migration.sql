/*
  Warnings:

  - You are about to drop the column `multas` on the `pagos` table. All the data in the column will be lost.
  - You are about to drop the column `totalMultas` on the `pagos` table. All the data in the column will be lost.
  - The `tipoTrabajador` column on the `pagos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[trabajadorId,fechaInicio,fechaFin]` on the table `pagos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pagos" DROP COLUMN "multas",
DROP COLUMN "totalMultas",
ADD COLUMN     "multasTransacciones" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDescuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
DROP COLUMN "tipoTrabajador",
ADD COLUMN     "tipoTrabajador" "TipoTrabajador" NOT NULL DEFAULT 'EVENTUAL';

-- CreateIndex
CREATE INDEX "pagos_tipoTrabajador_idx" ON "pagos"("tipoTrabajador");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_trabajadorId_fechaInicio_fechaFin_key" ON "pagos"("trabajadorId", "fechaInicio", "fechaFin");
