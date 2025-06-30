"use client"

import { useState, useEffect } from "react"
import { Flame, AlertTriangle, Info } from "lucide-react"
import { fetchProductos } from "../services/api"

const FWISection = ({ loading: initialLoading }) => {
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(initialLoading)

  useEffect(() => {
    loadFWIData()
  }, [])

  const loadFWIData = async () => {
    try {
      setLoading(true)
      const response = await fetchProductos({ tipo: "FWI" })
      const productos = response.results || response
      setProducto(productos[0] || null)
    } catch (error) {
      console.error("Error loading FWI data:", error)
    } finally {
      setLoading(false)
    }
  }

  const riskLevels = [
    { level: "Bajo", color: "bg-green-500", range: "0-8", description: "Condiciones favorables, riesgo mínimo" },
    { level: "Moderado", color: "bg-yellow-500", range: "9-16", description: "Precaución necesaria" },
    { level: "Alto", color: "bg-orange-500", range: "17-24", description: "Condiciones peligrosas" },
    { level: "Muy Alto", color: "bg-red-500", range: "25-32", description: "Condiciones muy peligrosas" },
    { level: "Extremo", color: "bg-purple-600", range: "33+", description: "Condiciones extremas" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔥 Índice de Peligro de Incendio (FWI)</h2>
        <p className="text-gray-600">
          El Fire Weather Index (FWI) es un sistema de clasificación numérica del peligro de incendio forestal basado en
          las condiciones meteorológicas. Actualizado diariamente a las 11:00 UTC.
        </p>
      </div>

      {/* Risk Scale */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Escala de Riesgo</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {riskLevels.map((risk, index) => (
            <div key={index} className="text-center">
              <div className={`${risk.color} text-white p-3 rounded-lg mb-2`}>
                <div className="font-bold">{risk.level}</div>
                <div className="text-sm">{risk.range}</div>
              </div>
              <p className="text-xs text-gray-600">{risk.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FWI Image */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Flame className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800">Mapa Actual de Peligro de Incendio</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : producto ? (
          <div className="text-center">
            <img
              src={producto.url_imagen || "/placeholder.svg"}
              alt="Índice de Peligro de Incendio"
              className="max-w-full h-auto rounded-lg shadow-md mx-auto"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "block"
              }}
            />
            <div className="hidden bg-gray-100 p-8 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Imagen no disponible temporalmente</p>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Última actualización: {producto.ultima_fecha || "No disponible"}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No hay datos disponibles</p>
            </div>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-start space-x-3">
          <Info className="h-6 w-6 text-orange-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-orange-800 mb-3">Información sobre el FWI</h3>
            <div className="space-y-2 text-sm text-orange-700">
              <p>
                <strong>Componentes del FWI:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>FFMC:</strong> Contenido de humedad del combustible fino
                </li>
                <li>
                  <strong>DMC:</strong> Contenido de humedad del combustible medio
                </li>
                <li>
                  <strong>DC:</strong> Contenido de humedad del combustible grueso
                </li>
                <li>
                  <strong>ISI:</strong> Índice de propagación inicial
                </li>
                <li>
                  <strong>BUI:</strong> Índice de combustible disponible
                </li>
              </ul>
              <p className="mt-3">
                <strong>Factores considerados:</strong> Temperatura, humedad relativa, velocidad del viento y
                precipitación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FWISection
