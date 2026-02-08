"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Video, 
  VideoOff,
  Mic,
  Square
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: { name: string; success: boolean }[]
}

interface AIChatProps {
  backendUrl: string
  disabled?: boolean
  className?: string
  onVideoControl?: (action: "show" | "hide") => void
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  move_forward: <ArrowUp className="h-3 w-3" />,
  move_backward: <ArrowDown className="h-3 w-3" />,
  move_left: <ArrowLeft className="h-3 w-3" />,
  move_right: <ArrowRight className="h-3 w-3" />,
  show_video: <Video className="h-3 w-3" />,
  hide_video: <VideoOff className="h-3 w-3" />,
}

const TOOL_LABELS: Record<string, string> = {
  move_forward: "Adelante",
  move_backward: "Atrás",
  move_left: "Izquierda",
  move_right: "Derecha",
  show_video: "Ver video",
  hide_video: "Ocultar video",
}

export function AIChat({ backendUrl, disabled = false, className, onVideoControl }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentTools, setCurrentTools] = useState<string[]>([])
  
  // Estados para grabación de audio
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll al último mensaje - usando el viewport real del ScrollArea
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      // ScrollArea de shadcn tiene un div con data-radix-scroll-area-viewport
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, currentTools, scrollToBottom])

  // Iniciar grabación de audio
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        // Detener el stream
        stream.getTracks().forEach(track => track.stop())
        
        // Crear blob y enviar a transcribir
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error al acceder al micrófono:", error)
    }
  }, [])

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Transcribir audio con Whisper
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      
      const response = await fetch(`${backendUrl}/transcribe`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.text) {
        setInput(data.text)
        // Enfocar el input para que el usuario pueda editar o enviar
        inputRef.current?.focus()
      }
    } catch (error) {
      console.error("Error al transcribir audio:", error)
    } finally {
      setIsTranscribing(false)
    }
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || disabled) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setCurrentTools([])

    // Preparar historial para el backend
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      const decoder = new TextDecoder()
      let assistantContent = ""
      let toolCalls: { name: string; success: boolean }[] = []

      // Crear mensaje del asistente vacío
      const assistantId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "content") {
                assistantContent += data.content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                )
              } else if (data.type === "tool_start") {
                setCurrentTools((prev) => [...prev, data.tool])
              } else if (data.type === "tool_result") {
                toolCalls.push({
                  name: data.tool,
                  success: data.result?.success ?? false,
                })
                setCurrentTools((prev) => prev.filter((t) => t !== data.tool))
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...toolCalls] }
                      : m
                  )
                )
              } else if (data.type === "video_control") {
                // Manejar control de video
                if (onVideoControl) {
                  onVideoControl(data.action)
                }
              } else if (data.type === "error") {
                assistantContent = `Error: ${data.error}`
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                )
              }
            } catch {
              // Ignorar líneas que no son JSON válido
            }
          }
        }
      }
    } catch (error) {
      console.error("Error en chat:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Error al comunicarse con el servidor. Verificá la conexión.",
        },
      ])
    } finally {
      setIsLoading(false)
      setCurrentTools([])
    }
  }, [input, isLoading, disabled, messages, backendUrl, onVideoControl])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Chat con IA
        </span>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground/60 text-sm py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Hablá con la IA para controlar el rover</p>
              <p className="text-xs mt-1">Ej: "avanzá", "girá a la derecha", "mostrame la cámara"</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-muted"
                )}
              >
                {message.content || (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {/* Tool calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.toolCalls.map((tc, i) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                          tc.success
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-red-500/20 text-red-700 dark:text-red-400"
                        )}
                      >
                        {TOOL_ICONS[tc.name]}
                        {TOOL_LABELS[tc.name] || tc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-background" />
                </div>
              )}
            </div>
          ))}

          {/* Indicador de herramientas ejecutándose */}
          {currentTools.length > 0 && (
            <div className="flex gap-2 justify-start">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-xl px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Ejecutando: {currentTools.map((t) => TOOL_LABELS[t] || t).join(", ")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          {/* Botón de micrófono */}
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isLoading || isTranscribing}
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            className={cn(
              "shrink-0 transition-all",
              isRecording && "animate-pulse"
            )}
            title={isRecording ? "Detener grabación" : "Grabar audio"}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isTranscribing 
                ? "Transcribiendo..." 
                : isRecording 
                  ? "Grabando..." 
                  : disabled 
                    ? "Conectate primero..." 
                    : "Escribí o grabá un mensaje..."
            }
            disabled={disabled || isLoading || isRecording}
            className="flex-1 text-sm"
          />
          
          <Button
            onClick={sendMessage}
            disabled={disabled || isLoading || !input.trim() || isRecording}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
