-- ============================================
-- Script para corregir zona horaria en NEON
-- Ejecutar en Neon SQL Editor
-- ============================================

-- 1. Actualizar horaEntrada en asistencias (restar 5 horas para UTC-5)
UPDATE asistencias 
SET "horaEntrada" = "horaEntrada" - INTERVAL '5 hours'
WHERE "horaEntrada" IS NOT NULL;

-- 2. Actualizar horaSalida en asistencias  
UPDATE asistencias
SET "horaSalida" = "horaSalida" - INTERVAL '5 hours'
WHERE "horaSalida" IS NOT NULL;

-- 3. Actualizar horaInicio en produccion_diaria
UPDATE produccion_diaria
SET "horaInicio" = "horaInicio" - INTERVAL '5 hours'
WHERE "horaInicio" IS NOT NULL;

-- 4. Actualizar horaFin en produccion_diaria
UPDATE produccion_diaria
SET "horaFin" = "horaFin" - INTERVAL '5 hours'
WHERE "horaFin" IS NOT NULL;

-- 5. Verificar los cambios en asistencias
SELECT 
    fecha, 
    "turnoProgramado", 
    "horaEntrada"::timestamp AT TIME ZONE 'America/Lima' as hora_entrada_local,
    "horaSalida"::timestamp AT TIME ZONE 'America/Lima' as hora_salida_local
FROM asistencias 
ORDER BY fecha DESC, "horaEntrada" DESC 
LIMIT 10;

-- 6. Verificar los cambios en producción
SELECT 
    fecha,
    "horaInicio"::timestamp AT TIME ZONE 'America/Lima' as hora_inicio_local,
    "horaFin"::timestamp AT TIME ZONE 'America/Lima' as hora_fin_local
FROM produccion_diaria
ORDER BY fecha DESC
LIMIT 10;
