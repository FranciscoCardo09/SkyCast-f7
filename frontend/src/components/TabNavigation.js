"use client"
import { Thermometer, Flame, Activity, Wind } from "lucide-react"

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: "wrf",
      name: "WRF",
      icon: Thermometer,
      description: "Modelo meteorológico",
    },
    {
      id: "fwi",
      name: "FWI",
      icon: Flame,
      description: "Índice de peligro de incendio",
    },
    {
      id: "gases",
      name: "Gases",
      icon: Activity,
      description: "Calidad del aire",
    },
    {
      id: "vientos",
      name: "Vientos",
      icon: Wind,
      description: "Análisis de vientos",
    },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            <Icon className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">{tab.name}</div>
              <div className={`text-xs ${isActive ? "text-blue-100" : "text-gray-500"}`}>{tab.description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default TabNavigation
