#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Arreglando y iniciando Frontend React${NC}"
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

# Verificar que estamos en el directorio correcto
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Directorio frontend no encontrado${NC}"
    echo -e "${YELLOW}Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

cd frontend

# Crear directorios necesarios
progress "Creando estructura de directorios..."
mkdir -p public src/components src/pages src/services src/hooks
success "Directorios creados"

# Crear favicon básico si no existe
if [ ! -f "public/favicon.ico" ]; then
    progress "Creando favicon..."
    # Crear un archivo favicon vacío
    touch public/favicon.ico
    success "Favicon creado"
fi

# Verificar archivos críticos
progress "Verificando archivos críticos..."

critical_files=(
    "public/index.html"
    "public/manifest.json" 
    "src/index.js"
    "src/App.js"
    "src/index.css"
)

all_exist=true
for file in "${critical_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Falta: $file${NC}"
        all_exist=false
    else
        echo -e "${GREEN}✅ Existe: $file${NC}"
    fi
done

if [ "$all_exist" = true ]; then
    success "Todos los archivos críticos están presentes"
else
    echo -e "${YELLOW}⚠️ Algunos archivos faltan. Verifica que se hayan creado correctamente.${NC}"
fi

# Instalar dependencias
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    progress "Instalando dependencias..."
    npm install
    success "Dependencias instaladas"
else
    success "Dependencias ya instaladas"
fi

# Verificar backend
progress "Verificando backend..."
if curl -f http://localhost:8000/api/productos/ > /dev/null 2>&1; then
    success "Backend funcionando correctamente"
    
    # Obtener estadísticas del backend
    echo -e "${BLUE}📊 Estadísticas del backend:${NC}"
    curl -s http://localhost:8000/api/estadisticas/ | python3 -m json.tool 2>/dev/null || echo "  - API disponible"
else
    echo -e "${YELLOW}⚠️ Backend no disponible${NC}"
    echo -e "${YELLOW}Verifica que los servicios estén corriendo:${NC}"
    echo -e "${YELLOW}  docker-compose ps${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Iniciando servidor de desarrollo...${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${BLUE}El frontend se abrirá automáticamente en:${NC}"
echo -e "${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Para detener el servidor, presiona Ctrl+C${NC}"
echo ""

# Iniciar el servidor de desarrollo
npm start
