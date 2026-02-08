"use client"

import { useState } from "react"
import { RoverCommand, COMMAND_LABELS } from "@/lib/rover-protocol"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChevronDown, Terminal } from "lucide-react"

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
  const [isExpanded, setIsExpanded] = useState(false)
  
  const recentLogs = isExpanded ? logs : logs.slice(0, 4)
  const hasMore = logs.length > 4

  return (
    <div className="flex flex-col rounded-xl border border-border bg-muted/20 overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between px-3 py-2",
          "hover:bg-muted/30 transition-colors",
          "text-left"
        )}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Historial
          </span>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground/60">
              ({logs.length})
            </span>
          )}
        </div>
        {hasMore && (
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} 
          />
        )}
      </button>

      {/* Contenido */}
      {logs.length === 0 ? (
        <div className="px-3 py-4 text-center text-muted-foreground/60 text-xs">
          Sin comandos enviados
        </div>
      ) : (
        <ScrollArea className={cn(
          "transition-all duration-200",
          isExpanded ? "h-48" : "h-auto max-h-32"
        )}>
          <div className="px-2 pb-2 space-y-1">
            {recentLogs.map((log) => (
              <div
                key={`${log.id}-${log.timestamp.getTime()}`}
                className="flex items-center justify-between py-1.5 px-2 rounded-md bg-background/50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={log.status} />
                  <span className="font-medium">{COMMAND_LABELS[log.cmd]}</span>
                  <span className="text-muted-foreground/60 font-mono text-[10px]">
                    #{log.id}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                  {formatTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: "sent" | "ack" | "error" }) {
  return (
    <div
      className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
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
