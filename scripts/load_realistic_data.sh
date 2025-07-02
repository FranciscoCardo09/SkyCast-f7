#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📥 Cargando datos con fechas realistas del OHMC${NC}"
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

# Cargar datos con fecha realista (26 de junio de 2025 según el JSON)
progress "Cargando datos desde 2025-06-26 (última actualización conocida)..."
docker-compose exec -T web python manage.py load_initial_data \
    --start-date=2025-06-26 \
    --days=5 \
    --download-images

success "Datos cargados con fechas realistas"

# Mostrar estadísticas
progress "Mostrando estadísticas..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

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

print()
print("📅 Fechas disponibles:")
fechas_unicas = FechaProducto.objects.values_list('fecha', flat=True).distinct().order_by('-fecha')
for fecha in fechas_unicas:
    count = FechaProducto.objects.filter(fecha=fecha).count()
    print(f"  - {fecha}: {count} registros")
EOF

echo ""
echo -e "${GREEN}🎉 ¡Datos cargados con fechas realistas!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${BLUE}🌐 Verifica en:${NC}"
echo -e "  - Admin: ${YELLOW}http://localhost:8000/admin${NC}"
echo -e "  - API: ${YELLOW}http://localhost:8000/api/productos/${NC}"
echo -e "  - Frontend: ${YELLOW}http://localhost:3000${NC}"
