"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Video, VideoOff, RefreshCw } from "lucide-react"

interface VideoStreamProps {
  streamUrl: string
  disabled?: boolean
  className?: string
  forceEnabled?: boolean
}

export function VideoStream({ streamUrl, disabled = false, className, forceEnabled = false }: VideoStreamProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [key, setKey] = useState(0)
  const [buttonPulse, setButtonPulse] = useState(false)
  const prevForceEnabled = useRef(false)

  // Auto-disable cuando se desconecta
  useEffect(() => {
    if (disabled && isEnabled) {
      setIsEnabled(false)
      setHasError(false)
    }
  }, [disabled, isEnabled])

  // Auto-enable cuando forceEnabled cambia de false a true (IA activa el video)
  useEffect(() => {
    // Solo activar si forceEnabled cambió de false a true
    const justEnabled = forceEnabled && !prevForceEnabled.current
    
    if (justEnabled && !isEnabled && !disabled) {
      // Marcar como procesado solo si vamos a activar
      prevForceEnabled.current = true
      
      // Efecto visual: pulse en el botón
      setButtonPulse(true)
      
      // Después de 400ms, "click" el botón
      const timer = setTimeout(() => {
        setButtonPulse(false)
        setIsEnabled(true)
        setIsLoading(true)
        setHasError(false)
      }, 400)
      
      return () => clearTimeout(timer)
    }
    
    // Si forceEnabled se vuelve false, resetear el ref
    if (!forceEnabled) {
      prevForceEnabled.current = false
    }
  }, [forceEnabled, isEnabled, disabled])

  const handleToggle = useCallback(() => {
    if (isEnabled) {
      setIsEnabled(false)
      setHasError(false)
    } else {
      setIsEnabled(true)
      setIsLoading(true)
      setHasError(false)
    }
  }, [isEnabled])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  const handleRefresh = useCallback(() => {
    setKey((k) => k + 1)
    setIsLoading(true)
    setHasError(false)
  }, [])

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header con controles */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Video en vivo
          </span>
          {isEnabled && !hasError && !isLoading && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-500 font-medium">LIVE</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={disabled}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
          )}
          <Button
            variant={isEnabled ? "outline" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              "h-7 text-xs transition-all",
              buttonPulse && "scale-95 ring-2 ring-primary ring-offset-2 animate-pulse",
              isEnabled && "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            )}
          >
            {isEnabled ? (
              <>
                <VideoOff className="h-3.5 w-3.5 mr-1" />
                Apagar
              </>
            ) : (
              <>
                <Video className="h-3.5 w-3.5 mr-1" />
                Ver video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contenedor del video - se adapta al espacio disponible */}
      <div
        className={cn(
          "relative flex-1 min-h-[200px] rounded-xl overflow-hidden border-2",
          "bg-black transition-all duration-300",
          isEnabled 
            ? "border-border" 
            : "border-dashed border-muted-foreground/20 bg-muted/30"
        )}
      >
        {isEnabled ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={key}
              src={streamUrl}
              alt="Video stream del rover"
              className={cn(
                "absolute inset-0 w-full h-full object-contain",
                "transition-opacity duration-300",
                isLoading || hasError ? "opacity-0" : "opacity-100"
              )}
              onLoad={handleLoad}
              onError={handleError}
            />

            {/* Loading state */}
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
                <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin mb-3" />
                <span className="text-sm text-muted-foreground">
                  Conectando al stream...
                </span>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
                <VideoOff className="h-10 w-10 text-muted-foreground mb-3" />
                <span className="text-sm text-muted-foreground mb-3">
                  No se puede conectar al video
                </span>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Reintentar
                </Button>
              </div>
            )}
          </>
        ) : (
          // Estado apagado
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <VideoOff className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <span className="text-sm text-muted-foreground/50">
              {disabled ? "Conectate primero" : "Click en 'Ver video' para iniciar"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
