"use client"

import { useState, useRef, useCallback } from "react"
import { sendChatStreamEvents, transcribeAudio } from "@/lib/api/chat"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: { name: string; success: boolean }[]
}

interface UseChatOptions {
  backendUrl: string
  onVideoControl?: (action: "show" | "hide") => void
  onTranscribed?: () => void
  disabled?: boolean
}

export function useChat({
  backendUrl,
  onVideoControl,
  onTranscribed,
  disabled = false,
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentTools, setCurrentTools] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        setIsTranscribing(true)
        try {
          const result = await transcribeAudio(backendUrl, audioBlob)
          if (result.text) {
            setInput(result.text)
            onTranscribed?.()
          }
        } catch (error) {
          console.error("Error al transcribir audio:", error)
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error al acceder al micrófono:", error)
    }
  }, [backendUrl, onTranscribed])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const sendMessage = useCallback(
    async () => {
      if (!input.trim() || isLoading || disabled) return

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)
      setCurrentTools([])

      const history = messages.map((m) => ({ role: m.role, content: m.content }))

      const assistantId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ])

      let assistantContent = ""
      let toolCalls: { name: string; success: boolean }[] = []

      try {
        for await (const event of sendChatStreamEvents(
          backendUrl,
          userMessage.content,
          history
        )) {
          switch (event.type) {
            case "content":
              assistantContent += event.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              )
              break
            case "tool_start":
              setCurrentTools((prev) => [...prev, event.tool])
              break
            case "tool_result":
              toolCalls.push({
                name: event.tool,
                success: event.result?.success ?? false,
              })
              setCurrentTools((prev) => prev.filter((t) => t !== event.tool))
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, toolCalls: [...toolCalls] } : m
                )
              )
              break
            case "video_control":
              onVideoControl?.(event.action as "show" | "hide")
              break
            case "error":
              assistantContent = `Error: ${event.error}`
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              )
              break
            case "done":
              break
          }
        }
      } catch (error) {
        console.error("Error en chat:", error)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Error al comunicarse con el servidor. Verificá la conexión.",
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
        setCurrentTools([])
      }
    },
    [input, isLoading, disabled, messages, backendUrl, onVideoControl]
  )

  return {
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
  }
}
