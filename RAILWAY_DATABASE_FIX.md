# Fix: Errores de conexión PostgreSQL en Railway

## Variables de entorno en Railway

Ve a tu servicio en Railway → Variables y configura:

### 1. DATABASE_URL (actualizada)
```
postgresql://neondb_owner:npg_i4vUobHm3aJA@ep-falling-scene-ahlfo5uk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=30&pgbouncer=true
```

**Cambios realizados:**
- ❌ Removido `channel_binding=require` (causa problemas en Railway)
- ✅ Agregado `connect_timeout=15` (timeout de conexión)
- ✅ Agregado `pool_timeout=30` (timeout del pool)
- ✅ Agregado `pgbouncer=true` (compatibilidad con pooler de Neon)

### 2. NEXTAUTH_URL
```
https://delmar-production.up.railway.app
```
Reemplaza con tu URL real de Railway

### 3. NEXTAUTH_SECRET (mantener el mismo)
```
hqmqnO+op3Kk1hl1GlCfQttyv3RnNUmbQq8+JkLcx/o=
```

### 4. Variables adicionales
```
TZ=America/Guayaquil
NEXT_PUBLIC_COMPANY_NAME=DELMAR
```

---

## Verificar estado de Neon

1. Ve a tu dashboard de Neon: https://console.neon.tech
2. Verifica que el proyecto esté **ACTIVE** (no pausado)
3. Si está pausado, actívalo clickeando en el proyecto

### Plan gratuito de Neon:
- Se pausa después de 7 días de inactividad
- Límite: 1 proyecto, 10 branches, 3GB de almacenamiento

---

## Alternativa: Usar DATABASE_URL directo (sin pooler)

Si el pooler sigue dando problemas, usa la conexión directa:

```
postgresql://neondb_owner:npg_i4vUobHm3aJA@ep-falling-scene-ahlfo5uk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Nota:** La conexión directa tiene menos límites de conexiones concurrentes (mejor para pooler).

---

## Actualizar schema.prisma

Asegúrate de tener estas configuraciones en `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Opcional: para migraciones
  relationMode = "prisma" // Opcional: si usas PlanetScale o similar
}
```

---

## Troubleshooting adicional

### Si sigue fallando:

1. **Revisa los logs de Railway:**
   ```
   railway logs
   ```

2. **Prueba la conexión localmente:**
   ```bash
   npx prisma db push
   ```

3. **Verifica las IPs permitidas en Neon:**
   - Neon permite todas las IPs por defecto
   - Railway usa IPs dinámicas (no problema)

4. **Considera migrar la DB a Railway:**
   ```bash
   railway add postgresql
   ```
   - Railway provee PostgreSQL nativo
   - Más integrado y estable
   - $5/mes en plan Hobby

---

## Después de actualizar variables:

1. Las variables se aplican automáticamente
2. Railway hará un nuevo deployment
3. Espera 2-3 minutos para que termine

## Comando para verificar conexión:

En Railway, después del deploy, verifica los logs:
- ✅ Debería aparecer: "Ready in XXXms" sin errores de Prisma
- ❌ Si sigue error: el problema está en Neon (pausado o credential inválido)
