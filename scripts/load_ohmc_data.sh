#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📄 Cargando datos OHMC desde JSON con descarga de imágenes${NC}"
echo -e "${BLUE}====================================================${NC}"
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

# Cargar datos desde JSON con descarga de imágenes
progress "Cargando datos desde JSON con descarga de imágenes..."
echo -e "${YELLOW}⚠️ Esto puede tomar varios minutos dependiendo de la conexión...${NC}"
echo ""

docker-compose exec -T web python manage.py load_from_json \
    --days=7 \
    --json-file=ohmc_data_structure.json \
    --download-images

success "Datos e imágenes cargados desde JSON"

# Mostrar estadísticas finales
progress "Mostrando estadísticas finales..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

print("\n📊 ESTADÍSTICAS FINALES:")
print("=" * 40)

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

# Mostrar algunas horas disponibles para WRF
print(f"\n🕐 Horas disponibles para WRF (muestra):")
horas_wrf = FechaProducto.objects.filter(
    producto__tipo_producto__nombre='wrf_cba'
).values_list('hora', flat=True).distinct().order_by('hora')[:10]

for hora in horas_wrf:
    print(f"  - {hora}")
EOF

echo ""
echo -e "${GREEN}🎉 ¡Datos OHMC cargados correctamente con imágenes!${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""
echo -e "${BLUE}🌐 Verifica en:${NC}"
echo -e "  - Admin: ${YELLOW}http://localhost:8000/admin/productos/producto/${NC}"
echo -e "  - API: ${YELLOW}http://localhost:8000/api/productos/?tipo=wrf_cba${NC}"
echo -e "  - Frontend: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📸 Las imágenes se han descargado y guardado físicamente${NC}"
echo -e "${BLUE}🕐 Se han generado todas las horas desde +09 hasta +25${NC}"
echo -e "${BLUE}📊 Se han incluido todas las variables disponibles${NC}"
