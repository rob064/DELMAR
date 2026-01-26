-- ===============================================
-- Script para eliminar actividades de multas y pagos
-- Las multas y pagos se manejan desde el módulo de Finanzas
-- mediante la tabla de Transacciones, no como actividades
-- ===============================================

-- Ver actividades que se van a eliminar
SELECT * FROM actividades 
WHERE codigo IN ('MB', 'MM', 'MP', 'PB', 'PH', 'PL', 'PC', 'PP', 'PM', 'PX', 'PQ', 'PE', 'PS', 'PU')
ORDER BY codigo;

-- Verificar si hay registros de producción usando estas actividades
SELECT COUNT(*) as registros_produccion FROM produccion_diaria pd
INNER JOIN actividades a ON pd."actividadId" = a.id
WHERE a.codigo IN ('MB', 'MM', 'MP', 'PB', 'PH', 'PL', 'PC', 'PP', 'PM', 'PX', 'PQ', 'PE', 'PS', 'PU');

-- IMPORTANTE: Si hay registros de producción, eliminarlos primero
DELETE FROM produccion_diaria 
WHERE "actividadId" IN (
  SELECT id FROM actividades 
  WHERE codigo IN ('MB', 'MM', 'MP', 'PB', 'PH', 'PL', 'PC', 'PP', 'PM', 'PX', 'PQ', 'PE', 'PS', 'PU')
);

-- Eliminar las actividades de multas y pagos
DELETE FROM actividades 
WHERE codigo IN ('MB', 'MM', 'MP', 'PB', 'PH', 'PL', 'PC', 'PP', 'PM', 'PX', 'PQ', 'PE', 'PS', 'PU');

-- Verificar que solo quedan actividades de producción
SELECT codigo, nombre, "tipoPago", valor 
FROM actividades 
ORDER BY codigo;
