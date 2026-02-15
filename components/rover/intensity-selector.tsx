"use client"

import { cn } from "@/lib/utils"

export type IntensityLevel = 0 | 1 | 2

interface IntensitySelectorProps {
  value: IntensityLevel
  onChange: (value: IntensityLevel) => void
  disabled?: boolean
  className?: string
}

const INTENSITY_OPTIONS: { value: IntensityLevel; label: string; color: string }[] = [
  { value: 0, label: "Baja", color: "data-[active=true]:bg-green-600 data-[active=true]:text-white" },
  { value: 1, label: "Media", color: "data-[active=true]:bg-yellow-500 data-[active=true]:text-white" },
  { value: 2, label: "Alta", color: "data-[active=true]:bg-red-600 data-[active=true]:text-white" },
]

export function IntensitySelector({ value, onChange, disabled, className }: IntensitySelectorProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Intensidad</span>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {INTENSITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-1.5 text-xs font-medium transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              // Estado inactivo
              "bg-muted/30 text-muted-foreground hover:bg-muted/60",
              // Estado activo con color específico
              option.color,
              // Bordes internos
              "border-r border-border last:border-r-0"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
