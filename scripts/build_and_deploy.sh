#!/bin/bash

# Script para construir y desplegar en Docker Swarm

echo "🚀 Iniciando proceso de build y deploy..."

# Construir imagen
echo "📦 Construyendo imagen Docker..."
docker build -t weather-api:latest .

# Crear red si no existe
docker network create --driver overlay weather_network 2>/dev/null || true

# Desplegar stack
echo "🚢 Desplegando stack en Docker Swarm..."
docker stack deploy -c docker-compose.prod.yml weather-stack

echo "✅ Deploy completado!"
echo "🌐 API disponible en: http://localhost:8000"
echo "🔧 Admin disponible en: http://localhost:8000/admin"

# Mostrar servicios
echo "📊 Estado de los servicios:"
docker service ls | grep weather-stack
