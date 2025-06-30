"use client"

import { useState, useEffect } from "react"
import TabNavigation from "../components/TabNavigation"
import WRFSection from "../components/WRFSection"
import GasesSection from "../components/GasesSection"
import FWISection from "../components/FWISection"
import VientosSection from "../components/VientosSection"
import { fetchProductos, fetchEstadisticas } from "../services/api"

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("WRF")
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productosData, statsData] = await Promise.all([fetchProductos(), fetchEstadisticas()])
      setProductos(productosData.results || productosData)
      setEstadisticas(statsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderActiveSection = () => {
    const commonProps = { productos, loading, onRefresh: loadData }

    switch (activeTab) {
      case "WRF":
        return <WRFSection {...commonProps} />
      case "FWI":
        return <FWISection {...commonProps} />
      case "Gases":
        return <GasesSection {...commonProps} />
      case "Vientos":
        return <VientosSection {...commonProps} />
      default:
        return <WRFSection {...commonProps} />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} estadisticas={estadisticas} />

      <div className="animate-slide-up">{renderActiveSection()}</div>
    </div>
  )
}

export default Dashboard
