"use client"

import React from "react"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ControlPadProps {
  onForward: () => void
  onBackward: () => void
  onLeft: () => void
  onRight: () => void
  disabled?: boolean
}

export function ControlPad({ onForward, onBackward, onLeft, onRight, disabled }: ControlPadProps) {
  return (
    <div className="relative p-4 rounded-2xl bg-muted/30 border border-border">
      <div className="grid grid-cols-3 gap-3 w-fit">
        {/* Fila superior */}
        <div />
        <ControlButton 
          onClick={() => onForward()} 
          disabled={disabled} 
          aria-label="Mover adelante"
          direction="up"
        >
          <ArrowUp className="h-7 w-7" />
        </ControlButton>
        <div />

        {/* Fila media */}
        <ControlButton 
          onClick={() => onLeft()} 
          disabled={disabled} 
          aria-label="Mover izquierda"
          direction="left"
        >
          <ArrowLeft className="h-7 w-7" />
        </ControlButton>
        
        {/* Centro - indicador de estado */}
        <div className={cn(
          "h-16 w-16 rounded-xl flex items-center justify-center",
          "bg-muted/50 border border-border",
          disabled ? "opacity-50" : "opacity-100"
        )}>
          <div className={cn(
            "h-3 w-3 rounded-full transition-colors",
            disabled ? "bg-muted-foreground/30" : "bg-green-500"
          )} />
        </div>
        
        <ControlButton 
          onClick={() => onRight()} 
          disabled={disabled} 
          aria-label="Mover derecha"
          direction="right"
        >
          <ArrowRight className="h-7 w-7" />
        </ControlButton>

        {/* Fila inferior */}
        <div />
        <ControlButton 
          onClick={() => onBackward()} 
          disabled={disabled} 
          aria-label="Mover atras"
          direction="down"
        >
          <ArrowDown className="h-7 w-7" />
        </ControlButton>
        <div />
      </div>
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  "aria-label": string
  direction: "up" | "down" | "left" | "right"
}

function ControlButton({ onClick, disabled, children, "aria-label": ariaLabel, direction }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "h-16 w-16 rounded-xl flex items-center justify-center transition-all duration-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:scale-90 active:shadow-inner",
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100",
        "bg-foreground text-background shadow-lg",
        "hover:bg-foreground/90 hover:shadow-xl hover:-translate-y-0.5",
        "active:bg-foreground/80 active:translate-y-0 active:shadow-md",
        // Efecto de direccion al presionar
        direction === "up" && "active:-translate-y-1",
        direction === "down" && "active:translate-y-1",
        direction === "left" && "active:-translate-x-1",
        direction === "right" && "active:translate-x-1"
      )}
    >
      {children}
    </button>
  )
}
