"use client"

import { useState, useRef, useEffect, useCallback } from "react"

const ZoomableImage = ({ src, alt, className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const modalRef = useRef(null)
  const imageRef = useRef(null)

  // Abrir modal
  const openModal = useCallback(() => {
    setIsModalOpen(true)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setImageLoaded(false)
    document.body.style.overflow = "hidden"
  }, [])

  // Cerrar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setImageLoaded(false)
    document.body.style.overflow = "unset"
  }, [])

  // Funciones de zoom
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.5, 5))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.5, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Manejo de rueda del mouse
  const handleWheel = useCallback(
    (e) => {
      if (!isModalOpen) return

      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5))
    },
    [isModalOpen],
  )

  // Manejo de mouse para arrastrar
  const handleMouseDown = useCallback(
    (e) => {
      if (!isModalOpen || scale <= 1) return

      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    },
    [isModalOpen, scale, position],
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !isModalOpen) return

      e.preventDefault()
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    },
    [isDragging, isModalOpen, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Manejo de touch para móviles
  const handleTouchStart = useCallback(
    (e) => {
      if (!isModalOpen || scale <= 1) return

      if (e.touches.length === 1) {
        const touch = e.touches[0]
        setIsDragging(true)
        setDragStart({
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        })
      }
    },
    [isModalOpen, scale, position],
  )

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || !isModalOpen || e.touches.length !== 1) return

      e.preventDefault()
      const touch = e.touches[0]
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      })
    },
    [isDragging, isModalOpen, dragStart],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Manejo de teclado
  const handleKeyDown = useCallback(
    (e) => {
      if (!isModalOpen) return

      switch (e.key) {
        case "Escape":
          closeModal()
          break
        case "+":
        case "=":
          e.preventDefault()
          zoomIn()
          break
        case "-":
          e.preventDefault()
          zoomOut()
          break
        case "0":
          e.preventDefault()
          resetZoom()
          break
        default:
          break
      }
    },
    [isModalOpen, closeModal, zoomIn, zoomOut, resetZoom],
  )

  // Click fuera del modal para cerrar
  const handleModalClick = useCallback(
    (e) => {
      if (e.target === modalRef.current) {
        closeModal()
      }
    },
    [closeModal],
  )

  // Event listeners globales
  useEffect(() => {
    if (!isModalOpen) return

    // Eventos de teclado
    document.addEventListener("keydown", handleKeyDown)

    // Eventos de mouse solo cuando está arrastrando
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isModalOpen, isDragging, handleKeyDown, handleMouseMove, handleMouseUp])

  // Event listener para wheel en el modal
  useEffect(() => {
    if (!isModalOpen || !modalRef.current) return

    const modalElement = modalRef.current
    modalElement.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      modalElement.removeEventListener("wheel", handleWheel)
    }
  }, [isModalOpen, handleWheel])

  // Manejo de carga de imagen
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback(
    (e) => {
      console.error("Error cargando imagen:", src)
      e.target.style.display = "none"
      const errorDiv = e.target.nextElementSibling
      if (errorDiv) {
        errorDiv.style.display = "flex"
      }
    },
    [src],
  )

  // Obtener estilo del cursor
  const getCursorStyle = () => {
    if (!imageLoaded) return "wait"
    if (isDragging) return "grabbing"
    if (scale > 1) return "grab"
    return "zoom-in"
  }

  return (
    <>
      {/* Imagen miniatura */}
      <div className={`relative group cursor-pointer ${className}`}>
        <img
          src={src || "/placeholder.svg?height=400&width=600"}
          alt={alt}
          className="w-full h-auto rounded-lg transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
          onClick={openModal}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />

        {/* Div de error oculto */}
        <div className="hidden items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Imagen no disponible</p>
            <p className="text-xs text-gray-400">URL: {src}</p>
          </div>
        </div>

        {/* Overlay de hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Modal de zoom */}
      {isModalOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={handleModalClick}
        >
          {/* Controles */}
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 text-white p-3 rounded-full transition-all"
              title="Zoom Out"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= 5}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 text-white p-3 rounded-full transition-all"
              title="Zoom In"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
              title="Reset"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              onClick={closeModal}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
              title="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Indicador de zoom */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {Math.round(scale * 100)}%
          </div>

          {/* Contenedor de imagen */}
          <div className="relative max-w-full max-h-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              ref={imageRef}
              src={src || "/placeholder.svg"}
              alt={alt}
              className="max-w-none transition-transform duration-200 ease-out select-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                cursor: getCursorStyle(),
                maxWidth: "none",
                maxHeight: "none",
              }}
              onLoad={handleImageLoad}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              draggable={false}
            />
          </div>

          {/* Instrucciones */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg text-sm text-center">
            <div>🖱️ Rueda: Zoom | 🤏 Arrastrar: Mover</div>
            <div>⌨️ ESC: Cerrar | +/-: Zoom | 0: Reset</div>
          </div>
        </div>
      )}
    </>
  )
}

export default ZoomableImage
