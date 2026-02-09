/**
 * API de chat y transcripción con el backend.
 */

import { getChatUrl, getTranscribeUrl } from "@/lib/backend-urls"

export type ChatStreamEvent =
  | { type: "content"; content: string }
  | { type: "tool_start"; tool: string }
  | { type: "tool_result"; tool: string; result: { success?: boolean } }
  | { type: "video_control"; action: string }
  | { type: "error"; error: string }
  | { type: "done" }

export interface ChatMessageInput {
  role: string
  content: string
}

/**
 * Transcribe audio con Whisper. Retorna el texto o error.
 */
export async function transcribeAudio(
  baseUrl: string,
  audioBlob: Blob
): Promise<{ text: string; error?: string }> {
  const url = getTranscribeUrl(baseUrl)
  const formData = new FormData()
  formData.append("audio", audioBlob, "audio.webm")

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}`)
  }

  const data = await response.json()
  return { text: data.text ?? "", error: data.error }
}

/**
 * Envía mensaje al chat y devuelve un async iterable de eventos SSE.
 */
export async function* sendChatStreamEvents(
  baseUrl: string,
  message: string,
  history: ChatMessageInput[]
): AsyncGenerator<ChatStreamEvent> {
  const url = getChatUrl(baseUrl)
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  })

  if (!response.ok) {
    throw new Error(`Error ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("No reader")

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split("\n\n")
    buffer = parts.pop() ?? ""

    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data: "))
      if (line) {
        try {
          const data = JSON.parse(line.slice(6)) as ChatStreamEvent
          yield data
        } catch {
          // Ignorar líneas que no son JSON válido
        }
      }
    }
  }
}
