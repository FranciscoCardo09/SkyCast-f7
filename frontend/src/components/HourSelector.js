"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, ChevronDown } from "lucide-react"

const HourSelector = ({ selectedHour, onHourChange, availableHours = [] }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [currentHourIndex, setCurrentHourIndex] = useState(0)
  const dropdownRef = useRef(null)

  // Usar las horas disponibles o generar un rango por defecto
  const hoursWithData = availableHours.length > 0 ? availableHours : []

  useEffect(() => {
    const index = hoursWithData.findIndex((hour) => hour === selectedHour)
    if (index !== -1) {
      setCurrentHourIndex(index)
    }
  }, [selectedHour, hoursWithData])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const selectHour = (hour) => {
    const index = hoursWithData.findIndex((h) => h === hour)
    setCurrentHourIndex(index)
    onHourChange(hour)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  if (hoursWithData.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-500">Hora de Pronóstico</h3>
        </div>
        <div className="text-center py-8 text-gray-500">Selecciona una fecha con datos disponibles</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-4">
        <Clock className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Hora de Pronóstico (ARG)</h3>
      </div>

      {/* Selector principal clickeable */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="w-full bg-blue-50 border-2 border-blue-200 rounded-lg px-6 py-4 text-center hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="text-3xl font-bold text-blue-800">{selectedHour}</div>
            <div className="text-sm text-blue-600">
              <div>
                {currentHourIndex + 1} de {hoursWithData.length}
              </div>
              <ChevronDown
                className={`h-4 w-4 mx-auto transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </button>

        {/* Dropdown con todas las horas */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            <div className="p-2">
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
            </div>

            {/* Información adicional en el dropdown */}
            <div className="border-t border-gray-100 p-3 bg-gray-50 text-center">
              <div className="text-xs text-gray-500">💡 {hoursWithData.length} horas disponibles</div>
              {hoursWithData.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Rango: {hoursWithData[0]} - {hoursWithData[hoursWithData.length - 1]}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Información compacta */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500">🕐 Haz click en la hora para ver todas las opciones disponibles</div>
      </div>
    </div>
  )
}

export default HourSelector
