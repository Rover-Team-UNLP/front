"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { RoverCommand, RoverMessage, ServerMessage, validateMessage } from "@/lib/rover-protocol"

interface UseRoverOptions {
  serverUrl: string
}

interface CommandLog {
  id: number
  cmd: RoverCommand
  timestamp: Date
  status: "sent" | "ack" | "error"
  message?: string
}

export function useRover({ serverUrl }: UseRoverOptions) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [espConnected, setEspConnected] = useState(false)
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([])
  const [error, setError] = useState<string | null>(null)
  const commandId = useRef(1)

  const addLog = useCallback((log: CommandLog) => {
    setCommandLogs((prev) => [log, ...prev].slice(0, 50)) // Mantener últimos 50 logs
  }, [])

  const updateLogStatus = useCallback((id: number, status: "ack" | "error", message?: string) => {
    setCommandLogs((prev) => prev.map((log) => (log.id === id ? { ...log, status, message } : log)))
  }, [])

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    try {
      const socket = new WebSocket(serverUrl)

      socket.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      socket.onclose = () => {
        setIsConnected(false)
        setEspConnected(false)
      }

      socket.onerror = () => {
        setError("Error de conexión con el servidor")
        setIsConnected(false)
      }

      socket.onmessage = (event) => {
        try {
          const data: ServerMessage = JSON.parse(event.data)

          switch (data.type) {
            case "esp_status":
              setEspConnected(data.connected ?? false)
              break
            case "ack":
              if (data.id) {
                updateLogStatus(data.id, "ack")
              }
              break
            case "error":
              setError(data.message ?? "Error desconocido")
              if (data.id) {
                updateLogStatus(data.id, "error", data.message)
              }
              break
            case "esp_message":
              console.log("Mensaje del ESP32:", data.data)
              break
          }
        } catch {
          console.error("Error parseando mensaje:", event.data)
        }
      }

      ws.current = socket
    } catch {
      setError("No se pudo conectar al servidor")
    }
  }, [serverUrl, updateLogStatus])

  const disconnect = useCallback(() => {
    ws.current?.close()
    ws.current = null
    setIsConnected(false)
    setEspConnected(false)
  }, [])

  useEffect(() => {
    return () => {
      ws.current?.close()
    }
  }, [])

  const sendCommand = useCallback(
    (cmd: RoverCommand, params: number[] = []) => {
      if (ws.current?.readyState !== WebSocket.OPEN) {
        setError("No conectado al servidor")
        return false
      }

      const message: RoverMessage = {
        id: commandId.current,
        cmd,
        params,
      }

      if (!validateMessage(message)) {
        setError("Mensaje inválido")
        return false
      }

      ws.current.send(JSON.stringify(message))

      addLog({
        id: message.id,
        cmd,
        timestamp: new Date(),
        status: "sent",
      })

      commandId.current++
      if (commandId.current > 65535) {
        commandId.current = 1
      }

      return true
    },
    [addLog]
  )

  return {
    // Estado
    isConnected,
    espConnected,
    error,
    commandLogs,

    // Acciones de conexión
    connect,
    disconnect,

    // Comandos del rover
    moveForward: (speed?: number) => sendCommand(RoverCommand.MOVE_FORWARD, speed !== undefined ? [speed] : []),
    moveBackward: (speed?: number) => sendCommand(RoverCommand.MOVE_BACKWARDS, speed !== undefined ? [speed] : []),
    moveLeft: (speed?: number) => sendCommand(RoverCommand.MOVE_LEFT, speed !== undefined ? [speed] : []),
    moveRight: (speed?: number) => sendCommand(RoverCommand.MOVE_RIGHT, speed !== undefined ? [speed] : []),
    stop: () => sendCommand(RoverCommand.STOP),
    sendRaw: sendCommand,

    // Limpiar error
    clearError: () => setError(null),
  }
}
