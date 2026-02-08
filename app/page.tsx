"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRover } from "@/hooks/use-rover"
import { ControlPad } from "@/components/rover/control-pad"
import { ConnectionStatus } from "@/components/rover/connection-status"
import { CommandLog } from "@/components/rover/command-log"
import { VideoStream } from "@/components/rover/video-stream"
import { AIChat } from "@/components/rover/ai-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plug, Unplug, X, Gamepad2, MessageSquare } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const DEFAULT_WS_URL = "ws://localhost:8080/ws"

type TabType = "control" | "chat"

// Convierte la URL del WebSocket a URL base HTTP
function getHttpUrl(wsUrl: string): string {
  try {
    const url = new URL(wsUrl)
    const protocol = url.protocol === "wss:" ? "https:" : "http:"
    return `${protocol}//${url.host}`
  } catch {
    return "http://localhost:8080"
  }
}

function getVideoStreamUrl(wsUrl: string): string {
  return `${getHttpUrl(wsUrl)}/video/stream`
}

export default function RoverControlPage() {
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL)
  const [inputUrl, setInputUrl] = useState(DEFAULT_WS_URL)
  const [activeTab, setActiveTab] = useState<TabType>("control")
  const [showVideoInChat, setShowVideoInChat] = useState(false)
  const [connectionPulse, setConnectionPulse] = useState(false)
  
  const videoStreamUrl = getVideoStreamUrl(wsUrl)
  const httpUrl = getHttpUrl(wsUrl)

  const {
    isConnected,
    espConnected,
    error,
    commandLogs,
    connect,
    disconnect,
    moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    clearError,
  } = useRover({ serverUrl: wsUrl })

  // Callback para que la IA controle el video
  const handleVideoControl = useCallback((action: "show" | "hide") => {
    if (action === "show") {
      setShowVideoInChat(true)
      
      // Si no está conectado, conectar automáticamente
      if (!isConnected) {
        setConnectionPulse(true) // Activar animación
        connect()
        
        // Quitar animación después de 2 segundos
        setTimeout(() => setConnectionPulse(false), 2000)
      }
    } else {
      setShowVideoInChat(false)
    }
  }, [isConnected, connect])

  const handleConnect = () => {
    setWsUrl(inputUrl)
    setTimeout(connect, 0)
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Solo manejar teclas en modo control
      if (activeTab !== "control") return
      if (!espConnected) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          event.preventDefault()
          moveForward()
          break
        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault()
          moveBackward()
          break
        case "ArrowLeft":
        case "a":
        case "A":
          event.preventDefault()
          moveLeft()
          break
        case "ArrowRight":
        case "d":
        case "D":
          event.preventDefault()
          moveRight()
          break
      }
    },
    [activeTab, espConnected, moveForward, moveBackward, moveLeft, moveRight]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <main className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header compacto */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="UNLP"
            width={140}
            height={28}
            className="hidden sm:block"
            priority
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Control de Rover</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">ESP32 WebSocket</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="ws://ip:8080/ws"
            className="font-mono text-xs w-40 sm:w-56 h-8"
            disabled={isConnected}
          />
          {isConnected ? (
            <Button
              onClick={disconnect}
              variant="outline"
              size="sm"
              className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent h-8"
            >
              <Unplug className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Desconectar</span>
            </Button>
          ) : (
            <Button 
              onClick={handleConnect} 
              size="sm" 
              className={cn(
                "shrink-0 h-8 transition-all",
                connectionPulse && "animate-pulse ring-2 ring-primary ring-offset-2"
              )}
            >
              <Plug className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Conectar</span>
            </Button>
          )}
        </div>
      </header>

      {/* Status bar con tabs */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-muted/30 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <ConnectionStatus isConnected={isConnected} espConnected={espConnected} />
          
          {/* Tabs */}
          <div className="flex items-center gap-1 ml-4">
            <TabButton
              active={activeTab === "control"}
              onClick={() => setActiveTab("control")}
              icon={<Gamepad2 className="h-3.5 w-3.5" />}
              label="Control"
            />
            <TabButton
              active={activeTab === "chat"}
              onClick={() => setActiveTab("chat")}
              icon={<MessageSquare className="h-3.5 w-3.5" />}
              label="Chat IA"
            />
          </div>
        </div>
        
        {/* Error inline */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs">
            <span className="truncate max-w-[200px]">{error}</span>
            <button onClick={clearError} className="hover:text-red-800">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        {activeTab === "control" ? (
          // Vista de Control Manual
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 p-4">
            {/* Video - columna izquierda */}
            <div className="min-h-0 flex flex-col">
              <VideoStream 
                streamUrl={videoStreamUrl} 
                disabled={!isConnected}
                className="flex-1"
              />
            </div>

            {/* Panel derecho - controles + log */}
            <aside className="flex flex-col gap-4 min-h-0">
              {/* Control Pad */}
              <div className="flex flex-col items-center">
                <ControlPad
                  onForward={moveForward}
                  onBackward={moveBackward}
                  onLeft={moveLeft}
                  onRight={moveRight}
                  disabled={!espConnected}
                />
                
                {/* Keyboard hints */}
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center items-center text-muted-foreground text-xs">
                  <Kbd>W</Kbd>
                  <Kbd>A</Kbd>
                  <Kbd>S</Kbd>
                  <Kbd>D</Kbd>
                  <span className="mx-1">o</span>
                  <Kbd>Flechas</Kbd>
                </div>
              </div>

              {/* Command Log */}
              <div className="flex-1 min-h-0 flex flex-col">
                <CommandLog logs={commandLogs} />
              </div>
            </aside>
          </div>
        ) : (
          // Vista de Chat IA
          <div className={cn(
            "h-full grid gap-4 p-4",
            showVideoInChat 
              ? "grid-cols-1 lg:grid-cols-[1fr_400px]" 
              : "grid-cols-1 max-w-2xl mx-auto"
          )}>
            {/* Video - columna izquierda (solo si está activo) */}
            {showVideoInChat && (
              <div className="min-h-0 flex flex-col">
                <VideoStream 
                  streamUrl={videoStreamUrl} 
                  disabled={!isConnected}
                  forceEnabled={showVideoInChat}
                  className="flex-1"
                />
              </div>
            )}

            {/* Chat - columna derecha o única */}
            <div className="min-h-0 flex flex-col border border-border rounded-xl overflow-hidden bg-background">
              <AIChat 
                backendUrl={httpUrl}
                disabled={!isConnected}
                className="flex-1"
                onVideoControl={handleVideoControl}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-border bg-muted text-muted-foreground">
      {children}
    </kbd>
  )
}
