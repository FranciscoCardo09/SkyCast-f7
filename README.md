# OHMC Weather API

Sistema de gestión de productos meteorológicos con Django REST Framework, PostgreSQL y Docker.

## 🚀 Características

- **API REST completa** con endpoints para consultar productos meteorológicos
- **Sincronización automática** de datos desde el OHMC
- **Admin personalizado** con dashboard y estadísticas
- **Containerización completa** con Docker y Docker Swarm
- **Tareas programadas** con Celery y Redis
- **Base de datos PostgreSQL** con ORM de Django

## 📊 Endpoints Disponibles

- `GET /api/productos/` - Lista todos los productos
- `GET /api/productos/?tipo=wrf_cba` - Filtrar por tipo
- `GET /api/productos/?fecha=YYYY-MM-DD` - Filtrar por fecha
- `GET /api/productos/?variable=t2` - Filtrar por variable (WRF)
- `GET /api/ultimos/` - Últimos productos de cada tipo
- `GET /api/productos/fecha-hora/?fecha=2025-06-30&hora=06:00` - WRF específico
- `GET /api/estadisticas/` - Estadísticas generales

## 🛠️ Instalación y Uso

### Desarrollo Local

\`\`\`bash
# Clonar repositorio
git clone <repo-url>
cd weather-api

# Configurar entorno
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
\`\`\`

### Producción con Docker Swarm

\`\`\`bash
# Inicializar Docker Swarm
docker swarm init

# Configurar variables de entorno
export DB_PASSWORD=your-secure-password
export SECRET_KEY=your-secret-key

# Desplegar
chmod +x scripts/build_and_deploy.sh
./scripts/build_and_deploy.sh
\`\`\`

## 🔧 Comandos Útiles

\`\`\`bash
# Sincronizar datos manualmente
docker-compose exec web python manage.py sync_weather_data

# Sincronizar tipo específico
docker-compose exec web python manage.py sync_weather_data --type wrf

# Ver logs de Celery
docker-compose logs -f celery

# Acceder al shell de Django
docker-compose exec web python manage.py shell
\`\`\`

## 📈 Monitoreo

- **Admin Django**: http://localhost:8000/admin
- **API Root**: http://localhost:8000/api/
- **Estadísticas**: http://localhost:8000/api/estadisticas/

## 🗄️ Estructura de Base de Datos

- **TipoProducto**: Tipos de productos meteorológicos
- **Producto**: Productos individuales con URLs e imágenes
- **FechaProducto**: Fechas y horas de cada producto

## ⚙️ Configuración de Sincronización

Los datos se sincronizan automáticamente según los horarios del OHMC:
- **WRF**: 06:00 y 18:00 UTC
- **MedicionAire**: 10:30 UTC diario
- **FWI**: 11:00 UTC diario
- **Rutas Caminera**: 11:00 UTC diario
