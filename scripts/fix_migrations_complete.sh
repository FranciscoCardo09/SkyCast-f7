#!/bin/bash

echo "🔧 Arreglando migraciones completamente..."

# Parar servicios
echo "🛑 Parando servicios..."
docker-compose down

# Eliminar migraciones existentes (excepto __init__.py)
echo "🗑️ Limpiando migraciones anteriores..."
find productos/migrations -name "*.py" -not -name "__init__.py" -delete 2>/dev/null || true

# Levantar solo la base de datos
echo "🚀 Levantando base de datos..."
docker-compose up -d db redis

# Esperar a que la BD esté lista
echo "⏳ Esperando base de datos..."
sleep 10

# Levantar el servicio web
echo "🌐 Levantando servicio web..."
docker-compose up -d web

# Esperar un poco más
sleep 5

# Crear migraciones desde cero
echo "📊 Creando migraciones desde cero..."
docker-compose exec web python manage.py makemigrations productos

# Aplicar migraciones
echo "📊 Aplicando migraciones..."
docker-compose exec web python manage.py migrate

# Verificar migraciones
echo "🔍 Verificando migraciones..."
docker-compose exec web python manage.py showmigrations

# Crear superusuario
echo "👤 Creando superusuario..."
docker-compose exec web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Superusuario creado: admin/admin123')
else:
    print('✅ Superusuario ya existe')
"

# Levantar todos los servicios
echo "🚀 Levantando todos los servicios..."
docker-compose up -d

echo "✅ ¡Migraciones arregladas!"
echo ""
echo "🌐 URLs disponibles:"
echo "  - API: http://localhost:8000/api/"
echo "  - Admin: http://localhost:8000/admin (admin/admin123)"
