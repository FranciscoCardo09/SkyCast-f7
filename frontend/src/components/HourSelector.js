"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"

const HourSelector = ({ selectedHour, onHourChange, availableHours = [] }) => {
  const [currentHourIndex, setCurrentHourIndex] = useState(0)

  // Generar todas las horas posibles (0-48 para WRF)
  const allHours = Array.from({ length: 49 }, (_, i) => `${i.toString().padStart(2, "0")}:00`)

  // Filtrar solo las horas que tienen datos disponibles
  const hoursWithData = availableHours.length > 0 ? availableHours : allHours.slice(0, 25) // Primeras 25 horas por defecto

  useEffect(() => {
    const index = hoursWithData.findIndex((hour) => hour === selectedHour)
    if (index !== -1) {
      setCurrentHourIndex(index)
    }
  }, [selectedHour, hoursWithData])

  const goToPreviousHour = () => {
    const newIndex = currentHourIndex > 0 ? currentHourIndex - 1 : hoursWithData.length - 1
    setCurrentHourIndex(newIndex)
    onHourChange(hoursWithData[newIndex])
  }

  const goToNextHour = () => {
    const newIndex = currentHourIndex < hoursWithData.length - 1 ? currentHourIndex + 1 : 0
    setCurrentHourIndex(newIndex)
    onHourChange(hoursWithData[newIndex])
  }

  const selectHour = (hour) => {
    const index = hoursWithData.findIndex((h) => h === hour)
    setCurrentHourIndex(index)
    onHourChange(hour)
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-4">
        <Clock className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Hora de Pronóstico (ARG)</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {hoursWithData.length} horas disponibles
        </span>
      </div>

      {/* Navegador principal con botones << >> */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={goToPreviousHour}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-6 py-3 min-w-[120px] text-center">
          <div className="text-2xl font-bold text-blue-800">{selectedHour}</div>
          <div className="text-xs text-blue-600">
            {currentHourIndex + 1} de {hoursWithData.length}
          </div>
        </div>

        <button
          onClick={goToNextHour}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid de horas rápidas */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {hoursWithData.map((hour) => (
          <button
            key={hour}
            onClick={() => selectHour(hour)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border
              ${
                selectedHour === hour
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }
            `}
          >
            {hour}
          </button>
        ))}
      </div>

      {/* Atajos rápidos */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-gray-500">Atajos:</span>
        {["00:00", "06:00", "12:00", "18:00", "24:00"].map((hour) => {
          if (hoursWithData.includes(hour)) {
            return (
              <button
                key={hour}
                onClick={() => selectHour(hour)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                {hour}
              </button>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

export default HourSelector
