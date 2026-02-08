"use client"

import { cn } from "@/lib/utils"
import { Wifi, WifiOff, Cpu } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  espConnected: boolean
}

export function ConnectionStatus({ isConnected, espConnected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-4">
      <StatusChip 
        icon={isConnected ? Wifi : WifiOff}
        label="Servidor" 
        connected={isConnected} 
      />
      <StatusChip 
        icon={Cpu}
        label="ESP32" 
        connected={espConnected} 
      />
    </div>
  )
}

interface StatusChipProps {
  icon: React.ElementType
  label: string
  connected: boolean
}

function StatusChip({ icon: Icon, label, connected }: StatusChipProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-colors",
        connected 
          ? "bg-green-500/10 text-green-700" 
          : "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" />
      <span className="font-medium">{label}</span>
      <div
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-green-500" : "bg-muted-foreground/40"
        )}
      />
    </div>
  )
}
