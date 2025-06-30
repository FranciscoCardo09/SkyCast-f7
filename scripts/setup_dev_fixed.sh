#!/bin/bash

echo "🔧 Configurando entorno de desarrollo..."

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo. Por favor inicia Docker primero."
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "📄 Copiando archivo de configuración..."
        cp .env.example .env
    else
        echo "📄 Creando archivo .env..."
        cat > .env << EOF
# Django
SECRET_KEY=django-insecure-change-me-in-production
DEBUG=True

# Database
DB_NAME=weather_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Weather API
WEATHER_API_BASE_URL=https://yaku.ohmc.ar/public/
WEATHER_UPDATE_INTERVAL=3600
EOF
    fi
else
    echo "✅ Archivo .env ya existe"
fi

# Parar contenedores existentes si están corriendo
echo "🛑 Parando contenedores existentes..."
docker-compose down

# Construir y levantar servicios
echo "🚀 Construyendo y levantando servicios..."
docker-compose up -d --build

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 15

# Verificar que los contenedores estén corriendo
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Error: Los contenedores no se iniciaron correctamente"
    docker-compose logs
    exit 1
fi

# Crear migraciones y aplicarlas
echo "📊 Creando y aplicando migraciones..."
docker-compose exec -T web python manage.py makemigrations productos
docker-compose exec -T web python manage.py migrate

# Verificar que las migraciones se aplicaron
echo "🔍 Verificando migraciones..."
if docker-compose exec -T web python manage.py showmigrations | grep -q "\[ \]"; then
    echo "❌ Error: Algunas migraciones no se aplicaron"
    docker-compose exec -T web python manage.py showmigrations
    exit 1
fi

# Crear superusuario
echo "👤 Creando superusuario..."
docker-compose exec -T web python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Superusuario creado: admin/admin123')
else:
    print('✅ Superusuario ya existe')
EOF

# Verificar que la API funciona
echo "🔍 Verificando API..."
sleep 5
if curl -f http://localhost:8000/api/ > /dev/null 2>&1; then
    echo "✅ API funcionando correctamente"
else
    echo "⚠️ API no responde, pero los servicios están corriendo"
fi

# Sincronizar datos iniciales (opcional, puede fallar si no hay conexión)
echo "🌤️ Intentando sincronizar datos meteorológicos..."
if docker-compose exec -T web python manage.py sync_weather_data 2>/dev/null; then
    echo "✅ Datos sincronizados correctamente"
else
    echo "⚠️ No se pudieron sincronizar los datos (normal en primera ejecución)"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps
echo ""
echo "🌐 URLs disponibles:"
echo "  - API: http://localhost:8000/api/"
echo "  - Admin: http://localhost:8000/admin"
echo "  - Usuario: admin / Contraseña: admin123"
echo ""
echo "📊 Endpoints disponibles:"
echo "  - GET /api/productos/"
echo "  - GET /api/productos/?tipo=wrf_cba"
echo "  - GET /api/productos/?fecha=2025-06-30"
echo "  - GET /api/ultimos/"
echo "  - GET /api/estadisticas/"
echo ""
echo "🔧 Comandos útiles:"
echo "  - Ver logs: docker-compose logs -f web"
echo "  - Parar servicios: docker-compose down"
echo "  - Reiniciar: docker-compose restart"
