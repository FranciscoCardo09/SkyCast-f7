import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error)
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout")
    }
    return Promise.reject(error)
  },
)

export const fetchProductos = async (params = {}) => {
  try {
    console.log("Fetching productos with params:", params)
    const response = await api.get("/productos/", { params })
    console.log("API Response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching productos:", error)
    throw error
  }
}

export const fetchProductoDetail = async (id) => {
  try {
    const response = await api.get(`/productos/${id}/`)
    return response.data
  } catch (error) {
    console.error("Error fetching producto detail:", error)
    throw error
  }
}

export const fetchTipos = async () => {
  try {
    const response = await api.get("/tipos/")
    return response.data
  } catch (error) {
    console.error("Error fetching tipos:", error)
    throw error
  }
}

export const fetchUltimos = async () => {
  try {
    const response = await api.get("/ultimos/")
    return response.data
  } catch (error) {
    console.error("Error fetching ultimos:", error)
    throw error
  }
}

export const fetchEstadisticas = async () => {
  try {
    const response = await api.get("/estadisticas/")
    return response.data
  } catch (error) {
    console.error("Error fetching estadisticas:", error)
    throw error
  }
}

export const fetchProductosPorFechaHora = async (fecha, hora, variable = null) => {
  try {
    const params = { fecha, hora }
    if (variable) params.variable = variable

    const response = await api.get("/productos/fecha-hora/", { params })
    return response.data
  } catch (error) {
    console.error("Error fetching productos por fecha/hora:", error)
    throw error
  }
}

export default api
