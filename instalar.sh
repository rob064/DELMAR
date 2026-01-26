#!/bin/bash

# 🚀 Script de Instalación Automática - DELMAR
# Este script configura todo automáticamente

echo "🎯 =============================================="
echo "   INSTALACIÓN AUTOMÁTICA - SISTEMA DELMAR"
echo "=============================================="
echo ""

# Colores para mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado."
    echo "   Instálalo desde: https://nodejs.org"
    exit 1
fi

log_success "Node.js detectado: $(node --version)"
echo ""

# Paso 1: Verificar que existe .env
log_info "Verificando archivo .env..."
if [ ! -f ".env" ]; then
    log_warning ".env no existe, creándolo desde .env.example..."
    cp .env.example .env
    log_success "Archivo .env creado"
    echo ""
    log_warning "⚠️  IMPORTANTE: Edita el archivo .env y configura:"
    echo "   1. DATABASE_URL (tu connection string de Neon)"
    echo "   2. NEXTAUTH_SECRET (genera uno con: openssl rand -base64 32)"
    echo ""
    read -p "¿Ya configuraste el archivo .env? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Por favor configura .env y vuelve a ejecutar este script."
        exit 1
    fi
else
    log_success "Archivo .env encontrado"
fi
echo ""

# Paso 2: Instalar dependencias
log_info "Instalando dependencias de npm..."
npm install
if [ $? -eq 0 ]; then
    log_success "Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi
echo ""

# Paso 3: Generar cliente de Prisma
log_info "Generando cliente de Prisma..."
npm run prisma:generate
if [ $? -eq 0 ]; then
    log_success "Cliente de Prisma generado"
else
    echo "❌ Error al generar cliente de Prisma"
    exit 1
fi
echo ""

# Paso 4: Sincronizar esquema con la base de datos
log_info "Sincronizando esquema con la base de datos..."
npm run prisma:push
if [ $? -eq 0 ]; then
    log_success "Esquema sincronizado con la base de datos"
else
    echo "❌ Error al sincronizar esquema"
    exit 1
fi
echo ""

# Paso 5: Poblar base de datos con datos de ejemplo
log_info "Poblando base de datos con datos de ejemplo..."
npm run prisma:seed
if [ $? -eq 0 ]; then
    log_success "Base de datos poblada con datos de ejemplo"
else
    log_warning "Advertencia al poblar la base de datos (puede que ya tenga datos)"
fi
echo ""

# Resumen final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ${GREEN}¡INSTALACIÓN COMPLETADA EXITOSAMENTE!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Credenciales de Acceso:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👤 Administrador:"
echo "   Email:    admin@delmar.com"
echo "   Password: admin123"
echo ""
echo "🚪 Control de Puerta:"
echo "   Email:    puerta@delmar.com"
echo "   Password: puerta123"
echo ""
echo "📦 Producción:"
echo "   Email:    produccion@delmar.com"
echo "   Password: produccion123"
echo ""
echo "💰 Finanzas:"
echo "   Email:    finanzas@delmar.com"
echo "   Password: finanzas123"
echo ""
echo "👷 Trabajador de prueba:"
echo "   Email:    juan.perez@delmar.com"
echo "   Password: 123456"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Para iniciar el servidor de desarrollo:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "🌐 Luego abre tu navegador en:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Preguntar si quiere iniciar el servidor
read -p "¿Deseas iniciar el servidor de desarrollo ahora? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    log_info "Iniciando servidor de desarrollo..."
    echo ""
    npm run dev
fi
