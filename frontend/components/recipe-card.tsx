"use client"

import Image from "next/image"
import { Heart } from "lucide-react"
import { DietaryBadge } from "./dietary-badge"
import { StarRating } from "./star-rating"
import type { Recipe } from "@/features/recipes/types"
import { formatPrepTime } from "@/features/recipes/types"
import { cn } from "@/lib/utils"

interface RecipeCardProps {
  recipe: Recipe
  onFavoriteToggle?: (recipe: Recipe) => void
  onClick?: () => void
}

export function RecipeCard({ recipe, onFavoriteToggle, onClick }: RecipeCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteToggle?.(recipe)
  }

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        "hover:border-primary/50 transition-all duration-200 text-left w-full",
        onClick && "cursor-pointer"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={recipe.image}
          alt={recipe.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full transition-all",
              recipe.is_favorite
                ? "bg-red-500/90 text-white"
                : "bg-background/80 text-muted-foreground hover:bg-background hover:text-red-500"
            )}
          >
          <Heart className={cn("h-4 w-4", recipe.is_favorite && "fill-current")} />
        </button>
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <h3 className="font-medium text-foreground line-clamp-1">{recipe.name}</h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StarRating rating={recipe.average_rating ?? 0} />
            <span className="text-xs text-muted-foreground">
              {recipe.average_rating?.toFixed(1) ?? "New"} ({recipe.ratings_count})
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{formatPrepTime(recipe.prep_time_minutes)}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {recipe.dietaryOptions.slice(0, 2).map((option) => (
            <DietaryBadge key={option} type={option} />
          ))}
          {recipe.tags.slice(0, 1).map((tag) => (
            <span key={tag.id} className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-muted-foreground">
              {tag.name}
            </span>
          ))}
          {recipe.dietaryOptions.length + recipe.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{recipe.dietaryOptions.length + recipe.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  )
}
