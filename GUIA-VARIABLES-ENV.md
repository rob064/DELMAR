# 📋 GUÍA COMPLETA: OBTENER VARIABLES DE ENTORNO

Esta guía te ayudará a obtener TODAS las variables necesarias paso a paso.

---

## ✅ 1. BASE DE DATOS (NEON) - Ya lo tienes!

**Estado**: ✅ **COMPLETADO** - Ya tienes tu DATABASE_URL en el archivo .env.example

```
DATABASE_URL="postgresql://neondb_owner:npg_i4vUobHm3aJA@ep-falling-scene-ahlfo5uk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

✅ **No necesitas hacer nada más aquí!**

---

## 🔐 2. NEXTAUTH_SECRET (Seguridad de Sesiones)

### ¿Qué es?
Es una clave secreta que NextAuth usa para encriptar las sesiones de usuario. Debe ser única y segura.

### ¿Cómo obtenerlo?

**Opción 1: Generar Automáticamente (RECOMENDADA)**

Ejecuta este comando en tu terminal:

```bash
openssl rand -base64 32
```

Te dará algo como:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4
```

**Opción 2: Generador Online**

Si no funciona el comando, ve a:
- https://generate-secret.vercel.app/32

Copia el texto que aparece.

**⚠️ IMPORTANTE**: 
- Usa un secret DIFERENTE para desarrollo y producción
- NUNCA compartas este secret públicamente
- NUNCA lo subas a GitHub

---

## 🌐 3. NEXTAUTH_URL (URL de tu Aplicación)

### Para Desarrollo Local (AHORA)
```
NEXTAUTH_URL="http://localhost:3000"
```
✅ **Ya está configurado correctamente**

### Para Producción (DESPUÉS DE DESPLEGAR)
Cuando despliegues en Vercel, cambiarás esto a:
```
NEXTAUTH_URL="https://tu-app-nombre.vercel.app"
```

**No te preocupes por esto ahora**, lo configuraremos cuando despleguemos.

---

## 🚀 4. VERCEL (Despliegue en la Nube)

### ¿Qué es Vercel?
Es una plataforma que aloja tu aplicación gratis en internet, perfecta para Next.js.

### Paso a Paso para Obtener Cuenta:

1. **Crear Cuenta en Vercel**
   - Ve a: https://vercel.com/signup
   - Haz clic en "Continue with GitHub" (o email si prefieres)
   - Autoriza el acceso

2. **Conectar con GitHub**
   - Si usaste GitHub para registrarte, ya está conectado ✅
   - Si no, ve a Settings → Connected Git Accounts

3. **Instalar Vercel CLI (Opcional pero útil)**
   ```bash
   npm install -g vercel
   vercel login
   ```

**No necesitas "obtener" datos de Vercel ahora**. Los usaremos cuando despleguemos.

---

## 🔧 5. VARIABLES OPCIONALES (No las necesitas AHORA)

Estas son para funcionalidades futuras:

### GitHub Token (Solo si quieres integración avanzada con GitHub)
- Ve a: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Selecciona permisos según necesites
- Copia el token generado

### Email (SMTP) - Para enviar notificaciones
Si quieres enviar emails automáticos:
- Gmail: https://myaccount.google.com/apppasswords
- O usa servicios como SendGrid, Resend

### Cloudinary - Para subir imágenes de perfil
- Regístrate en: https://cloudinary.com
- En Dashboard, copia: Cloud Name, API Key, API Secret

---

## 📝 RESUMEN: Lo que NECESITAS AHORA

Para empezar a trabajar, solo necesitas 3 cosas:

1. ✅ **DATABASE_URL** - Ya lo tienes
2. ⚠️ **NEXTAUTH_SECRET** - Genera uno con el comando de arriba
3. ✅ **NEXTAUTH_URL** - Ya está configurado para desarrollo local

---

## 🎯 PRÓXIMOS PASOS

### Paso 1: Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Paso 2: Crear archivo .env

Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

### Paso 3: Editar .env

Abre el archivo `.env` y:
1. Pega tu NEXTAUTH_SECRET que acabas de generar
2. Verifica que DATABASE_URL esté correcto
3. Guarda el archivo

### Paso 4: Instalar y Ejecutar

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npm run prisma:generate
npm run prisma:push
npm run prisma:seed

# Ejecutar el proyecto
npm run dev
```

### Paso 5: Probar

Abre http://localhost:3000 y login con:
- Email: `admin@delmar.com`
- Password: `admin123`

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Necesito todos los datos del .env.example?**
R: NO. Solo necesitas DATABASE_URL, NEXTAUTH_SECRET y NEXTAUTH_URL para empezar.

**P: ¿Qué hago si no tengo openssl?**
R: Usa https://generate-secret.vercel.app/32 para generar el secret.

**P: ¿Cuándo configuro las variables de Vercel?**
R: Cuando despliegues. Por ahora trabaja en local.

**P: ¿El .env se sube a GitHub?**
R: ¡NO! Está en .gitignore. Solo sube .env.example (sin datos reales).

**P: ¿Necesito GitHub Token?**
R: No es necesario para este proyecto. Es opcional.

---

## 🆘 ¿PROBLEMAS?

Si algo no funciona:
1. Verifica que copiaste bien el DATABASE_URL (sin espacios extra)
2. Asegúrate que el NEXTAUTH_SECRET tenga al menos 32 caracteres
3. Verifica que instalaste las dependencias: `npm install`
4. Revisa que el archivo se llame `.env` (con punto al inicio)

---

## ✅ CHECKLIST FINAL

Antes de continuar, verifica:

- [ ] Generé mi NEXTAUTH_SECRET
- [ ] Creé el archivo .env (copiando .env.example)
- [ ] Pegué mi NEXTAUTH_SECRET en .env
- [ ] Verifiqué que DATABASE_URL esté correcto
- [ ] Ejecuté npm install
- [ ] Ejecuté npm run prisma:generate
- [ ] Ejecuté npm run prisma:push
- [ ] Ejecuté npm run prisma:seed

Si marcaste todos, ejecuta:
```bash
npm run dev
```

¡Y listo! 🎉
