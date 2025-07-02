#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📄 Cargando datos OHMC desde JSON${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Función para mostrar progreso
progress() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Verificar que los servicios estén corriendo
progress "Verificando servicios..."
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Los servicios no están corriendo${NC}"
    echo -e "${YELLOW}Ejecuta: docker-compose up -d${NC}"
    exit 1
fi
success "Servicios activos"

# Verificar que el archivo JSON existe
if [ ! -f "ohmc_data_structure.json" ]; then
    echo -e "${RED}❌ Archivo ohmc_data_structure.json no encontrado${NC}"
    exit 1
fi
success "Archivo JSON encontrado"

# Limpiar datos existentes
progress "Limpiando datos existentes..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

print("🗑️ Eliminando productos y fechas existentes...")
FechaProducto.objects.all().delete()
Producto.objects.all().delete()
print("✅ Datos limpiados")
EOF

success "Datos anteriores eliminados"

# Cargar datos desde JSON
progress "Cargando datos desde JSON..."
docker-compose exec -T web python manage.py load_from_json \
    --days=30 \
    --json-file=ohmc_data_structure.json

success "Datos cargados desde JSON"

echo ""
echo -e "${GREEN}🎉 ¡Datos OHMC cargados correctamente!${NC}"
echo -e "${GREEN}===================================${NC}"
echo ""
echo -e "${BLUE}🌐 Verifica en:${NC}"
echo -e "  - Admin: ${YELLOW}http://localhost:8000/admin${NC}"
echo -e "  - API: ${YELLOW}http://localhost:8000/api/productos/${NC}"
echo -e "  - Frontend: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📊 Endpoints útiles:${NC}"
echo -e "  - Fechas disponibles: ${YELLOW}http://localhost:8000/api/fechas-disponibles/?tipo=wrf_cba${NC}"
echo -e "  - Variables disponibles: ${YELLOW}http://localhost:8000/api/variables-disponibles/${NC}"
echo -e "  - Estadísticas: ${YELLOW}http://localhost:8000/api/estadisticas/${NC}"
