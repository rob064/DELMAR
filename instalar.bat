@echo off
REM Script de Instalación Automática - DELMAR (Windows)

echo =============================================
echo    INSTALACION AUTOMATICA - SISTEMA DELMAR
echo =============================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo         Instalalo desde: https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js detectado
node --version
echo.

REM Verificar .env
if not exist ".env" (
    echo [AVISO] .env no existe, creandolo desde .env.example...
    copy .env.example .env
    echo [OK] Archivo .env creado
    echo.
    echo [IMPORTANTE] Edita el archivo .env y configura:
    echo   1. DATABASE_URL (tu connection string de Neon^)
    echo   2. NEXTAUTH_SECRET (genera uno con: openssl rand -base64 32^)
    echo.
    pause
)

echo [INFO] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error al instalar dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

echo [INFO] Generando cliente de Prisma...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo [ERROR] Error al generar cliente de Prisma
    pause
    exit /b 1
)
echo [OK] Cliente de Prisma generado
echo.

echo [INFO] Sincronizando esquema con la base de datos...
call npm run prisma:push
if %errorlevel% neq 0 (
    echo [ERROR] Error al sincronizar esquema
    pause
    exit /b 1
)
echo [OK] Esquema sincronizado
echo.

echo [INFO] Poblando base de datos con datos de ejemplo...
call npm run prisma:seed
echo [OK] Base de datos poblada
echo.

echo =============================================
echo    INSTALACION COMPLETADA EXITOSAMENTE!
echo =============================================
echo.
echo Credenciales de Acceso:
echo =============================================
echo.
echo Administrador:
echo   Email:    admin@delmar.com
echo   Password: admin123
echo.
echo Control de Puerta:
echo   Email:    puerta@delmar.com
echo   Password: puerta123
echo.
echo Produccion:
echo   Email:    produccion@delmar.com
echo   Password: produccion123
echo.
echo Finanzas:
echo   Email:    finanzas@delmar.com
echo   Password: finanzas123
echo.
echo Trabajador de prueba:
echo   Email:    juan.perez@delmar.com
echo   Password: 123456
echo.
echo =============================================
echo.
echo Para iniciar el servidor de desarrollo:
echo   npm run dev
echo.
echo Luego abre tu navegador en:
echo   http://localhost:3000
echo.
echo =============================================
echo.
pause
