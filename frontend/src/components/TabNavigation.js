"use client"

import { Thermometer, Flame, Wind, Activity } from "lucide-react"

const TabNavigation = ({ activeTab, onTabChange, estadisticas }) => {
  const tabs = [
    {
      id: "WRF",
      label: "WRF",
      icon: Thermometer,
      description: "Modelo meteorológico",
      count: estadisticas?.variables_wrf?.length || 0,
    },
    {
      id: "FWI",
      label: "FWI",
      icon: Flame,
      description: "Índice de peligro de incendio",
      count: 1,
    },
    {
      id: "Gases",
      label: "Gases",
      icon: Activity,
      description: "Medición de gases",
      count: 2,
    },
    {
      id: "Vientos",
      label: "Vientos",
      icon: Wind,
      description: "Ráfagas en rutas",
      count: 1,
    },
  ]

  return (
    <div className="card">
      <div className="flex flex-wrap gap-3 justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                tab-button flex items-center space-x-3 min-w-[140px]
                ${isActive ? "tab-button-active" : "tab-button-inactive"}
              `}
            >
              <Icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TabNavigation
