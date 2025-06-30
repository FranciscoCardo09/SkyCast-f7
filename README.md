# 🌤️ OHMC Weather API - Sistema Meteorológico Completo

Sistema integral de gestión de productos meteorológicos con Django REST Framework, PostgreSQL, Redis, Celery y frontend React.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Paso a Paso](#-instalación-paso-a-paso)
- [Uso del Sistema](#-uso-del-sistema)
- [API Endpoints](#-api-endpoints)
- [Comandos Útiles](#-comandos-útiles)
- [Troubleshooting](#-troubleshooting)
- [Producción](#-producción)

## 🚀 Características

- **🔄 Sincronización automática** de datos meteorológicos del OHMC
- **📊 API REST completa** con filtros avanzados
- **🎨 Admin personalizado** con dashboard y estadísticas
- **⚛️ Frontend React moderno** con interfaz intuitiva
- **🐳 Containerización completa** con Docker
- **📅 Tareas programadas** con Celery y Redis
- **🗄️ Base de datos PostgreSQL** robusta
- **🌐 Interfaz responsive** para todos los dispositivos

## 🏗️ Arquitectura

\`\`\`
JSON (OHMC) → API Django → PostgreSQL → API REST → Frontend React
                ↓
            Celery + Redis (Tareas programadas)
\`\`\`

## 📋 Requisitos Previos

- **Docker** y **Docker Compose** instalados
- **Git** para clonar el repositorio
- **Node.js 18+** y **npm** (para el frontend)
- Al menos **4GB de RAM** disponible
- **Puertos libres**: 8000 (Django), 3000 (React), 5432 (PostgreSQL), 6379 (Redis)

## 🛠️ Instalación Paso a Paso

### 1️⃣ Clonar el Repositorio

\`\`\`bash
git clone <tu-repositorio-url>
cd SkyCast-f7
\`\`\`

### 2️⃣ Configurar Variables de Entorno

\`\`\`bash
# Copiar archivo de configuración
cp .env.example .env

# Editar variables si es necesario (opcional)
nano .env
\`\`\`

### 3️⃣ Levantar el Backend (Método Corregido)

\`\`\`bash
# Opción A: Script automático mejorado
chmod +x scripts/setup_dev_fixed.sh
./scripts/setup_dev_fixed.sh

# Opción B: Paso a paso manual (si el script falla)
# 1. Crear archivo .env
cp .env.example .env  # o crear manualmente si no existe

# 2. Levantar servicios
docker-compose down  # limpiar contenedores anteriores
docker-compose up -d --build

# 3. Esperar y crear migraciones
sleep 15
docker-compose exec web python manage.py makemigrations productos
docker-compose exec web python manage.py migrate

# 4. Crear superusuario
docker-compose exec web python manage.py createsuperuser
\`\`\`

### 4️⃣ Arreglar Migraciones (si hay errores)

\`\`\`bash
# Si hay problemas con las migraciones, ejecutar:
chmod +x scripts/fix_migrations.sh
./scripts/fix_migrations.sh
\`\`\`

### 5️⃣ Configurar el Frontend React

\`\`\`bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start
\`\`\`

### 6️⃣ Verificar que Todo Funciona

**Backend Django:**
- 🌐 API: http://localhost:8000/api/
- 🔧 Admin: http://localhost:8000/admin
- 👤 Usuario: `admin` / Contraseña: `admin123`

**Frontend React:**
- ⚛️ Aplicación: http://localhost:3000

## 🎯 Uso del Sistema

### 🔧 Panel de Administración

1. Ve a http://localhost:8000/admin
2. Inicia sesión con `admin` / `admin123`
3. Explora las secciones:
   - **📊 Dashboard**: Estadísticas generales
   - **🌡️ Tipos de Producto**: WRF, FWI, Gases, Rutas
   - **📄 Productos**: Archivos individuales con imágenes
   - **📅 Fechas de Productos**: Historial temporal

### ⚛️ Frontend React

1. Ve a http://localhost:3000
2. Navega entre las pestañas:
   - **🌡️ WRF**: Selecciona fecha, hora y variable meteorológica
   - **🔥 FWI**: Índice de peligro de incendio
   - **🌬️ Gases**: Mediciones de CO₂ y CH₄ (selecciona fecha)
   - **🛣️ Vientos**: Ráfagas en rutas provinciales

## 📊 API Endpoints

### Endpoints Principales

| Método | Endpoint | Descripción | Ejemplo |
|--------|----------|-------------|---------|
| `GET` | `/api/productos/` | Lista todos los productos | `?tipo=wrf_cba&fecha=2025-06-30` |
| `GET` | `/api/productos/{id}/` | Detalle de un producto | `/api/productos/1/` |
| `GET` | `/api/tipos/` | Lista tipos de productos | - |
| `GET` | `/api/ultimos/` | Últimos productos por tipo | - |
| `GET` | `/api/estadisticas/` | Estadísticas generales | - |
| `GET` | `/api/productos/fecha-hora/` | WRF por fecha/hora específica | `?fecha=2025-06-30&hora=12:00` |

### Filtros Disponibles

\`\`\`bash
# Por tipo de producto
curl "http://localhost:8000/api/productos/?tipo=wrf_cba"

# Por fecha
curl "http://localhost:8000/api/productos/?fecha=2025-06-30"

# Por variable (WRF)
curl "http://localhost:8000/api/productos/?variable=t2"

# Combinados
curl "http://localhost:8000/api/productos/?tipo=wrf_cba&fecha=2025-06-30&variable=t2"
\`\`\`

## 🔧 Comandos Útiles

### Docker y Servicios

\`\`\`bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f web
docker-compose logs -f celery

# Reiniciar servicios
docker-compose restart

# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes (⚠️ CUIDADO: Borra la BD)
docker-compose down -v
\`\`\`

### Django Management

\`\`\`bash
# Acceder al shell de Django
docker-compose exec web python manage.py shell

# Crear superusuario adicional
docker-compose exec web python manage.py createsuperuser

# Ejecutar migraciones manualmente
docker-compose exec web python manage.py migrate

# Sincronizar datos meteorológicos
docker-compose exec web python manage.py sync_weather_data

# Sincronizar tipo específico
docker-compose exec web python manage.py sync_weather_data --type wrf
\`\`\`

### Base de Datos

\`\`\`bash
# Acceder a PostgreSQL
docker-compose exec db psql -U postgres -d weather_db

# Backup de la base de datos
docker-compose exec db pg_dump -U postgres weather_db > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U postgres weather_db < backup.sql
\`\`\`

## 🐛 Troubleshooting

### Problemas Comunes

#### ❌ Error: "relation does not exist"
\`\`\`bash
# Solución: Crear y aplicar migraciones
docker-compose exec web python manage.py makemigrations productos
docker-compose exec web python manage.py migrate
\`\`\`

#### ❌ Error: "Port already in use"
\`\`\`bash
# Verificar qué proceso usa el puerto
sudo lsof -i :8000

# Cambiar puerto en docker-compose.yml
ports:
  - "8001:8000"  # Cambiar 8000 por 8001
\`\`\`

#### ❌ Frontend no se conecta al backend
\`\`\`bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/api/productos/

# Verificar proxy en frontend/package.json
"proxy": "http://localhost:8000"
\`\`\`

#### ❌ Celery no funciona
\`\`\`bash
# Verificar Redis
docker-compose exec redis redis-cli ping

# Reiniciar Celery
docker-compose restart celery celery-beat
\`\`\`

### Logs de Depuración

\`\`\`bash
# Ver todos los logs
docker-compose logs

# Logs específicos con timestamps
docker-compose logs -f -t web

# Últimas 100 líneas
docker-compose logs --tail=100 web
\`\`\`

### 🚨 Si Sigues Teniendo Problemas con Migraciones

\`\`\`bash
# Script de reparación completa
chmod +x scripts/fix_migrations_complete.sh
./scripts/fix_migrations_complete.sh
\`\`\`

## 🚀 Producción

### Despliegue con Docker Swarm

\`\`\`bash
# Inicializar Docker Swarm
docker swarm init

# Configurar variables de entorno
export DB_PASSWORD=tu-password-seguro
export SECRET_KEY=tu-secret-key-seguro

# Construir y desplegar
chmod +x scripts/build_and_deploy.sh
./scripts/build_and_deploy.sh
\`\`\`

### Variables de Entorno para Producción

\`\`\`bash
# .env para producción
DEBUG=False
SECRET_KEY=tu-secret-key-muy-seguro
DB_PASSWORD=password-muy-seguro
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
\`\`\`

## 📈 Monitoreo

### Servicios Activos

\`\`\`bash
# Estado de servicios Docker Swarm
docker service ls

# Logs de producción
docker service logs weather-stack_web
\`\`\`

### Métricas

- **📊 Admin Django**: Estadísticas en tiempo real
- **🔍 API Status**: `/api/estadisticas/`
- **💾 Base de Datos**: Consultas de rendimiento
- **⚡ Redis**: Monitoreo de tareas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **🐛 Issues**: [GitHub Issues](link-to-issues)
- **📧 Email**: tu-email@ejemplo.com
- **📖 Documentación**: [Wiki del proyecto](link-to-wiki)

---

**🌟 ¡Gracias por usar OHMC Weather API!**
