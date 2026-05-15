import { dietaryBadgeConfig, type DietaryOption, dietaryOptions } from "@/lib/dietary-options"
import { cn } from "@/lib/utils"

interface DietaryBadgeProps {
  type: DietaryOption
  size?: "sm" | "md"
  className?: string
}

export function DietaryBadge({ type, size = "md", className }: DietaryBadgeProps) {
  const config = dietaryBadgeConfig[type]
  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded border",
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

export { dietaryOptions }
