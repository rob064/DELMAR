# 🚀 GUÍA DE INICIO RÁPIDO - DELMAR

## Pasos para Poner en Marcha el Sistema

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Base de Datos en Neon

1. Ve a https://console.neon.tech
2. Crea un nuevo proyecto llamado "DELMAR"
3. Copia el **Connection String** (aparece al crear el proyecto)
4. Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

5. Edita `.env` y pega tu connection string:

```env
DATABASE_URL="postgresql://usuario:password@ep-xxx.region.aws.neon.tech/delmar?sslmode=require"
NEXTAUTH_SECRET="genera-un-secret-aleatorio-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

**Generar NEXTAUTH_SECRET** (en terminal):
```bash
openssl rand -base64 32
```

### 3. Inicializar Base de Datos

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Crear las tablas
npm run prisma:push

# Poblar con datos de ejemplo
npm run prisma:seed
```

Verás un mensaje con las credenciales de acceso:
```
📝 Credenciales de acceso:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Administrador:
   Email: admin@delmar.com
   Password: admin123
...
```

### 4. Ejecutar el Proyecto

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### 5. Primer Login

1. Usa las credenciales del administrador:
   - Email: `admin@delmar.com`
   - Password: `admin123`

2. Explora el dashboard y los diferentes módulos.

---

## 📦 Desplegar en Vercel (Producción)

### Opción A: Desde GitHub (Recomendada)

1. **Sube tu código a GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/rob064/DELMAR.git
git push -u origin main
```

2. **Conecta con Vercel**:
   - Ve a https://vercel.com/new
   - Importa tu repositorio de GitHub
   - Configura las variables de entorno en Vercel:
     - `DATABASE_URL`: Tu connection string de Neon
     - `NEXTAUTH_SECRET`: El mismo que usaste en local
     - `NEXTAUTH_URL`: `https://tu-app.vercel.app` (lo obtienes después del deploy)

3. **Deploy**:
   - Haz clic en "Deploy"
   - Espera a que termine
   - Actualiza `NEXTAUTH_URL` con tu URL de Vercel

4. **Poblar la BD de producción**:
```bash
# Conéctate a tu BD de producción y ejecuta el seed
DATABASE_URL="tu-production-db-url" npm run prisma:seed
```

### Opción B: Con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Cuando pregunte, configura:
# - Framework: Next.js
# - Build Command: npm run build
# - Output Directory: .next

# Deploy a producción
vercel --prod
```

---

## ✅ Verificación del Sistema

Prueba cada módulo:

1. **Control de Puerta** (`/puerta`)
   - Registra entrada de "Juan Pérez"
   - Verifica que aparece en la lista del día

2. **Producción** (`/produccion`)
   - Asigna actividad "Descarga de pescado" a un trabajador
   - Registra 8 horas trabajadas
   - Verifica el cálculo automático

3. **Finanzas** (`/finanzas`)
   - Registra un adelanto de S/ 100 para un trabajador
   - Genera nómina semanal
   - Verifica que el adelanto se descontó

4. **Panel Trabajador** (`/trabajador`)
   - Login con juan.perez@delmar.com / 123456
   - Verifica que vea sus datos

---

## 🆘 Solución de Problemas Comunes

### Error: "PrismaClient is unable to run in this browser environment"
**Solución**: Ejecuta `npm run prisma:generate`

### Error: "Invalid `prisma.xxx.findMany()` invocation"
**Solución**: Verifica que `DATABASE_URL` esté correctamente configurado en `.env`

### No puedo hacer login
**Solución**: 
1. Verifica que ejecutaste `npm run prisma:seed`
2. Revisa que `NEXTAUTH_SECRET` esté configurado
3. Reinicia el servidor de desarrollo

### Error al desplegar en Vercel
**Solución**:
1. Verifica que todas las variables de entorno estén configuradas en Vercel
2. Asegúrate que `NEXTAUTH_URL` apunte a tu dominio de Vercel
3. Revisa los logs de build en Vercel

---

## 📞 Contacto

Si tienes problemas, revisa el archivo `README.md` completo o contacta al desarrollador.

¡Éxito con tu sistema! 🎉
