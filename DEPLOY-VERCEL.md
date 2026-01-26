# 🚀 GUÍA: DESPLEGAR EN VERCEL (Ponerlo en Internet)

Esta guía te llevará paso a paso para tener tu sistema DELMAR en internet, gratis.

---

## 📋 REQUISITOS PREVIOS

Antes de empezar, asegúrate de tener:

- ✅ El sistema funcionando en local (`npm run dev`)
- ✅ Una cuenta en GitHub (https://github.com)
- ✅ Git instalado (verifica con: `git --version`)

---

## PASO 1: CREAR REPOSITORIO EN GITHUB

### 1.1 Crear el repositorio en GitHub.com

1. Ve a https://github.com/new
2. Llena los datos:
   - **Repository name:** `DELMAR`
   - **Description:** `Sistema de Control de Personal`
   - **Visibilidad:** Elige "Private" (recomendado)
   - **NO marques:** Initialize repository
3. Click "Create repository"

### 1.2 Conectar tu proyecto con GitHub

En tu terminal, dentro de la carpeta del proyecto:

```bash
# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Sistema DELMAR - Primera versión"

# Conectar con GitHub (CAMBIA 'rob064' por tu usuario)
git remote add origin https://github.com/rob064/DELMAR.git

# Renombrar la rama a main
git branch -M main

# Subir el código
git push -u origin main
```

**⚠️ IMPORTANTE:** El archivo `.env` NO se subirá (está en .gitignore). Eso es correcto y seguro.

---

## PASO 2: CREAR CUENTA EN VERCEL

1. Ve a https://vercel.com/signup
2. Click en **"Continue with GitHub"**
3. Autoriza a Vercel para acceder a tus repositorios
4. ¡Listo! Ya tienes cuenta en Vercel

---

## PASO 3: DESPLEGAR EL PROYECTO

### 3.1 Importar el Proyecto

1. En Vercel, click en **"Add New"** → **"Project"**
2. Busca tu repositorio **"DELMAR"**
3. Click en **"Import"**

### 3.2 Configurar el Proyecto

En la página de configuración:

1. **Framework Preset:** Next.js (se detecta automáticamente)
2. **Root Directory:** ./  (dejar por defecto)
3. **Build Command:** `npm run build` (dejar por defecto)

### 3.3 Agregar Variables de Entorno

Esta es la parte MÁS IMPORTANTE. Click en **"Environment Variables"** y agrega:

#### Variable 1: DATABASE_URL
```
Key: DATABASE_URL
Value: (copia EXACTAMENTE lo que está en tu archivo .env local)
```
Ejemplo:
```
postgresql://neondb_owner:npg_i4vUobHm3aJA@ep-falling-scene-ahlfo5uk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### Variable 2: NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: (copia EXACTAMENTE lo que está en tu archivo .env local)
```
Ejemplo:
```
hqmqnO+op3Kk1hl1GlCfQttyv3RnNUmbQq8+JkLcx/o=
```

#### Variable 3: NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://delmar.vercel.app
```
**⚠️ IMPORTANTE:** Este valor lo cambiaremos después. Por ahora usa `https://delmar.vercel.app`

### 3.4 Desplegar

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. ¡Se desplegará tu aplicación!

---

## PASO 4: ACTUALIZAR NEXTAUTH_URL

Después del deploy:

1. Vercel te mostrará tu URL final, algo como:
   ```
   https://delmar-abc123.vercel.app
   ```

2. Copia esa URL COMPLETA

3. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

4. Busca **NEXTAUTH_URL** y click en los 3 puntos → **Edit**

5. Cambia el valor a tu URL real:
   ```
   https://delmar-abc123.vercel.app
   ```

6. Guarda y haz **Redeploy**:
   - Ve a **Deployments**
   - Click en los 3 puntos del último deployment
   - Click "Redeploy"

---

## PASO 5: POBLAR LA BASE DE DATOS

Tu aplicación está en línea, pero la base de datos está vacía. Tienes 2 opciones:

### Opción A: Desde tu Computadora (Recomendado)

```bash
# En tu terminal, ejecuta:
npm run prisma:seed
```

Como ya tienes el DATABASE_URL configurado en tu `.env`, esto poblará la base de datos de producción.

### Opción B: Desde Prisma Studio

```bash
npx prisma studio
```

Abre el navegador y crea manualmente los usuarios.

---

## PASO 6: PROBAR LA APLICACIÓN

1. Abre tu URL de Vercel en el navegador
2. Deberías ver la pantalla de login
3. Entra con:
   - Email: `admin@delmar.com`
   - Password: `admin123`

4. ¡Si funciona, felicidades! 🎉

---

## 🔄 CÓMO ACTUALIZAR LA APLICACIÓN

Cuando hagas cambios en tu código:

```bash
# 1. Guardar cambios
git add .
git commit -m "Descripción de los cambios"

# 2. Subir a GitHub
git push

# 3. Vercel detectará automáticamente y desplegará
```

¡Es automático! Cada vez que hagas `git push`, Vercel actualiza tu app.

---

## 🌐 CONFIGURAR DOMINIO PERSONALIZADO (Opcional)

Si tienes un dominio propio (ej: delmar.com):

1. En Vercel → tu proyecto → **Settings** → **Domains**
2. Click "Add Domain"
3. Escribe tu dominio: `delmar.com`
4. Sigue las instrucciones para configurar DNS
5. Actualiza NEXTAUTH_URL a tu nuevo dominio

---

## ⚙️ VARIABLES DE ENTORNO EN VERCEL

Para ver o editar variables:

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Aquí puedes:
   - Ver variables (valores ocultos por seguridad)
   - Editar variables existentes
   - Agregar nuevas variables

**Después de cambiar variables, debes hacer Redeploy.**

---

## 🔒 SEGURIDAD EN PRODUCCIÓN

### ⚠️ MUY IMPORTANTE:

1. **Cambia todas las contraseñas por defecto:**
   - No uses `admin123` en producción
   - Crea contraseñas seguras

2. **No compartas tus variables de entorno:**
   - Nunca subas el archivo `.env` a GitHub
   - No compartas tu NEXTAUTH_SECRET

3. **Configura alertas en Neon:**
   - Ve a tu dashboard de Neon
   - Configura alertas de uso

4. **Backups:**
   - Neon hace backups automáticos
   - Considera exportar datos importantes manualmente

---

## 📊 MONITOREO

### Ver Logs en Vercel:

1. Ve a tu proyecto → **Deployments**
2. Click en el deployment activo
3. Ve a la pestaña **Logs** para ver errores

### Ver Base de Datos:

1. Ve a Neon Console: https://console.neon.tech
2. Selecciona tu proyecto DELMAR
3. Ve a **Tables** para ver los datos

---

## 🆘 PROBLEMAS COMUNES

### Error: "No se puede conectar a la base de datos"
**Solución:**
- Verifica que DATABASE_URL esté correcto en Vercel
- Asegúrate que no tenga espacios al inicio/final
- Verifica que termine en `?sslmode=require`

### Error: "NextAuth configuration error"
**Solución:**
- Verifica que NEXTAUTH_URL sea tu URL de Vercel
- Debe empezar con `https://`
- No debe terminar en `/`

### Error: "Invalid credentials"
**Solución:**
- Asegúrate de haber ejecutado el seed
- Verifica que NEXTAUTH_SECRET sea el mismo que usaste en local

### La página está en blanco
**Solución:**
1. Ve a Vercel → Deployments → Logs
2. Busca errores en rojo
3. El error más común es variables de entorno mal configuradas

---

## ✅ CHECKLIST DE DESPLIEGUE

Antes de considerar tu deploy completo:

- [ ] El código está en GitHub
- [ ] El proyecto está desplegado en Vercel
- [ ] Las 3 variables de entorno están configuradas
- [ ] NEXTAUTH_URL apunta a mi URL de Vercel
- [ ] La base de datos está poblada con datos
- [ ] Puedo hacer login
- [ ] Probé cada módulo (Puerta, Producción, Finanzas)
- [ ] Cambié las contraseñas por defecto

---

## 🎯 RESULTADO FINAL

Si todo salió bien, ahora tienes:

✅ Tu aplicación en internet, accesible 24/7
✅ URL pública para compartir
✅ Actualizaciones automáticas con git push
✅ HTTPS seguro (gratis)
✅ Base de datos en la nube (Neon)
✅ Hosting gratis (Vercel)

**¡Tu sistema está LISTO para producción!** 🎉

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa los logs en Vercel
2. Verifica las variables de entorno
3. Lee la sección de problemas comunes
4. Consulta la documentación de Vercel: https://vercel.com/docs

---

## 📝 NOTAS IMPORTANTES

- **Vercel Free Plan:** Soporta hasta 100GB de bandwidth/mes (más que suficiente)
- **Neon Free Plan:** Hasta 10 GB de almacenamiento
- **Ambos son GRATIS** para siempre si no excedes los límites
- Si creces, puedes actualizar a planes de pago

---

**¿Listo para desplegar?** 

Comienza con el Paso 1: Crear repositorio en GitHub ⬆️
