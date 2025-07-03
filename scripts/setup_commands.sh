#!/bin/bash

echo "🔧 Configurando comandos de Django..."

# Crear estructura de directorios para comandos
mkdir -p productos/management
mkdir -p productos/management/commands

# Crear archivos __init__.py necesarios
touch productos/management/__init__.py
touch productos/management/commands/__init__.py

echo "✅ Estructura de directorios creada"

# Verificar que los servicios estén corriendo
if ! docker-compose ps | grep -q "Up"; then
    echo "🚀 Iniciando servicios..."
    docker-compose up -d
    sleep 10
fi

echo "✅ Comandos configurados correctamente"
