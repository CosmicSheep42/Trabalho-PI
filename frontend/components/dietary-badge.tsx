import { cn } from "@/lib/utils"

const badgeConfig: Record<string, { label: string; className: string }> = {
  vegan: {
    label: "Vegan",
    className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800",
  },
  vegetarian: {
    label: "Vegetarian",
    className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800",
  },
  "lactose-free": {
    label: "Lactose Free",
    className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800",
  },
  "gluten-free": {
    label: "Gluten Free",
    className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800",
  },
  "no-eggs": {
    label: "No Eggs",
    className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-800",
  },
  "nut-free": {
    label: "Nut Free",
    className: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800",
  },
  "low-carb": {
    label: "Low Carb",
    className: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/50 dark:text-violet-400 dark:border-violet-800",
  },
  "high-protein": {
    label: "High Protein",
    className: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/50 dark:text-cyan-400 dark:border-cyan-800",
  },
}

interface DietaryBadgeProps {
  type: keyof typeof badgeConfig
  size?: "sm" | "md"
  className?: string
}

export function DietaryBadge({ type, size = "md", className }: DietaryBadgeProps) {
  const config = badgeConfig[type]
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

export const dietaryOptions = Object.keys(badgeConfig) as (keyof typeof badgeConfig)[]
