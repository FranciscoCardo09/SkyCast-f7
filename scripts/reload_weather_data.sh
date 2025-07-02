#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Recargando datos meteorológicos con URLs corregidas${NC}"
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

# 1. Limpiar datos existentes
progress "Limpiando datos existentes..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

# Eliminar todos los productos y fechas (manteniendo tipos)
print("🗑️ Eliminando productos existentes...")
FechaProducto.objects.all().delete()
Producto.objects.all().delete()
print("✅ Datos limpiados")
EOF

success "Datos anteriores eliminados"

# 2. Recargar datos con URLs correctas
progress "Cargando datos con URLs corregidas..."
docker-compose exec -T web python manage.py load_initial_data

success "Datos recargados con URLs correctas"

# 3. Verificar datos
progress "Verificando datos cargados..."
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto

print(f"📊 Tipos de Productos: {TipoProducto.objects.count()}")
print(f"📄 Productos: {Producto.objects.count()}")
print(f"📅 Fechas de Productos: {FechaProducto.objects.count()}")
print()

# Mostrar algunos ejemplos de URLs
print("🔗 Ejemplos de URLs generadas:")
for producto in Producto.objects.all()[:5]:
    print(f"  - {producto.nombre_archivo}")
    print(f"    {producto.url_imagen}")
    print()
EOF

echo ""
echo -e "${GREEN}🎉 ¡Datos recargados correctamente!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}🌐 Verifica en:${NC}"
echo -e "  - Admin: ${YELLOW}http://localhost:8000/admin${NC}"
echo -e "  - API: ${YELLOW}http://localhost:8000/api/productos/${NC}"
echo -e "  - Frontend: ${YELLOW}http://localhost:3000${NC}"
