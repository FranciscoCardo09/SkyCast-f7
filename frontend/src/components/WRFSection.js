"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  AlertTriangle,
  Activity,
  Zap,
  Eye,
  Snowflake,
} from "lucide-react"
import DatePicker from "react-datepicker"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { fetchProductos } from "../services/api"
import ZoomableImage from "./ZoomableImage"
import HourSelector from "./HourSelector"
import "react-datepicker/dist/react-datepicker.css"

const WRFSection = ({ loading: initialLoading }) => {
  const [selectedDate, setSelectedDate] = useState(subDays(new Date(), 1))
  const [selectedTime, setSelectedTime] = useState("12:00")
  const [selectedVariable, setSelectedVariable] = useState("t2")
  const [productos, setProductos] = useState([])
  const [availableHours, setAvailableHours] = useState([])
  const [loading, setLoading] = useState(initialLoading)
  const [currentImage, setCurrentImage] = useState(null)
  const [debugInfo, setDebugInfo] = useState("")

  // TODAS las variables WRF disponibles según el JSON
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
      id: "cl",
      name: "Cobertura Nubosa",
      icon: Eye,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      description: "Fracción de cobertura nubosa total",
    },
    {
      id: "ctt",
      name: "Temperatura Tope Nubes",
      icon: CloudRain,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Temperatura en el tope de las nubes (°C)",
    },
    {
      id: "dbz_altura",
      name: "Reflectividad en Altura",
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Simulación de reflectividad radar (dBZ) a diferentes niveles",
    },
    {
      id: "hail",
      name: "Granizo",
      icon: Snowflake,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      description: "Probabilidad o intensidad de granizo",
    },
    {
      id: "max_dbz",
      name: "Reflectividad Máxima",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description: "Máxima reflectividad radar en la columna (dBZ)",
    },
    {
      id: "mcape",
      name: "CAPE Máximo",
      icon: Activity,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Energía potencial convectiva disponible máxima (J/kg)",
    },
    {
      id: "ppn",
      name: "Precipitación Horaria",
      icon: CloudRain,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Tasa instantánea de precipitación (mm/h)",
    },
    {
      id: "ppnaccum",
      name: "Precipitación Acumulada",
      icon: CloudRain,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      description: "Acumulado total de precipitación desde el inicio (mm)",
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
      id: "riesgos_vientos",
      name: "Riesgo por Viento",
      icon: Wind,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Áreas con riesgo de viento fuerte o ráfagas intensas",
    },
    {
      id: "snow",
      name: "Nieve",
      icon: Snowflake,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Acumulación de nieve o probabilidad de nevadas",
    },
    {
      id: "wdir10",
      name: "Dirección del Viento",
      icon: Wind,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Dirección desde donde sopla el viento (°) a 10m",
    },
    {
      id: "wspd10",
      name: "Velocidad del Viento",
      icon: Wind,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Velocidad del viento (m/s) a 10 m de altura",
    },
    {
      id: "wspd_altura",
      name: "Velocidad Viento en Altura",
      icon: Wind,
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      description: "Velocidad del viento a diferentes niveles de altura",
    },
  ]

  useEffect(() => {
    loadWRFData()
  }, [selectedDate, selectedVariable])

  useEffect(() => {
    // Cuando cambian los productos, actualizar horas disponibles y buscar imagen
    updateAvailableHours()
    findImageForSelectedTime()
  }, [productos, selectedTime])

  const loadWRFData = async () => {
    try {
      setLoading(true)
      const dateStr = format(selectedDate, "yyyy-MM-dd")

      console.log("Buscando productos WRF para:", {
        fecha: dateStr,
        variable: selectedVariable,
      })

      const response = await fetchProductos({
        tipo: "wrf_cba",
        fecha: dateStr,
        variable: selectedVariable,
      })

      const productosData = response.results || response
      console.log("Productos encontrados:", productosData.length)
      setProductos(productosData)

      setDebugInfo(`Productos: ${productosData.length} | Variable: ${selectedVariable}`)
    } catch (error) {
      console.error("Error loading WRF data:", error)
      setDebugInfo(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateAvailableHours = () => {
    // Extraer horas disponibles de los nombres de archivos
    const hours = productos
      .map((p) => {
        // Buscar patrón +HH en el nombre del archivo
        const match = p.nombre_archivo.match(/\+(\d{2})/)
        if (match) {
          const hour = Number.parseInt(match[1])
          return `${hour.toString().padStart(2, "0")}:00`
        }
        return null
      })
      .filter(Boolean)
      .sort((a, b) => {
        const hourA = Number.parseInt(a.split(":")[0])
        const hourB = Number.parseInt(b.split(":")[0])
        return hourA - hourB
      })

    const uniqueHours = [...new Set(hours)]
    setAvailableHours(uniqueHours)

    // Si la hora seleccionada no está disponible, seleccionar la primera disponible
    if (uniqueHours.length > 0 && !uniqueHours.includes(selectedTime)) {
      setSelectedTime(uniqueHours[0])
    }
  }

  const findImageForSelectedTime = () => {
    if (productos.length === 0) {
      setCurrentImage(null)
      return
    }

    // Convertir hora seleccionada a formato +HH
    const selectedHourNumber = Number.parseInt(selectedTime.split(":")[0])
    const hourPattern = `+${selectedHourNumber.toString().padStart(2, "0")}`

    // Buscar producto que coincida con la hora
    const matchingProduct = productos.find((p) => p.nombre_archivo.includes(hourPattern))

    console.log("Buscando imagen para hora:", selectedTime, "patrón:", hourPattern)
    console.log("Producto encontrado:", matchingProduct)

    if (matchingProduct) {
      // Usar imagen_url (imagen guardada) o url_imagen (externa) como fallback
      const imageUrl = matchingProduct.imagen_url || matchingProduct.url_imagen
      setCurrentImage(imageUrl)
      console.log("URL de imagen:", imageUrl)
    } else {
      setCurrentImage(null)
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
              Productos horarios del modelo meteorológico WRF para Córdoba. {variables.length} variables disponibles.
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${variable.bgColor} border ${variable.borderColor}`}
              >
                <Icon className={`h-5 w-5 ${variable.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{variable.name}</h3>
              <p className="text-xs text-gray-600">{variable.description}</p>
            </button>
          )
        })}
      </div>

      {/* Hour Selector with Navigation */}
      <HourSelector selectedHour={selectedTime} onHourChange={setSelectedTime} availableHours={availableHours} />

      {/* Image Display */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {variables.find((v) => v.id === selectedVariable)?.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{selectedTime} ARG</span>
            {currentImage && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">📸 Disponible</span>
            )}
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
                {selectedVariable} | Hora: {selectedTime}
              </p>
              <p className="text-xs text-gray-400 mt-2">Horas disponibles: {availableHours.join(", ") || "Ninguna"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WRFSection
