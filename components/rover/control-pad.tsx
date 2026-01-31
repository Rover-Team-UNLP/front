"use client"

import React from "react"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ControlPadProps {
  onForward: () => void
  onBackward: () => void
  onLeft: () => void
  onRight: () => void
  onStop: () => void
  disabled?: boolean
}

export function ControlPad({ onForward, onBackward, onLeft, onRight, onStop, disabled }: ControlPadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-fit">
      {/* Fila superior */}
      <div />
      <ControlButton onClick={onForward} disabled={disabled} aria-label="Mover adelante">
        <ArrowUp className="h-5 w-5" />
      </ControlButton>
      <div />

      {/* Fila media */}
      <ControlButton onClick={onLeft} disabled={disabled} aria-label="Mover izquierda">
        <ArrowLeft className="h-5 w-5" />
      </ControlButton>
      <ControlButton onClick={onStop} disabled={disabled} variant="stop" aria-label="Detener">
        <Square className="h-4 w-4 fill-current" />
      </ControlButton>
      <ControlButton onClick={onRight} disabled={disabled} aria-label="Mover derecha">
        <ArrowRight className="h-5 w-5" />
      </ControlButton>

      {/* Fila inferior */}
      <div />
      <ControlButton onClick={onBackward} disabled={disabled} aria-label="Mover atras">
        <ArrowDown className="h-5 w-5" />
      </ControlButton>
      <div />
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "stop"
  children: React.ReactNode
  "aria-label": string
}

function ControlButton({ onClick, disabled, variant = "default", children, "aria-label": ariaLabel }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:scale-95",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        variant === "stop"
          ? "bg-red-500 text-white hover:bg-red-600 active:bg-red-700"
          : "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80"
      )}
    >
      {children}
    </button>
  )
}
