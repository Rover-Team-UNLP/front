"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRover } from "@/hooks/use-rover"
import { ControlPad } from "@/components/rover/control-pad"
import { ConnectionStatus } from "@/components/rover/connection-status"
import { CommandLog } from "@/components/rover/command-log"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plug, Unplug } from "lucide-react"
import Image from "next/image"

const DEFAULT_WS_URL = "ws://localhost:8080"

export default function RoverControlPage() {
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL)
  const [inputUrl, setInputUrl] = useState(DEFAULT_WS_URL)

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
    stop,
    clearError,
  } = useRover({ serverUrl: wsUrl })

  const handleConnect = () => {
    setWsUrl(inputUrl)
    setTimeout(connect, 0)
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!espConnected) return
      if (event.target instanceof HTMLInputElement) return

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
        case " ":
          event.preventDefault()
          stop()
          break
      }
    },
    [espConnected, moveForward, moveBackward, moveLeft, moveRight, stop]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <Image
            src="/images/logo.png"
            alt="Facultad de Ingenieria - Universidad Nacional de La Plata"
            width={400}
            height={80}
            className="mb-4"
            priority
          />
          <h1 className="text-2xl font-semibold text-foreground">Control de Rover</h1>
          <p className="text-sm text-muted-foreground">ESP32 WebSocket Controller</p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Connection Section */}
        <section className="mb-8">
          <div className="flex gap-2 mb-4">
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="ws://192.168.1.100:8080"
              className="font-mono text-sm"
              disabled={isConnected}
            />
            {isConnected ? (
              <Button
                onClick={disconnect}
                variant="outline"
                className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
              >
                <Unplug className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            ) : (
              <Button onClick={handleConnect} className="shrink-0">
                <Plug className="h-4 w-4 mr-2" />
                Conectar
              </Button>
            )}
          </div>

          <ConnectionStatus isConnected={isConnected} espConnected={espConnected} />
        </section>

        {/* Control Pad Section */}
        <section className="flex flex-col items-center mb-8">
          <ControlPad
            onForward={moveForward}
            onBackward={moveBackward}
            onLeft={moveLeft}
            onRight={moveRight}
            onStop={stop}
            disabled={!espConnected}
          />

          {/* Keyboard hints */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Kbd>W</Kbd>
            <Kbd>A</Kbd>
            <Kbd>S</Kbd>
            <Kbd>D</Kbd>
            <span className="text-muted-foreground text-xs self-center mx-1">o</span>
            <Kbd>Flechas</Kbd>
            <span className="text-muted-foreground text-xs self-center mx-1">|</span>
            <Kbd>Espacio</Kbd>
            <span className="text-muted-foreground text-xs self-center">= STOP</span>
          </div>
        </section>

        {/* Command Log Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Historial de comandos
          </h2>
          <CommandLog logs={commandLogs} />
        </section>
      </div>
    </main>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 text-xs font-mono rounded border border-border bg-muted text-muted-foreground">
      {children}
    </kbd>
  )
}
