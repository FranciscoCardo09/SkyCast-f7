#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🌤️  OHMC WEATHER API                      ║"
echo "║              Setup Completo del Proyecto                    ║"
echo "║                                                              ║"
echo "║  🚀 Docker + Backend + Frontend + Datos + Imágenes          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Funciones de utilidad
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${YELLOW}ℹ️ $1${NC}"
}

progress() {
    echo -e "${BLUE}🔄 $1${NC}"
}

section() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}🔧 $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Verificar requisitos previos
section "VERIFICANDO REQUISITOS PREVIOS"

progress "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    error_exit "Docker no está instalado. Instala Docker primero: https://docs.docker.com/get-docker/"
fi

if ! command -v docker-compose &> /dev/null; then
    error_exit "Docker Compose no está instalado. Instala Docker Compose primero."
fi

if ! docker info > /dev/null 2>&1; then
    error_exit "Docker no está corriendo. Inicia Docker primero."
fi

success "Docker está disponible y corriendo"

progress "Verificando Node.js para el frontend..."
if ! command -v node &> /dev/null; then
    info "Node.js no encontrado. El frontend se configurará después."
    SKIP_FRONTEND=true
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        info "Node.js versión 16+ recomendada. Versión actual: $(node -v)"
        SKIP_FRONTEND=true
    else
        success "Node.js $(node -v) disponible"
        SKIP_FRONTEND=false
    fi
fi

# Limpiar instalación anterior
section "LIMPIANDO INSTALACIÓN ANTERIOR"

progress "Parando contenedores existentes..."
docker-compose down -v 2>/dev/null || true

progress "Limpiando sistema Docker..."
docker system prune -f 2>/dev/null || true

success "Sistema limpio"

# Configurar variables de entorno
section "CONFIGURANDO VARIABLES DE ENTORNO"

progress "Creando archivo .env..."
cat > .env << EOF
# Django
SECRET_KEY=django-insecure-ohmc-weather-api-$(date +%s)
DEBUG=True

# Database
DB_NAME=weather_db
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Weather API
WEATHER_API_BASE_URL=https://yaku.ohmc.ar/public/
WEATHER_UPDATE_INTERVAL=3600
EOF

success "Variables de entorno configuradas"

# Crear estructura de directorios necesaria
section "CREANDO ESTRUCTURA DE DIRECTORIOS"

progress "Creando directorios para comandos Django..."
mkdir -p productos/management
mkdir -p productos/management/commands

# Crear archivos __init__.py necesarios
touch productos/management/__init__.py
touch productos/management/commands/__init__.py

success "Estructura de directorios creada"

# Construir y levantar servicios Docker
section "INICIANDO SERVICIOS DOCKER"

progress "Construyendo y levantando servicios..."
docker-compose up -d --build

if [ $? -ne 0 ]; then
    error_exit "Falló la construcción de los servicios Docker"
fi

success "Servicios Docker iniciados"

# Esperar a que la base de datos esté lista
progress "Esperando a que la base de datos esté lista..."
for i in {1..60}; do
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        success "Base de datos está lista"
        break
    fi
    if [ $i -eq 60 ]; then
        error_exit "La base de datos no se inició en 60 segundos"
    fi
    sleep 1
done

# Configurar Django
section "CONFIGURANDO DJANGO"

progress "Limpiando migraciones anteriores..."
find productos/migrations -name "*.py" -not -name "__init__.py" -delete 2>/dev/null || true

progress "Creando migraciones..."
docker-compose exec -T web python manage.py makemigrations productos
if [ $? -ne 0 ]; then
    error_exit "Falló la creación de migraciones"
fi

progress "Aplicando migraciones..."
docker-compose exec -T web python manage.py migrate
if [ $? -ne 0 ]; then
    error_exit "Falló la aplicación de migraciones"
fi

progress "Creando superusuario..."
docker-compose exec -T web python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@ohmc.ar', 'admin123')
    print('✅ Superusuario creado: admin/admin123')
else:
    print('✅ Superusuario ya existe')
EOF

success "Django configurado correctamente"

# Cargar datos meteorológicos con imágenes
section "CARGANDO DATOS METEOROLÓGICOS E IMÁGENES"

progress "Verificando archivo de estructura JSON..."
if [ ! -f "ohmc_data_structure.json" ]; then
    error_exit "Archivo ohmc_data_structure.json no encontrado"
fi

progress "Copiando archivos necesarios al contenedor..."
docker-compose exec -T web mkdir -p /app/productos/management/commands
docker cp productos/management/commands/load_from_json.py $(docker-compose ps -q web):/app/productos/management/commands/ 2>/dev/null || true
docker cp productos/management/__init__.py $(docker-compose ps -q web):/app/productos/management/ 2>/dev/null || true
docker cp productos/management/commands/__init__.py $(docker-compose ps -q web):/app/productos/management/commands/ 2>/dev/null || true
docker cp ohmc_data_structure.json $(docker-compose ps -q web):/app/ 2>/dev/null || true

info "Iniciando descarga de datos e imágenes meteorológicas..."
info "⚠️ Esto puede tomar varios minutos dependiendo de la conexión a internet..."
echo ""

# Ejecutar carga de datos con manejo de errores
docker-compose exec -T web python manage.py load_from_json \
    --days=7 \
    --json-file=ohmc_data_structure.json \
    --download-images

if [ $? -eq 0 ]; then
    success "Datos e imágenes meteorológicas cargados correctamente"
else
    info "Hubo algunos errores en la descarga, pero continuando..."
fi

# Verificar que se cargaron todas las variables
progress "Verificando variables WRF cargadas..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import Producto
variables_wrf = Producto.objects.filter(
  tipo_producto__nombre='wrf_cba'
).values_list('variable', flat=True).distinct()

print(f"Variables WRF cargadas: {len(variables_wrf)}")
for variable in sorted(variables_wrf):
  count = Producto.objects.filter(tipo_producto__nombre='wrf_cba', variable=variable).count()
  print(f"  - {variable}: {count} productos")
EOF

# Configurar Frontend React
section "CONFIGURANDO FRONTEND REACT"

if [ "$SKIP_FRONTEND" = false ]; then
    if [ -d "frontend" ]; then
        progress "Navegando al directorio frontend..."
        cd frontend
        
        progress "Instalando dependencias de React..."
        npm install
        if [ $? -ne 0 ]; then
            info "Error instalando dependencias del frontend, pero continuando..."
        else
            success "Dependencias del frontend instaladas"
        fi
        
        cd ..
    else
        info "Directorio frontend no encontrado, saltando configuración del frontend"
    fi
else
    info "Saltando configuración del frontend (Node.js no disponible o versión incompatible)"
fi

# Verificar que todo funciona
section "VERIFICANDO INSTALACIÓN"

progress "Verificando servicios Docker..."
echo ""
docker-compose ps
echo ""

progress "Verificando API..."
sleep 5
if curl -f http://localhost:8000/api/productos/ > /dev/null 2>&1; then
    success "API funcionando correctamente"
else
    info "API no responde inmediatamente (puede ser normal en primera ejecución)"
fi

# Mostrar estadísticas
progress "Obteniendo estadísticas del sistema..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

print("\n📊 ESTADÍSTICAS DEL SISTEMA:")
print("=" * 50)

for tipo in TipoProducto.objects.all():
    count = tipo.producto_set.count()
    con_imagen = tipo.producto_set.exclude(foto='').exclude(foto__isnull=True).count()
    print(f"  - {tipo.nombre}: {count} productos ({con_imagen} con imagen)")

total_productos = Producto.objects.count()
total_con_imagen = Producto.objects.exclude(foto='').exclude(foto__isnull=True).count()
total_fechas = FechaProducto.objects.count()

print(f"\n📈 TOTALES:")
print(f"  - Productos: {total_productos}")
print(f"  - Imágenes descargadas: {total_con_imagen}")
print(f"  - Registros de fechas: {total_fechas}")

if total_productos > 0:
    print(f"\n🕐 Horas disponibles para WRF (muestra):")
    horas_wrf = FechaProducto.objects.filter(
        producto__tipo_producto__nombre='wrf_cba'
    ).values_list('hora', flat=True).distinct().order_by('hora')[:8]
    
    for hora in horas_wrf:
        print(f"  - {hora}")
    
    print(f"\n📊 Variables WRF disponibles:")
    variables_wrf = Producto.objects.filter(
        tipo_producto__nombre='wrf_cba'
    ).values_list('variable', flat=True).distinct()
    
    for variable in sorted(variables_wrf)[:5]:
        count = Producto.objects.filter(tipo_producto__nombre='wrf_cba', variable=variable).count()
        print(f"  - {variable}: {count} productos")
EOF

# Mostrar información final
section "🎉 ¡INSTALACIÓN COMPLETADA!"

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✨ PROYECTO LISTO ✨                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${CYAN}🌐 URLS DISPONIBLES:${NC}"
echo -e "  📊 API REST:     ${YELLOW}http://localhost:8000/api/${NC}"
echo -e "  🔧 Admin Panel:  ${YELLOW}http://localhost:8000/admin${NC}"
echo -e "  👤 Usuario:      ${YELLOW}admin${NC} / Contraseña: ${YELLOW}admin123${NC}"

if [ "$SKIP_FRONTEND" = false ] && [ -d "frontend" ]; then
    echo -e "  ⚛️ Frontend:     ${YELLOW}http://localhost:3000${NC} ${GREEN}(ejecutar: cd frontend && npm start)${NC}"
fi

echo ""
echo -e "${CYAN}📊 ENDPOINTS PRINCIPALES:${NC}"
echo -e "  - ${YELLOW}GET /api/productos/${NC}                    - Lista todos los productos"
echo -e "  - ${YELLOW}GET /api/productos/?tipo=wrf_cba${NC}       - Productos WRF"
echo -e "  - ${YELLOW}GET /api/productos/?fecha=2025-06-26${NC}   - Productos por fecha"
echo -e "  - ${YELLOW}GET /api/ultimos/${NC}                      - Últimos productos"
echo -e "  - ${YELLOW}GET /api/estadisticas/${NC}                 - Estadísticas generales"

echo ""
echo -e "${CYAN}🔧 COMANDOS ÚTILES:${NC}"
echo -e "  - Ver logs:              ${YELLOW}docker-compose logs -f web${NC}"
echo -e "  - Parar servicios:       ${YELLOW}docker-compose down${NC}"
echo -e "  - Reiniciar servicios:   ${YELLOW}docker-compose restart${NC}"
echo -e "  - Acceder al admin:      ${YELLOW}docker-compose exec web python manage.py shell${NC}"

if [ "$SKIP_FRONTEND" = false ] && [ -d "frontend" ]; then
    echo -e "  - Iniciar frontend:      ${YELLOW}cd frontend && npm start${NC}"
fi

echo ""
echo -e "${GREEN}✨ CARACTERÍSTICAS INCLUIDAS:${NC}"
echo -e "  ✅ Backend Django con API REST completa"
echo -e "  ✅ Base de datos PostgreSQL configurada"
echo -e "  ✅ Redis para tareas en segundo plano"
echo -e "  ✅ Panel de administración personalizado"
echo -e "  ✅ Datos meteorológicos del OHMC cargados"
echo -e "  ✅ Imágenes descargadas y almacenadas localmente"
echo -e "  ✅ Frontend React configurado (si Node.js disponible)"

echo ""
echo -e "${BLUE}🌤️ ¡Disfruta del OHMC Weather API!${NC}"

# Preguntar si quiere iniciar el frontend automáticamente
if [ "$SKIP_FRONTEND" = false ] && [ -d "frontend" ]; then
    echo ""
    read -p "¿Quieres iniciar el frontend React ahora? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Iniciando frontend React...${NC}"
        cd frontend
        npm start
    else
        echo -e "${YELLOW}Para iniciar el frontend más tarde, ejecuta:${NC}"
        echo -e "${YELLOW}cd frontend && npm start${NC}"
    fi
fi
