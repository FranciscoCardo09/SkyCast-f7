"use client"

import { useState, useEffect } from "react"
import { Wind, AlertTriangle } from "lucide-react"
import { fetchProductos } from "../services/api"

const VientosSection = ({ loading: initialLoading }) => {
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(initialLoading)

  useEffect(() => {
    loadVientosData()
  }, [])

  const loadVientosData = async () => {
    try {
      setLoading(true)
      const response = await fetchProductos({ tipo: "rutas_caminera" })
      const productos = response.results || response
      setProducto(productos[0] || null)
    } catch (error) {
      console.error("Error loading vientos data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🛣️ Ráfagas de Viento en Rutas</h2>
        <p className="text-gray-600">
          Animación de ráfagas de viento sobre rutas provinciales para apoyo vial. Información actualizada diariamente a
          las 11:00 UTC para la seguridad en el transporte.
        </p>
      </div>

      {/* Wind Scale */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💨 Escala de Intensidad del Viento</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Wind className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Suave</span>
            </div>
            <p className="text-sm text-green-700">0-20</p>
          </div>
          {/* Additional wind scale categories can be added here */}
        </div>
      </div>

      {/* Product Display */}
      {producto && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Producto de Viento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md font-semibold text-gray-700">Nombre</h4>
              <p>{producto.nombre}</p>
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-700">Descripción</h4>
              <p>{producto.descripcion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-center items-center">
          <span className="text-gray-600">Cargando...</span>
        </div>
      )}

      {/* Error Indicator */}
      {!loading && !producto && (
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-center items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <span className="text-gray-600">No se pudo cargar la información del viento.</span>
        </div>
      )}
    </div>
  )
}

export default VientosSection
