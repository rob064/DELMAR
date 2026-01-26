# Sistema de Control de Personal - DELMAR

Sistema integral de gestión de personal para empresa pesquera, desarrollado con Next.js, PostgreSQL y desplegado en Vercel.

---

## 📚 GUÍAS DE INICIO RÁPIDO

### 🎯 ¿Nuevo en esto? EMPIEZA AQUÍ:
- **[EMPEZAR-AQUI.md](EMPEZAR-AQUI.md)** - Guía super simple para principiantes

### 📋 Guías Detalladas:
- **[GUIA-VARIABLES-ENV.md](GUIA-VARIABLES-ENV.md)** - Cómo obtener todas las variables de entorno
- **[DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)** - Guía completa para publicar en internet
- **[INICIO-RAPIDO.md](INICIO-RAPIDO.md)** - Instalación y configuración detallada

### 🚀 Instalación Automática:
```bash
# Linux/Mac
./instalar.sh

# Windows
instalar.bat
```

---

## 🚀 Características

### Módulos Principales

1. **Control de Puerta** - Registro de asistencias
   - Registro de entrada y salida de personal
   - Cálculo automático de tardanzas
   - Justificación de ausencias
   - Historial de asistencias

2. **Gestión de Producción** - Control de actividades
   - Creación y gestión de actividades
   - Registro de producción diaria
   - Pago por hora o por producción
   - Metas y cuotas de producción

3. **Gestión Financiera** - Nómina y transacciones
   - Registro de adelantos y multas
   - Generación automática de nómina semanal
   - Cálculo de descuentos
   - Historial de pagos

4. **Panel de Trabajadores** - Vista personal
   - Consulta de asistencias
   - Historial de producción
   - Visualización de pagos

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Neon (PostgreSQL cloud)
- Cuenta en Vercel (para deployment)

## 🛠️ Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/rob064/DELMAR.git
cd DELMAR
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` y completa:

- `DATABASE_URL`: Connection string de Neon PostgreSQL
- `NEXTAUTH_SECRET`: Genera uno con `openssl rand -base64 32`
- `NEXTAUTH_URL`: `http://localhost:3000` para desarrollo local

4. **Configurar la base de datos**

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Crear las tablas en la base de datos
npm run prisma:push

# Poblar la base de datos con datos de ejemplo
npx prisma db seed
```

5. **Ejecutar en modo desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Base de Datos (Neon PostgreSQL)

### Configuración de Neon

1. Crea una cuenta en https://neon.tech
2. Crea un nuevo proyecto
3. Copia el connection string (formato: `postgresql://...`)
4. Pégalo en la variable `DATABASE_URL` del archivo `.env`

### Esquema de Base de Datos

El sistema incluye las siguientes tablas principales:

- `usuarios` - Autenticación y roles (5 roles: ADMIN, PUERTA, PRODUCCION, FINANZAS, TRABAJADOR)
- `trabajadores` - Datos personales del personal (sin horarios fijos ni salarios)
- `asistencias` - Registro de entrada/salida con **turno programado del día** (08:00-16:00, 16:00-24:00, etc.)
- `actividades` - Catálogo con **código, tipo de pago (POR_HORA/POR_PRODUCCION) y valor** (el salario está en la actividad, no en el trabajador)
- `produccion_diaria` - Asignación de actividades con cálculo automático de salario según la actividad
- `transacciones` - Adelantos, multas, ajustes
- `pagos` - Nómina semanal con descuentos automáticos

**Concepto clave**: Un trabajador puede trabajar diferentes turnos y actividades cada día. El salario se calcula según la actividad asignada (POR_HORA o POR_PRODUCCION), no por un salario fijo del trabajador.

## 🚀 Despliegue en Vercel

### Opción 1: Despliegue desde GitHub

1. Sube tu código a GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Ve a https://vercel.com
3. Haz clic en "Import Project"
4. Selecciona tu repositorio de GitHub
5. Configura las variables de entorno:
   - `DATABASE_URL`: Tu connection string de Neon
   - `NEXTAUTH_SECRET`: Un string aleatorio seguro
   - `NEXTAUTH_URL`: https://tu-dominio.vercel.app

6. Haz clic en "Deploy"

### Opción 2: Despliegue con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar sesión
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

### Configurar Variables de Entorno en Vercel

1. Ve al dashboard de tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las siguientes variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

4. Redeploy el proyecto

## 👥 Usuarios por Defecto

Después de ejecutar el seed, tendrás estos usuarios de prueba:

| Rol | Email | Password |
|-----|-------|----------|
| Administrador | admin@delmar.com | admin123 |
| Puerta | puerta@delmar.com | puerta123 |
| Producción | produccion@delmar.com | produccion123 |
| Finanzas | finanzas@delmar.com | finanzas123 |
| Trabajador | juan.perez@delmar.com | 123456 |

## 📱 Uso del Sistema

### Flujo de Trabajo Típico

1. **Inicio del día (Control de Puerta)**
   - Registrar entrada de trabajadores
   - Sistema calcula automáticamente tardanzas

2. **Durante el día (Producción)**
   - Asignar actividades a trabajadores
   - Registrar producción (horas o unidades)

3. **Fin de semana (Finanzas)**
   - Registrar adelantos/multas si es necesario
   - Generar nómina semanal para cada trabajador
   - Marcar pagos como completados

4. **Trabajadores**
   - Consultar su propia asistencia
   - Ver su producción
   - Revisar historial de pagos

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run start        # Ejecutar build de producción
npm run lint         # Linter
npm run prisma:generate   # Generar cliente Prisma
npm run prisma:migrate    # Crear migración
npm run prisma:studio     # Abrir Prisma Studio (GUI)
npm run prisma:push       # Push schema a BD
```

## 📊 Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **Deployment**: Vercel

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Sesiones seguras con NextAuth
- Validación de roles en cada endpoint
- Variables de entorno para datos sensibles

## 🤝 Soporte

Para preguntas o problemas:
- Crea un issue en GitHub
- Contacta al desarrollador

## 📝 Licencia

Este proyecto es propiedad de DELMAR.

---

Desarrollado con ❤️ para DELMAR
