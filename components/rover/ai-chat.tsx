"use client"

import { useRef, useEffect, useCallback } from "react"
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
  Square,
} from "lucide-react"
import { useChat } from "@/hooks/use-chat"

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

export function AIChat({
  backendUrl,
  disabled = false,
  className,
  onVideoControl,
}: AIChatProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    input,
    setInput,
    isLoading,
    currentTools,
    isRecording,
    isTranscribing,
    sendMessage,
    startRecording,
    stopRecording,
  } = useChat({
    backendUrl,
    onVideoControl,
    onTranscribed: () => inputRef.current?.focus(),
    disabled,
  })

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" })
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, currentTools, scrollToBottom])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Chat con IA
        </span>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground/60 text-sm py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Hablá con la IA para controlar el rover</p>
              <p className="text-xs mt-1">
                Ej: &quot;avanzá&quot;, &quot;girá a la derecha&quot;,
                &quot;mostrame la cámara&quot;
              </p>
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

          {currentTools.length > 0 && (
            <div className="flex gap-2 justify-start">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-xl px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>
                    Ejecutando:{" "}
                    {currentTools.map((t) => TOOL_LABELS[t] || t).join(", ")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isLoading || isTranscribing}
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            className={cn("shrink-0 transition-all", isRecording && "animate-pulse")}
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
