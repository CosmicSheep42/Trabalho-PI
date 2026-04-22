"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md"
  interactive?: boolean
  onChange?: (rating: number) => void
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, value: number) => {
    if (!interactive || !onChange) return

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onChange(value)
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < rating
        const icon = (
          <Star
            className={cn(
              sizeClasses[size],
              filled
                ? "fill-primary text-primary"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        )

        if (!interactive) {
          return <span key={i}>{icon}</span>
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            onKeyDown={(e) => handleKeyDown(e, i + 1)}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
          >
            {icon}
          </button>
        )
      })}
    </div>
  )
}
