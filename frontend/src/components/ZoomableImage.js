"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

const ZoomableImage = ({ src, alt, className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const modalRef = useRef(null)
  const imageRef = useRef(null)

  // Reset state when modal opens
  const openModal = useCallback(() => {
    setIsModalOpen(true)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setImageLoaded(false)
    document.body.style.overflow = "hidden"
  }, [])

  // Close modal and cleanup
  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setImageLoaded(false)
    document.body.style.overflow = "unset"
  }, [])

  // Zoom functions
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

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e) => {
      if (!isModalOpen || !imageLoaded) return

      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setScale((prev) => Math.min(Math.max(prev * delta, 0.5), 5))
    },
    [isModalOpen, imageLoaded],
  )

  // Mouse drag handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (!isModalOpen || !imageLoaded || scale <= 1) return

      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    },
    [isModalOpen, imageLoaded, scale, position],
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

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e) => {
      if (!isModalOpen || !imageLoaded) return

      if (e.touches.length === 1 && scale > 1) {
        const touch = e.touches[0]
        setIsDragging(true)
        setDragStart({
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        })
      }
    },
    [isModalOpen, imageLoaded, scale, position],
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

  // Click outside to close
  const handleModalClick = useCallback(
    (e) => {
      if (e.target === modalRef.current) {
        closeModal()
      }
    },
    [closeModal],
  )

  // Keyboard handlers
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

  // Effect for global event listeners
  useEffect(() => {
    if (isModalOpen) {
      // Keyboard events
      document.addEventListener("keydown", handleKeyDown)

      // Mouse events (only when dragging)
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isModalOpen, isDragging, handleKeyDown, handleMouseMove, handleMouseUp])

  // Image load handler
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Get cursor style
  const getCursorStyle = () => {
    if (!imageLoaded) return "wait"
    if (isDragging) return "grabbing"
    if (scale > 1) return "grab"
    return "zoom-in"
  }

  return (
    <>
      {/* Thumbnail image */}
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={openModal}
        loading="lazy"
      />

      {/* Modal */}
      {isModalOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={handleModalClick}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <button
              onClick={zoomOut}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={zoomIn}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
              disabled={scale >= 5}
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={resetZoom}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={closeModal}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Zoom level indicator */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-20 text-white px-3 py-1 rounded-lg text-sm">
            {Math.round(scale * 100)}%
          </div>

          {/* Image container */}
          <div className="relative max-w-full max-h-full overflow-hidden">
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
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              draggable={false}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg text-sm text-center">
            <div>🖱️ Rueda del mouse: Zoom | 🤏 Arrastrar: Mover</div>
            <div>⌨️ ESC: Cerrar | +/-: Zoom | 0: Reset</div>
          </div>
        </div>
      )}
    </>
  )
}

export default ZoomableImage
