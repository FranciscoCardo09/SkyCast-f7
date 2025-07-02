#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Recargando datos meteorológicos (VERSIÓN CORREGIDA)${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Función para mostrar progreso
progress() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Verificar que los servicios estén corriendo
progress "Verificando servicios..."
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Los servicios no están corriendo${NC}"
    echo -e "${YELLOW}Ejecuta: docker-compose up -d${NC}"
    exit 1
fi
success "Servicios activos"

# 2. Limpiar datos existentes
progress "Limpiando datos existentes..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

print("🗑️ Eliminando productos y fechas existentes...")
FechaProducto.objects.all().delete()
Producto.objects.all().delete()
print("✅ Datos limpiados")
EOF

success "Datos anteriores eliminados"

# 3. Recargar datos con más días
progress "Cargando datos de los últimos 10 días..."
docker-compose exec -T web python manage.py load_initial_data --days=10

success "Datos recargados"

# 4. Ejecutar debug
progress "Ejecutando diagnóstico..."
chmod +x scripts/debug_data.sh
./scripts/debug_data.sh

echo ""
echo -e "${GREEN}🎉 ¡Recarga completada!${NC}"
echo -e "${GREEN}=====================${NC}"
echo ""
echo -e "${BLUE}🌐 Verifica en:${NC}"
echo -e "  - Admin: ${YELLOW}http://localhost:8000/admin${NC}"
echo -e "  - API: ${YELLOW}http://localhost:8000/api/productos/?tipo=wrf_cba${NC}"
echo -e "  - Frontend: ${YELLOW}http://localhost:3000${NC}"
