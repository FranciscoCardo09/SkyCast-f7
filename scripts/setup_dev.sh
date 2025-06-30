#!/bin/bash

# Script para configurar entorno de desarrollo

echo "🔧 Configurando entorno de desarrollo..."

# Copiar archivo de entorno
cp .env.example .env

# Construir y levantar servicios
echo "🚀 Levantando servicios..."
docker-compose up -d

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# Ejecutar migraciones
echo "📊 Ejecutando migraciones..."
docker-compose exec web python manage.py migrate

# Crear superusuario
echo "👤 Creando superusuario..."
docker-compose exec web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superusuario creado: admin/admin123')
else:
    print('Superusuario ya existe')
"

# Sincronizar datos iniciales
echo "🌤️ Sincronizando datos meteorológicos..."
docker-compose exec web python manage.py sync_weather_data

echo "✅ Configuración completada!"
echo "🌐 API: http://localhost:8000/api/"
echo "🔧 Admin: http://localhost:8000/admin (admin/admin123)"
echo "📊 Endpoints disponibles:"
echo "  - GET /api/productos/"
echo "  - GET /api/productos/?tipo=wrf_cba"
echo "  - GET /api/productos/?fecha=2025-06-30"
echo "  - GET /api/ultimos/"
echo "  - GET /api/estadisticas/"
