#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Arreglando estructura y cargando datos OHMC${NC}"
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

# 1. Crear estructura de directorios para comandos
progress "Creando estructura de directorios..."
mkdir -p productos/management
mkdir -p productos/management/commands

# Crear archivos __init__.py necesarios
touch productos/management/__init__.py
touch productos/management/commands/__init__.py

success "Estructura de directorios creada"

# 2. Verificar que los servicios estén corriendo
progress "Verificando servicios..."
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}🚀 Iniciando servicios...${NC}"
    docker-compose up -d
    sleep 15
fi
success "Servicios activos"

# 3. Verificar que el archivo JSON existe
if [ ! -f "ohmc_data_structure.json" ]; then
    echo -e "${RED}❌ Archivo ohmc_data_structure.json no encontrado${NC}"
    exit 1
fi
success "Archivo JSON encontrado"

# 4. Copiar archivos al contenedor (por si acaso)
progress "Copiando archivos necesarios al contenedor..."
docker-compose exec -T web mkdir -p /app/productos/management/commands
docker cp productos/management/commands/load_from_json.py $(docker-compose ps -q web):/app/productos/management/commands/
docker cp productos/management/__init__.py $(docker-compose ps -q web):/app/productos/management/
docker cp productos/management/commands/__init__.py $(docker-compose ps -q web):/app/productos/management/commands/
docker cp ohmc_data_structure.json $(docker-compose ps -q web):/app/

success "Archivos copiados al contenedor"

# 5. Verificar que el comando existe
progress "Verificando comando load_from_json..."
if docker-compose exec -T web python manage.py help | grep -q "load_from_json"; then
    success "Comando load_from_json disponible"
else
    echo -e "${YELLOW}⚠️ Comando no detectado, pero continuando...${NC}"
fi

# 6. Limpiar datos existentes
progress "Limpiando datos existentes..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

print("🗑️ Eliminando productos y fechas existentes...")
FechaProducto.objects.all().delete()
Producto.objects.all().delete()
print("✅ Datos limpiados")
EOF

success "Datos anteriores eliminados"

# 7. Cargar datos desde JSON con descarga de imágenes
progress "Cargando datos desde JSON con descarga de imágenes..."
echo -e "${YELLOW}⚠️ Esto puede tomar varios minutos dependiendo de la conexión...${NC}"
echo ""

docker-compose exec -T web python manage.py load_from_json \
    --days=7 \
    --json-file=ohmc_data_structure.json \
    --download-images

if [ $? -eq 0 ]; then
    success "Datos e imágenes cargados correctamente"
else
    echo -e "${RED}❌ Error al cargar datos${NC}"
    exit 1
fi

# 8. Mostrar estadísticas finales
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

# Mostrar algunas variables disponibles
print(f"\n📊 Variables WRF disponibles:")
variables_wrf = Producto.objects.filter(
    tipo_producto__nombre='wrf_cba'
).values_list('variable', flat=True).distinct()

for variable in sorted(variables_wrf):
    count = Producto.objects.filter(tipo_producto__nombre='wrf_cba', variable=variable).count()
    print(f"  - {variable}: {count} productos")
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
