/*
  Warnings:

  - You are about to drop the column `montoDescuentoJustificado` on the `asistencias` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asistencias" DROP COLUMN "montoDescuentoJustificado",
ADD COLUMN     "montoAjustePorJustificacion" DECIMAL(10,2);
