#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚛️ Completando setup del Frontend React${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar progreso
progress() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Navegar al directorio frontend
cd frontend

# Crear favicon básico
progress "Creando favicon..."
if [ ! -f "public/favicon.ico" ]; then
    # Crear un favicon básico (1x1 pixel transparente)
    echo -e "\x00\x00\x01\x00\x01\x00\x01\x01\x00\x00\x01\x00\x18\x00\x30\x00\x00\x00\x16\x00\x00\x00\x28\x00\x00\x00\x01\x00\x00\x00\x02\x00\x00\x00\x01\x00\x18\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00" > public/favicon.ico
    success "Favicon creado"
fi

# Verificar que todos los archivos necesarios existen
progress "Verificando archivos del frontend..."

required_files=(
    "public/index.html"
    "public/manifest.json"
    "src/index.js"
    "src/App.js"
    "src/index.css"
    "src/services/api.js"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    success "Todos los archivos necesarios están presentes"
else
    echo -e "${YELLOW}⚠️ Archivos faltantes detectados:${NC}"
    for file in "${missing_files[@]}"; do
        echo -e "  - ${RED}$file${NC}"
    done
fi

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    progress "Instalando dependencias..."
    npm install
    success "Dependencias instaladas"
fi

# Verificar conexión con backend
progress "Verificando conexión con backend..."
if curl -f http://localhost:8000/api/productos/ > /dev/null 2>&1; then
    success "Backend disponible en http://localhost:8000"
else
    echo -e "${YELLOW}⚠️ Backend no disponible. Asegúrate de que esté corriendo:${NC}"
    echo -e "${YELLOW}   docker-compose ps${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Frontend React listo!${NC}"
echo -e "${GREEN}========================${NC}"
echo ""
echo -e "${BLUE}🚀 Para iniciar el frontend:${NC}"
echo -e "  ${YELLOW}npm start${NC}"
echo ""
echo -e "${BLUE}🌐 URLs disponibles:${NC}"
echo -e "  - Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "  - Backend API: ${YELLOW}http://localhost:8000/api/${NC}"
echo -e "  - Admin: ${YELLOW}http://localhost:8000/admin${NC}"
echo ""
