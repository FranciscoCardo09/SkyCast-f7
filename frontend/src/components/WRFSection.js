"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Thermometer, CloudRain, Wind, Droplets, AlertTriangle } from "lucide-react"
import DatePicker from "react-datepicker"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { fetchProductos } from "../services/api"
import ZoomableImage from "./ZoomableImage"
import "react-datepicker/dist/react-datepicker.css"

const WRFSection = ({ loading: initialLoading }) => {
  const [selectedDate, setSelectedDate] = useState(subDays(new Date(), 1))
  const [selectedTime, setSelectedTime] = useState("12:00")
  const [selectedVariable, setSelectedVariable] = useState("t2")
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(initialLoading)
  const [currentImage, setCurrentImage] = useState(null)
  const [debugInfo, setDebugInfo] = useState("")

  const variables = [
    {
      id: "t2",
      name: "Temperatura a 2m",
      icon: Thermometer,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: "Temperatura del aire a 2 metros sobre el suelo (°C)",
    },
    {
      id: "ppn",
      name: "Precipitación",
      icon: CloudRain,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Tasa instantánea de precipitación (mm/h)",
    },
    {
      id: "wspd10",
      name: "Velocidad Viento",
      icon: Wind,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Velocidad del viento (m/s) a 10 m de altura",
    },
    {
      id: "rh2",
      name: "Humedad Relativa",
      icon: Droplets,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Porcentaje de humedad relativa a 2 metros",
    },
    {
      id: "ppnaccum",
      name: "Precipitación Acumulada",
      icon: CloudRain,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Acumulado total de precipitación (mm)",
    },
  ]

  const timeSlots = ["00:00", "06:00", "12:00", "18:00"]

  useEffect(() => {
    loadWRFData()
  }, [selectedDate, selectedTime, selectedVariable])

  const loadWRFData = async () => {
    try {
      setLoading(true)
      const dateStr = format(selectedDate, "yyyy-MM-dd")

      console.log("Buscando productos WRF para:", {
        fecha: dateStr,
        variable: selectedVariable,
        hora: selectedTime,
      })

      const response = await fetchProductos({
        tipo: "wrf_cba",
        fecha: dateStr,
        variable: selectedVariable,
      })

      const productosData = response.results || response
      console.log("Productos encontrados:", productosData.length)
      setProductos(productosData)

      // Buscar imagen para la hora seleccionada
      const matchingProduct = productosData.find((p) => {
        const horaMatch =
          p.nombre_archivo.includes(`+${selectedTime.replace(":", "")}`) ||
          p.nombre_archivo.includes(`_${selectedTime.replace(":", "")}`)
        return horaMatch
      })

      console.log("Producto seleccionado:", matchingProduct)

      // Usar imagen_url (imagen guardada) o url_imagen (externa) como fallback
      const imageUrl = matchingProduct?.imagen_url || matchingProduct?.url_imagen
      setCurrentImage(imageUrl || null)

      setDebugInfo(`Productos: ${productosData.length} | Imagen: ${imageUrl ? "Disponible" : "No disponible"}`)
    } catch (error) {
      console.error("Error loading WRF data:", error)
      setDebugInfo(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Thermometer className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Modelo WRF - Córdoba</h2>
            <p className="text-gray-600">
              Productos horarios del modelo meteorológico WRF para Córdoba. Imágenes guardadas localmente.
            </p>
            {debugInfo && <p className="text-sm text-blue-600 mt-2">Debug: {debugInfo}</p>}
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Seleccionar fecha</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              dateFormat="dd/MM/yyyy"
              locale={es}
              maxDate={new Date()}
              minDate={subDays(new Date(), 7)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Última semana disponible</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha seleccionada</label>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">{format(selectedDate, "dd/MM/yyyy", { locale: es })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variable Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variables.map((variable) => {
          const Icon = variable.icon
          const isSelected = selectedVariable === variable.id

          return (
            <button
              key={variable.id}
              onClick={() => setSelectedVariable(variable.id)}
              className={`
                variable-card text-left
                ${isSelected ? `variable-card-selected ${variable.bgColor} ${variable.borderColor}` : ""}
              `}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${variable.bgColor} border ${variable.borderColor}`}
              >
                <Icon className={`h-6 w-6 ${variable.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{variable.name}</h3>
              <p className="text-sm text-gray-600">{variable.description}</p>
            </button>
          )
        })}
      </div>

      {/* Time Selection */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Hora de Pronóstico (ARG)</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`
                time-button
                ${selectedTime === time ? "time-button-active" : "time-button-inactive"}
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Image Display */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {variables.find((v) => v.id === selectedVariable)?.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{selectedTime} ARG</span>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">📸 Guardada</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : currentImage ? (
          <ZoomableImage
            src={currentImage}
            alt={`${selectedVariable} - ${format(selectedDate, "dd/MM/yyyy")} ${selectedTime}`}
            className="w-full"
          />
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No hay datos disponibles para la fecha y hora seleccionadas</p>
              <p className="text-sm text-gray-400">
                Productos encontrados: {productos.length} | Fecha: {format(selectedDate, "dd/MM/yyyy")} | Variable:{" "}
                {selectedVariable}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WRFSection
