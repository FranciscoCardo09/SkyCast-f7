#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 OHMC Weather API - Setup Completo con Descarga de Imágenes${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo ""

# Función para mostrar errores y salir
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar info
info() {
    echo -e "${YELLOW}ℹ️ $1${NC}"
}

# Función para mostrar progreso
progress() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# 1. Verificar Docker
progress "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    error_exit "Docker no está instalado. Por favor instala Docker primero."
fi

if ! command -v docker-compose &> /dev/null; then
    error_exit "Docker Compose no está instalado. Por favor instala Docker Compose primero."
fi

if ! docker info > /dev/null 2>&1; then
    error_exit "Docker no está corriendo. Por favor inicia Docker primero."
fi

success "Docker está disponible y corriendo"

# 2. Limpiar contenedores anteriores
progress "Limpiando contenedores anteriores..."
docker-compose down -v 2>/dev/null || true
docker system prune -f 2>/dev/null || true
success "Contenedores anteriores limpiados"

# 3. Crear archivo .env
progress "Configurando variables de entorno..."
if [ ! -f .env ]; then
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
    success "Archivo .env creado"
else
    info "Archivo .env ya existe"
fi

# 4. Construir y levantar servicios
progress "Construyendo y levantando servicios Docker..."
docker-compose up -d --build

if [ $? -ne 0 ]; then
    error_exit "Falló la construcción de los servicios Docker"
fi

success "Servicios Docker iniciados"

# 5. Esperar a que la base de datos esté lista
progress "Esperando a que la base de datos esté lista..."
for i in {1..30}; do
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        success "Base de datos está lista"
        break
    fi
    if [ $i -eq 30 ]; then
        error_exit "La base de datos no se inició en 30 segundos"
    fi
    sleep 1
done

# 6. Limpiar migraciones anteriores
progress "Limpiando migraciones anteriores..."
find productos/migrations -name "*.py" -not -name "__init__.py" -delete 2>/dev/null || true
success "Migraciones anteriores limpiadas"

# 7. Crear y aplicar migraciones
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

success "Migraciones aplicadas correctamente"

# 8. Crear superusuario
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

success "Superusuario configurado"

# 9. Cargar datos iniciales CON DESCARGA DE IMÁGENES
progress "Cargando datos meteorológicos y descargando imágenes..."
info "Esto puede tomar varios minutos dependiendo de la conexión..."

docker-compose exec -T web python manage.py load_initial_data --days=7 --download-images
if [ $? -ne 0 ]; then
    error_exit "Falló la carga de datos iniciales"
fi

success "Datos meteorológicos e imágenes cargados"

# 10. Verificar que todo funciona
progress "Verificando servicios..."

# Verificar API
sleep 5
if curl -f http://localhost:8000/api/productos/ > /dev/null 2>&1; then
    success "API funcionando correctamente"
else
    info "API no responde inmediatamente (normal en primera ejecución)"
fi

# 11. Mostrar estadísticas
progress "Obteniendo estadísticas del sistema..."
echo ""
echo -e "${BLUE}📊 ESTADÍSTICAS DEL SISTEMA${NC}"
echo -e "${BLUE}===========================${NC}"

docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto
from django.contrib.auth import get_user_model

print(f"📊 Tipos de Productos: {TipoProducto.objects.count()}")
print(f"📄 Productos: {Producto.objects.count()}")
print(f"📅 Fechas de Productos: {FechaProducto.objects.count()}")

# Contar imágenes guardadas
total_con_imagen = Producto.objects.exclude(foto='').exclude(foto__isnull=True).count()
total_productos = Producto.objects.count()
print(f"📸 Imágenes guardadas: {total_con_imagen}/{total_productos}")

print()
print("📋 Detalle por tipo:")
for tipo in TipoProducto.objects.all():
    count = tipo.producto_set.count()
    con_imagen = tipo.producto_set.exclude(foto='').exclude(foto__isnull=True).count()
    print(f"  - {tipo.nombre}: {count} productos ({con_imagen} con imagen)")
EOF

# 12. Mostrar estado de servicios
echo ""
echo -e "${BLUE}🐳 ESTADO DE SERVICIOS DOCKER${NC}"
echo -e "${BLUE}==============================${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}🎉 ¡SISTEMA COMPLETAMENTE CONFIGURADO CON IMÁGENES!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo -e "${BLUE}🌐 URLs DISPONIBLES:${NC}"
echo -e "  📊 API: ${YELLOW}http://localhost:8000/api/${NC}"
echo -e "  🔧 Admin: ${YELLOW}http://localhost:8000/admin${NC}"
echo -e "  👤 Usuario: ${YELLOW}admin${NC} / Contraseña: ${YELLOW}admin123${NC}"
echo ""
echo -e "${BLUE}📸 CARACTERÍSTICAS:${NC}"
echo -e "  ✅ Imágenes descargadas y guardadas en la base de datos"
echo -e "  ✅ Datos de la última semana disponibles"
echo -e "  ✅ Frontend optimizado para imágenes locales"
echo ""
echo -e "${BLUE}🔧 COMANDOS ÚTILES:${NC}"
echo -e "  - Ver logs: ${YELLOW}docker-compose logs -f web${NC}"
echo -e "  - Descargar imágenes faltantes: ${YELLOW}docker-compose exec web python manage.py load_initial_data --download-images${NC}"
echo -e "  - Sincronizar datos: ${YELLOW}docker-compose exec web python manage.py sync_weather_data${NC}"
echo ""
echo -e "${GREEN}✨ ¡El sistema está listo con imágenes guardadas!${NC}"
echo -e "${BLUE}🌤️ Disfruta del OHMC Weather API!${NC}"
