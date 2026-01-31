// Comandos que coinciden con el firmware del ESP32 (communication.h: rover_cmd_type_t)
export enum RoverCommand {
  MOVE_FORWARD = 0,
  MOVE_BACKWARDS = 1,
  MOVE_LEFT = 2,
  MOVE_RIGHT = 3,
}

export interface RoverMessage {
  id: number // uint16_t - debe ser > 0 y < 65536
  cmd: RoverCommand
  params: number[] // máximo 10 elementos, todos números
}

export interface ServerMessage {
  type: "esp_status" | "ack" | "error"
  connected?: boolean
  id?: number
  message?: string
}

// Validación antes de enviar
export function validateMessage(msg: RoverMessage): boolean {
  if (msg.id <= 0 || msg.id > 65535) return false
  if (msg.cmd < 0 || msg.cmd > 3) return false
  if (!Array.isArray(msg.params)) return false
  if (msg.params.length > 10) return false
  if (!msg.params.every((p) => typeof p === "number" && !isNaN(p))) return false
  return true
}

export function createCommand(cmd: RoverCommand, params: number[] = []): Omit<RoverMessage, "id"> {
  return { cmd, params }
}

export const COMMAND_LABELS: Record<RoverCommand, string> = {
  [RoverCommand.MOVE_FORWARD]: "Adelante",
  [RoverCommand.MOVE_BACKWARDS]: "Atrás",
  [RoverCommand.MOVE_LEFT]: "Izquierda",
  [RoverCommand.MOVE_RIGHT]: "Derecha",
}
