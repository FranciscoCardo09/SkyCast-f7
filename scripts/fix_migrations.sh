#!/bin/bash

echo "🔧 Arreglando migraciones..."

# Crear migraciones
docker-compose exec web python manage.py makemigrations productos

# Aplicar migraciones
docker-compose exec web python manage.py migrate

# Crear superusuario si no existe
docker-compose exec web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superusuario creado: admin/admin123')
else:
    print('Superusuario ya existe')
"

# Sincronizar datos
echo "🌤️ Sincronizando datos meteorológicos..."
docker-compose exec web python manage.py sync_weather_data

echo "✅ Migraciones arregladas!"
