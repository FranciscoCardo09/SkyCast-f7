#!/bin/bash

echo "🔍 Debugging datos meteorológicos..."
echo "=================================="

echo ""
echo "📊 Conteo de productos por tipo:"
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import TipoProducto, Producto, FechaProducto
from datetime import date, timedelta

for tipo in TipoProducto.objects.all():
    count = tipo.producto_set.count()
    print(f"  - {tipo.nombre}: {count} productos")

print(f"\nTotal productos: {Producto.objects.count()}")
print(f"Total fechas: {FechaProducto.objects.count()}")
EOF

echo ""
echo "🌡️ Productos WRF específicos:"
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import Producto
from datetime import date

wrf_productos = Producto.objects.filter(tipo_producto__nombre='wrf_cba')
print(f"Productos WRF encontrados: {wrf_productos.count()}")

if wrf_productos.exists():
    print("\nPrimeros 5 productos WRF:")
    for p in wrf_productos[:5]:
        print(f"  - {p.nombre_archivo}")
        print(f"    Variable: {p.variable}")
        print(f"    URL: {p.url_imagen}")
        fechas = p.fechas.all()[:2]
        for f in fechas:
            print(f"    Fecha: {f.fecha} {f.hora}")
        print()
else:
    print("❌ No hay productos WRF!")
EOF

echo ""
echo "📅 Fechas disponibles:"
docker-compose exec -T web python manage.py shell << 'EOF'
from productos.models import FechaProducto
from datetime import date

fechas_unicas = FechaProducto.objects.values_list('fecha', flat=True).distinct().order_by('-fecha')
print("Fechas con datos:")
for fecha in fechas_unicas[:10]:
    count = FechaProducto.objects.filter(fecha=fecha).count()
    print(f"  - {fecha}: {count} registros")
EOF

echo ""
echo "🔗 Probando API directamente:"
echo "GET /api/productos/?tipo=wrf_cba"
curl -s "http://localhost:8000/api/productos/?tipo=wrf_cba" | python3 -m json.tool | head -20

echo ""
echo "GET /api/estadisticas/"
curl -s "http://localhost:8000/api/estadisticas/" | python3 -m json.tool
