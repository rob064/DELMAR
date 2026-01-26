# 🎯 CÓMO EMPEZAR - VERSIÓN SUPER SIMPLE

## ✅ YA HICE ESTO POR TI:

1. ✅ Creé el archivo `.env` con tus datos de Neon
2. ✅ Generé tu NEXTAUTH_SECRET de forma segura
3. ✅ Configuré todo el sistema

## 🚀 SOLO TIENES QUE HACER ESTO:

### OPCIÓN 1: Script Automático (MÁS FÁCIL) 🎉

Ejecuta UNO de estos comandos según tu sistema:

**En Linux/Mac:**
```bash
./instalar.sh
```

**En Windows:**
```bash
instalar.bat
```

El script hará TODO automáticamente:
- Instalar dependencias
- Configurar base de datos
- Poblar con datos de ejemplo
- Mostrarte las credenciales

---

### OPCIÓN 2: Manual (Paso a Paso)

Si prefieres hacerlo manual, ejecuta estos comandos UNO POR UNO:

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente de Prisma
npm run prisma:generate

# 3. Crear tablas en la base de datos
npm run prisma:push

# 4. Poblar con datos de ejemplo
npm run prisma:seed

# 5. Iniciar el servidor
npm run dev
```

---

## 🌐 ABRIR LA APLICACIÓN

Después de ejecutar, abre tu navegador en:
```
http://localhost:3000
```

## 🔑 CREDENCIALES DE ACCESO

**Administrador (acceso completo):**
- Email: `admin@delmar.com`
- Password: `admin123`

**Otros usuarios:**
- Puerta: `puerta@delmar.com` / `puerta123`
- Producción: `produccion@delmar.com` / `produccion123`
- Finanzas: `finanzas@delmar.com` / `finanzas123`
- Trabajador: `juan.perez@delmar.com` / `123456`

---

## ❓ SI ALGO NO FUNCIONA

### Error: "Cannot find module '@prisma/client'"
**Solución:**
```bash
npm run prisma:generate
```

### Error: "PrismaClient unable to run"
**Solución:**
```bash
npm install
npm run prisma:generate
```

### Error: "Invalid DATABASE_URL"
**Solución:** Abre el archivo `.env` y verifica que DATABASE_URL esté en una sola línea, sin saltos.

### El puerto 3000 está ocupado
**Solución:** Cambia el puerto:
```bash
PORT=3001 npm run dev
```
Luego abre: http://localhost:3001

---

## 📁 ARCHIVOS IMPORTANTES

- `.env` - TUS VARIABLES DE ENTORNO (¡NO LO COMPARTAS!)
- `.env.example` - Plantilla de ejemplo (este sí puedes compartir)
- `prisma/schema.prisma` - Estructura de tu base de datos
- `README.md` - Documentación completa
- `GUIA-VARIABLES-ENV.md` - Explicación detallada de variables

---

## 🎉 ¿TODO FUNCIONÓ?

Si ves la pantalla de login en http://localhost:3000:

1. **¡Felicidades!** ✅ El sistema está funcionando
2. Login con `admin@delmar.com` / `admin123`
3. Explora los diferentes módulos
4. Lee el archivo `README.md` para más información

---

## 🚀 SIGUIENTES PASOS

Una vez que funcione en local:

1. **Prueba todos los módulos** (Puerta, Producción, Finanzas)
2. **Lee la documentación** en README.md
3. **Cuando estés listo para internet**, lee `DEPLOY-VERCEL.md`

---

## 🆘 NECESITAS AYUDA

Si nada funciona, verifica:

1. ¿Instalaste Node.js? `node --version`
2. ¿Existe el archivo `.env`? `ls -la .env`
3. ¿Ejecutaste `npm install`?
4. ¿Tu internet funciona? (Neon necesita conexión)

---

**¿Listo?** Ejecuta:
```bash
./instalar.sh
```

(o `instalar.bat` en Windows)

¡Y comienza a usar tu sistema! 🎉
