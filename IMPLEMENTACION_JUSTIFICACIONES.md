# Sistema de Justificaciones para Trabajadores FIJOS

## Resumen de la Implementación

Este documento describe la implementación completa del sistema de justificaciones para atrasos e inasistencias de trabajadores FIJOS.

## Lógica de Negocio

### Trabajadores FIJOS
- Se espera que trabajen 8 horas diarias (configurado en `jornada.horasDiariasBase`)
- Al registrar la salida, el sistema calcula automáticamente:
  - `horasTrabajadas`: Horas efectivamente trabajadas
  - `montoCalculado`: Pago por esas horas (ya incluye el descuento automático)

### Sistema de Justificaciones
Cuando un trabajador FIJO tiene un atraso o inasistencia:

1. **Descuento Automático**: 
   ```
   descuentoAutomatico = (horasProgramadas - horasTrabajadas) * tarifaPorHora
   ```

2. **Justificación**:
   - El usuario puede justificar parcial o totalmente el descuento
   - Debe proporcionar un motivo obligatorio
   - Puede editar el monto de descuento final

3. **Ajuste Calculado**:
   ```
   montoAjustePorJustificacion = descuentoAutomatico - descuentoFinal
   ```

4. **Monto Total del Día**:
   ```
   totalDia = montoCalculado + montoAjustePorJustificacion
   ```

## Ejemplo Práctico

```
Jornada: 8 horas diarias, $2.71/hora
Trabajador llegó tarde 30 minutos

1. Registro automático:
   - horasTrabajadas: 7.5 hrs
   - montoCalculado: $20.33 (7.5 * $2.71)
   - descuentoAutomatico: $1.36 (0.5 * $2.71)

2. Usuario justifica:
   - Motivo: "Cita médica"
   - Decide descontar solo: $0.50
   - Sistema calcula ajuste: $1.36 - $0.50 = $0.86

3. Resultado final:
   - Monto base: $20.33
   - Ajuste recuperado: +$0.86
   - Total día: $21.19
```

## Cambios en la Base de Datos

### Schema Prisma
```prisma
model Asistencia {
  // ... campos existentes ...
  justificada                  Boolean  @default(false)
  motivoJustificacion          String?
  montoAjustePorJustificacion  Decimal? @db.Decimal(10, 2)  // NUEVO
}
```

### Migración
- Archivo: `20260127204719_add_monto_ajuste_justificacion`
- Se eliminó el campo anterior `montoDescuentoJustificado`
- Se agregó el nuevo campo `montoAjustePorJustificacion`

## Cambios en el Backend

### API `/api/asistencias` (PATCH)
Endpoint para guardar justificaciones:

```typescript
PATCH /api/asistencias
Body: {
  asistenciaId: string,
  motivoJustificacion: string,
  montoAjustePorJustificacion: number
}
```

Validaciones:
- `motivoJustificacion` es obligatorio
- `montoAjustePorJustificacion` debe ser >= 0
- Actualiza: `justificada = true`

### API `/api/pagos/preview` (GET)
Actualizada para sumar ajustes:

```typescript
let totalAjustesPorJustificaciones = new Decimal(0);
asistencias.forEach((asist) => {
  if (asist.montoAjustePorJustificacion) {
    totalAjustesPorJustificaciones = totalAjustesPorJustificaciones.add(
      asist.montoAjustePorJustificacion
    );
  }
});

montoBase = sueldoTrabajado.add(totalAjustesPorJustificaciones);
```

Response incluye: `totalAjustesPorJustificaciones`

## Cambios en el Frontend

### Estados Agregados
```typescript
const [showModalJustificacion, setShowModalJustificacion] = useState(false);
const [asistenciaJustificar, setAsistenciaJustificar] = useState<any>(null);
const [justificacionForm, setJustificacionForm] = useState({
  montoDescuentoFinal: "",
  motivoJustificacion: "",
});
```

### Funciones Implementadas

#### `abrirModalJustificacion(asistencia)`
1. Calcula el descuento automático
2. Pre-llena el formulario con ese valor
3. Abre el modal

#### `guardarJustificacion()`
1. Valida datos (motivo obligatorio, monto válido)
2. Calcula el ajuste (recuperación)
3. Llama a la API PATCH
4. Recarga el preview actualizado

### Modal "Detalle de Asistencias" Reestructurado

Para trabajadores FIJOS ahora muestra:
- Horas trabajadas
- Monto base ganado
- **Descuento automático** (si existe)
- **Botón "Justificar"** (si no está justificada)
- **Monto recuperado** (si está justificada)
- **Descuento aplicado** (si está justificada)
- **Motivo de justificación** (si está justificada)
- **Monto total del día**

### Modal "Justificar Asistencia" (NUEVO)

Componentes:
1. **Información de la asistencia**:
   - Fecha
   - Horas trabajadas
   - Monto ganado
   - Descuento automático

2. **Input editable**:
   - Monto de descuento final
   - Default = descuento automático
   - Usuario puede reducirlo o ponerlo en $0

3. **Preview del cálculo**:
   - Muestra descuento automático
   - Muestra descuento aplicado
   - Muestra monto recuperado

4. **Motivo (obligatorio)**:
   - Textarea para explicar la justificación

5. **Botones**:
   - Cancelar
   - Guardar Justificación

### Resumen Financiero Actualizado

Ahora muestra:
```
Sueldo trabajado: $XXX.XX
Ajustes por justificaciones: +$XX.XX  [NUEVO - solo si existe]
Multas: -$XX.XX
Bonificación: +$XX.XX
...
TOTAL A PAGAR: $XXX.XX
```

## Flujo de Usuario Completo

1. **Generar Preview de Nómina**:
   - Usuario selecciona trabajador FIJO y período
   - Click en "Ver Preview"
   - Sistema muestra resumen con sueldo calculado

2. **Ver Detalle de Asistencias**:
   - Click en "VER" en sueldo trabajado
   - Se abre modal con lista de días trabajados
   - Días con atraso/falta muestran descuento y botón "Justificar"

3. **Justificar un Día**:
   - Click en "Justificar" de una asistencia
   - Se abre modal con información del día
   - Usuario edita monto de descuento final
   - Puede perdonar parcial o totalmente
   - Escribe motivo obligatorio
   - Click en "Guardar Justificación"

4. **Verificar Cambios**:
   - Modal de detalle se actualiza automáticamente
   - Muestra monto recuperado y motivo
   - Resumen financiero muestra el ajuste total
   - Total a pagar se incrementa

5. **Generar Nómina Definitiva**:
   - Verificar todos los valores
   - Click en "Generar Nómina"
   - Sistema crea el pago con montos ajustados

## Datos Históricos Preservados

El sistema mantiene histórico completo:
- `montoCalculado`: Monto original (con descuento automático)
- `montoAjustePorJustificacion`: Monto recuperado por justificación
- `motivoJustificacion`: Razón de la justificación
- `justificada`: Boolean que marca si fue procesada

Esto permite:
- Auditorías posteriores
- Reportes de justificaciones
- Análisis de patrones
- Transparencia total

## Testing Manual Recomendado

1. **Caso 1: Atraso de 30 minutos**
   - Crear asistencia con 7.5 horas trabajadas
   - Verificar descuento automático
   - Justificar con descuento parcial ($0.50)
   - Verificar ajuste correcto

2. **Caso 2: Falta completa**
   - Crear asistencia con 0 horas trabajadas
   - Verificar descuento = jornada completa
   - Justificar perdonando todo ($0)
   - Verificar recuperación total

3. **Caso 3: Trabajador eventual**
   - Verificar que NO aparece sistema de justificaciones
   - Solo muestra desglose de horas

4. **Caso 4: Múltiples justificaciones**
   - Justificar varios días del mismo período
   - Verificar que suma total de ajustes es correcta
   - Generar nómina y verificar BD

## Archivos Modificados

1. `/prisma/schema.prisma`
2. `/prisma/migrations/20260127204719_add_monto_ajuste_justificacion/migration.sql`
3. `/src/app/api/asistencias/route.ts`
4. `/src/app/api/pagos/preview/route.ts`
5. `/src/app/finanzas/page.tsx`

## Próximas Mejoras Sugeridas

- [ ] Reportes de justificaciones por trabajador
- [ ] Límite máximo de justificaciones por período
- [ ] Notificaciones cuando se justifica
- [ ] Exportar histórico de justificaciones
- [ ] Dashboard de análisis de atrasos
