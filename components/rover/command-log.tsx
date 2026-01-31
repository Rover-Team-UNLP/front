"use client"

import { RoverCommand, COMMAND_LABELS } from "@/lib/rover-protocol"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface CommandLogEntry {
  id: number
  cmd: RoverCommand
  timestamp: Date
  status: "sent" | "ack" | "error"
  message?: string
}

interface CommandLogProps {
  logs: CommandLogEntry[]
}

export function CommandLog({ logs }: CommandLogProps) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
        Sin comandos enviados
      </div>
    )
  }

  return (
    <ScrollArea className="h-40">
      <div className="space-y-1 pr-4">
        {logs.map((log) => (
          <div
            key={`${log.id}-${log.timestamp.getTime()}`}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm"
          >
            <div className="flex items-center gap-3">
              <StatusDot status={log.status} />
              <span className="font-medium">{COMMAND_LABELS[log.cmd]}</span>
              <span className="text-muted-foreground text-xs font-mono">
                #{log.id}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTime(log.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function StatusDot({ status }: { status: "sent" | "ack" | "error" }) {
  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full",
        status === "sent" && "bg-yellow-500",
        status === "ack" && "bg-green-500",
        status === "error" && "bg-red-500"
      )}
    />
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
