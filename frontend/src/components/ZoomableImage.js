"use client"

import { useState, useRef, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

const ZoomableImage = ({ src, alt, className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef(null)

  const openModal = () => {
    setIsModalOpen(true)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setImageLoaded(false)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setImageLoaded(false)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.5, 0.5))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5))
  }

  // Manejar eventos del mouse
  useEffect(() => {
    if (isModalOpen) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e)
      const handleGlobalMouseUp = () => handleMouseUp()

      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragStart, isModalOpen])

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isModalOpen])

  return (
    <>
      {/* Imagen principal */}
      <div className={`relative group cursor-pointer ${className}`}>
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="w-full h-auto rounded-lg transition-transform duration-200 hover:scale-[1.02]"
          onClick={openModal}
          onError={(e) => {
            e.target.style.display = "none"
            e.target.nextSibling.style.display = "flex"
          }}
        />
        <div className="hidden items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500">Imagen no disponible</p>
        </div>

        {/* Overlay de zoom */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <ZoomIn className="h-6 w-6 text-gray-700" />
          </div>
        </div>
      </div>

      {/* Modal con zoom */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Controles */}
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button
                onClick={handleZoomIn}
                className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={handleZoomOut}
                className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={handleReset}
                className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                title="Reset"
              >
                <RotateCcw className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={closeModal}
                className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
                title="Cerrar"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Imagen con zoom */}
            <div className="flex items-center justify-center min-h-[50vh]">
              <img
                ref={imageRef}
                src={src || "/placeholder.svg"}
                alt={alt}
                className={`max-w-none transition-transform duration-200 select-none ${
                  scale > 1 ? "cursor-move" : "cursor-grab"
                } ${isDragging ? "cursor-grabbing" : ""}`}
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  maxHeight: scale === 1 ? "80vh" : "none",
                  maxWidth: scale === 1 ? "80vw" : "none",
                }}
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
            </div>

            {/* Información de zoom */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg px-4 py-2 shadow-lg">
              <span className="text-sm text-gray-700 font-medium">{Math.round(scale * 100)}%</span>
            </div>

            {/* Instrucciones */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg px-4 py-2 shadow-lg max-w-xs">
              <div className="text-xs text-gray-600">
                <div>🖱️ Rueda: Zoom</div>
                <div>🖱️ Arrastrar: Mover</div>
                <div>📱 Pellizcar: Zoom (móvil)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ZoomableImage
