"use client"

import { useState, useRef, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

const ZoomableImage = ({ src, alt, className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)

  const openModal = () => {
    setIsModalOpen(true)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
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

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragStart, isModalOpen])

  return (
    <>
      {/* Imagen principal */}
      <div className={`relative group ${className}`}>
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="w-full h-auto rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105"
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
          <div className="bg-white rounded-full p-2 shadow-lg">
            <ZoomIn className="h-5 w-5 text-gray-700" />
          </div>
        </div>
      </div>

      {/* Modal con zoom */}
      {isModalOpen && (
        <div className="image-modal" onClick={closeModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Controles */}
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button
                onClick={handleZoomIn}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <ZoomIn className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={handleZoomOut}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <ZoomOut className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={handleReset}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={closeModal}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Imagen con zoom */}
            <img
              ref={imageRef}
              src={src || "/placeholder.svg"}
              alt={alt}
              className={`max-w-none transition-transform duration-200 ${scale > 1 ? "cursor-move" : "cursor-grab"}`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                maxHeight: "90vh",
                maxWidth: "90vw",
              }}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
              draggable={false}
            />

            {/* Información de zoom */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-1 shadow-lg">
              <span className="text-sm text-gray-700">{Math.round(scale * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ZoomableImage
