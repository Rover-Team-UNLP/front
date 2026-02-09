/**
 * Helpers para URLs del backend a partir de la URL WebSocket o base HTTP.
 */

/**
 * Convierte URL WebSocket a URL base HTTP (ws → http, wss → https).
 */
export function getHttpUrl(wsUrl: string): string {
  try {
    const url = new URL(wsUrl)
    const protocol = url.protocol === "wss:" ? "https:" : "http:"
    return `${protocol}//${url.host}`
  } catch {
    return "http://localhost:8080"
  }
}

/**
 * URL del stream MJPEG de video.
 */
export function getVideoStreamUrl(wsUrl: string): string {
  return `${getHttpUrl(wsUrl)}/video/stream`
}

/**
 * URL del endpoint de chat (base HTTP).
 */
export function getChatUrl(baseHttpUrl: string): string {
  return `${baseHttpUrl}/chat`
}

/**
 * URL del endpoint de transcripción (base HTTP).
 */
export function getTranscribeUrl(baseHttpUrl: string): string {
  return `${baseHttpUrl}/transcribe`
}
