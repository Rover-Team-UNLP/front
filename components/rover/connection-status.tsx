"use client"

import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  isConnected: boolean
  espConnected: boolean
}

export function ConnectionStatus({ isConnected, espConnected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-6">
      <StatusIndicator label="Servidor WS" connected={isConnected} />
      <StatusIndicator label="ESP32" connected={espConnected} />
    </div>
  )
}

interface StatusIndicatorProps {
  label: string
  connected: boolean
}

function StatusIndicator({ label, connected }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full transition-colors",
          connected ? "bg-green-500" : "bg-muted-foreground/30"
        )}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-medium",
          connected ? "text-green-600" : "text-muted-foreground"
        )}
      >
        {connected ? "OK" : "---"}
      </span>
    </div>
  )
}
