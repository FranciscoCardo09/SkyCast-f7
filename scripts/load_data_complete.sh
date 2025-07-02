#!/bin/bash

echo "🚀 Cargando datos completos del sistema..."

# Verificar que los servicios estén corriendo
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Los servicios no están corriendo. Ejecutando setup primero..."
    ./scripts/fix_migrations_complete.sh
fi

echo "📊 Cargando datos iniciales..."
docker-compose exec web python manage.py load_initial_data

echo "🔍 Verificando datos cargados..."
echo "📈 Estadísticas de la base de datos:"

# Mostrar estadísticas
docker-compose exec web python manage.py shell -c "
from productos.models import TipoProducto, Producto, FechaProducto
print(f'📊 Tipos de Productos: {TipoProducto.objects.count()}')
print(f'📄 Productos: {Producto.objects.count()}')
print(f'📅 Fechas de Productos: {FechaProducto.objects.count()}')
print()
print('📋 Detalle por tipo:')
for tipo in TipoProducto.objects.all():
    count = tipo.producto_set.count()
    print(f'  - {tipo.nombre}: {count} productos')
"

echo ""
echo "✅ ¡Datos cargados completamente!"
echo ""
echo "🌐 URLs disponibles:"
echo "  - API: http://localhost:8000/api/"
echo "  - Admin: http://localhost:8000/admin (admin/admin123)"
echo ""
echo "🔍 Verifica el admin para ver todos los datos cargados"
