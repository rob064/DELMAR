# 🚂 Deployment en Railway - DELMAR

## Pasos para Desplegar

### 1. Variables de Entorno en Railway

Configura las siguientes variables de entorno en tu proyecto de Railway:

```bash
# Base de datos (ya tienes Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_i4vUobHm3aJA@ep-falling-scene-ahlfo5uk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&options=-c%20timezone=America/Guayaquil"

# NextAuth
NEXTAUTH_SECRET="hqmqnO+op3Kk1hl1GlCfQttyv3RnNUmbQq8+JkLcx/o="
NEXTAUTH_URL="https://tu-app.up.railway.app"  # ⚠️ CAMBIAR POR TU URL DE RAILWAY

# Configuración
NEXT_PUBLIC_COMPANY_NAME="DELMAR"
TZ="America/Guayaquil"
```

### 2. Comandos de Build (ya configurados en railway.json)

El archivo `railway.json` ya está configurado con:
- **Build**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start**: `npm start`

### 3. Migraciones de Prisma

Las migraciones se aplicarán automáticamente durante el build con:
```bash
npx prisma migrate deploy
```

Esto incluye la migración más reciente:
- `20260127204719_add_monto_ajuste_justificacion`

### 4. Después del Deploy

1. Accede a tu app en Railway: `https://tu-app.up.railway.app`
2. Ejecuta el seed (opcional, para datos de prueba):
   ```bash
   # En el dashboard de Railway > Shell
   npm run prisma:seed
   ```
3. Credenciales de acceso (después del seed):
   - **Admin**: admin@delmar.com / 123456
   - **Puerta**: puerta@delmar.com / 123456
   - **Producción**: produccion@delmar.com / 123456
   - **Finanzas**: finanzas@delmar.com / 123456

## ⚠️ Importante

### Actualizar NEXTAUTH_URL
Después del primer deploy, Railway te dará una URL. **DEBES actualizar** la variable `NEXTAUTH_URL` con esa URL:

1. Ve a tu proyecto en Railway
2. Settings > Variables
3. Edita `NEXTAUTH_URL` a `https://tu-app.up.railway.app`
4. Redeploy (Railway lo hará automáticamente)

### Base de Datos
Ya estás usando Neon PostgreSQL (serverless), por lo que no necesitas crear una base de datos nueva en Railway. Solo asegúrate de que la variable `DATABASE_URL` esté configurada correctamente.

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a la rama `main`, Railway desplegará automáticamente los cambios.

## 📊 Verificar Migraciones

Para verificar que las migraciones se aplicaron correctamente:

```bash
# En Railway Shell
npx prisma migrate status
```

## 🐛 Troubleshooting

### Error de migraciones
Si hay problemas con las migraciones:
```bash
npx prisma migrate resolve --applied "20260127204719_add_monto_ajuste_justificacion"
npx prisma migrate deploy
```

### Error de autenticación
Verifica que `NEXTAUTH_URL` tenga el protocolo correcto (`https://`) y sin barra final.

### Logs
Revisa los logs en Railway > Deployments > View Logs
