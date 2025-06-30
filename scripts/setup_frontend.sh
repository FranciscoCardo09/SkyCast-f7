#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚛️ OHMC Frontend React - Setup Completo${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Función para mostrar errores y salir
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar progreso
progress() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# 1. Verificar Node.js
progress "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    error_exit "Node.js no está instalado. Por favor instala Node.js 18+ primero."
fi

if ! command -v npm &> /dev/null; then
    error_exit "npm no está instalado. Por favor instala npm primero."
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    error_exit "Node.js versión 16+ requerida. Versión actual: $(node -v)"
fi

success "Node.js $(node -v) disponible"

# 2. Navegar a frontend
if [ ! -d "frontend" ]; then
    error_exit "Directorio frontend no encontrado. Ejecuta este script desde la raíz del proyecto."
fi

cd frontend

# 3. Instalar dependencias
progress "Instalando dependencias de React..."
npm install
if [ $? -ne 0 ]; then
    error_exit "Falló la instalación de dependencias"
fi

success "Dependencias instaladas"

# 4. Verificar que el backend esté corriendo
progress "Verificando conexión con el backend..."
if curl -f http://localhost:8000/api/productos/ > /dev/null 2>&1; then
    success "Backend disponible en http://localhost:8000"
else
    echo -e "${YELLOW}⚠️ Backend no disponible. Asegúrate de ejecutar primero:${NC}"
    echo -e "${YELLOW}   ./scripts/setup_complete_system.sh${NC}"
    echo ""
    echo -e "${BLUE}ℹ️ Continuando con el setup del frontend...${NC}"
fi

# 5. Crear archivo de servicios API si no existe
progress "Configurando servicios de API..."
if [ ! -f "src/services/api.js" ]; then
    mkdir -p src/services
    cat > src/services/api.js << 'EOF'
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

export const fetchProductos = async (params = {}) => {
  try {
    const response = await api.get('/productos/', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching productos:', error)
    throw error
  }
}

export const fetchProductoDetail = async (id) => {
  try {
    const response = await api.get(`/productos/${id}/`)
    return response.data
  } catch (error) {
    console.error('Error fetching producto detail:', error)
    throw error
  }
}

export const fetchTipos = async () => {
  try {
    const response = await api.get('/tipos/')
    return response.data
  } catch (error) {
    console.error('Error fetching tipos:', error)
    throw error
  }
}

export const fetchUltimos = async () => {
  try {
    const response = await api.get('/ultimos/')
    return response.data
  } catch (error) {
    console.error('Error fetching ultimos:', error)
    throw error
  }
}

export const fetchEstadisticas = async () => {
  try {
    const response = await api.get('/estadisticas/')
    return response.data
  } catch (error) {
    console.error('Error fetching estadisticas:', error)
    throw error
  }
}

export const fetchProductosPorFechaHora = async (fecha, hora, variable = null) => {
  try {
    const params = { fecha, hora }
    if (variable) params.variable = variable
    
    const response = await api.get('/productos/fecha-hora/', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching productos por fecha/hora:', error)
    throw error
  }
}

export default api
EOF
    success "Servicios de API configurados"
fi

echo ""
echo -e "${GREEN}🎉 ¡FRONTEND REACT CONFIGURADO!${NC}"
echo -e "${GREEN}===============================${NC}"
echo ""
echo -e "${BLUE}🚀 Para iniciar el frontend:${NC}"
echo -e "  ${YELLOW}cd frontend${NC}"
echo -e "  ${YELLOW}npm start${NC}"
echo ""
echo -e
