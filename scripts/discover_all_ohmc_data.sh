#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Descubriendo TODOS los datos disponibles en OHMC${NC}"
echo -e "${BLUE}=============================================${NC}"
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

# Instalar BeautifulSoup si no está instalado
progress "Verificando dependencias..."
docker-compose exec -T web pip install beautifulsoup4 lxml
success "Dependencias verificadas"

# Primero hacer un dry-run para ver qué se encontraría
progress "Haciendo exploración de prueba (dry-run)..."
echo -e "${YELLOW}📋 Esto mostrará qué datos se encontrarían sin guardar nada:${NC}"
echo ""

docker-compose exec -T web python manage.py discover_ohmc_data \
    --year=2025 \
    --month=6 \
    --days=30 \
    --dry-run

echo ""
echo -e "${YELLOW}¿Quieres continuar y guardar todos estos datos en la base de datos? (y/N)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
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

    # Ejecutar descubrimiento completo
    progress "Ejecutando descubrimiento completo..."
    docker-compose exec -T web python manage.py discover_ohmc_data \
        --year=2025 \
        --month=6 \
        --days=30

    success "Descubrimiento completado"

    # Mostrar estadísticas finales
    progress "Mostrando estadísticas finales..."
    docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto
from django.db.models import Count

print("📊 ESTADÍSTICAS FINALES:")
print("=" * 40)

for tipo in TipoProducto.objects.all():
    count = tipo.producto_set.count()
    print(f"  - {tipo.nombre}: {count} productos")

print(f"\nTotal productos: {Producto.objects.count()}")
print(f"Total fechas: {FechaProducto.objects.count()}")

# Mostrar datos por fecha para WRF
print("\n🌡️ Datos WRF por fecha (últimas 10):")
wrf_stats = FechaProducto.objects.filter(
    producto__tipo_producto__nombre='wrf_cba'
).values('fecha').annotate(
    total=Count('id'),
    variables=Count('producto__variable', distinct=True),
    horas=Count('hora', distinct=True)
).order_by('-fecha')[:10]

for stat in wrf_stats:
    print(f"  - {stat['fecha']}: {stat['total']} archivos, {stat['variables']} variables, {stat['horas']} horas")
EOF

    echo ""
    echo -e "${GREEN}🎉 ¡Todos los datos del OHMC han sido descubiertos y guardados!${NC}"
    echo -e "${GREEN}=========================================================${NC}"
    echo ""
    echo -e "${BLUE}🌐 Verifica en:${NC}"
    echo -e "  - Admin: ${YELLOW}http://localhost:8000/admin${NC}"
    echo -e "  - API: ${YELLOW}http://localhost:8000/api/productos/${NC}"
    echo -e "  - Frontend: ${YELLOW}http://localhost:3000${NC}"
    echo ""
    echo -e "${BLUE}🔍 El frontend ahora puede consultar qué datos están disponibles para cada fecha/hora${NC}"

else
    echo -e "${YELLOW}❌ Operación cancelada${NC}"
fi
