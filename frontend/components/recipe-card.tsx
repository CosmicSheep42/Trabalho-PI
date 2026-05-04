"use client"

import Image from "next/image"
import { Heart } from "lucide-react"
import { DietaryBadge } from "./dietary-badge"
import { StarRating } from "./star-rating"
import type { DietaryOption } from "@/lib/dietary-options"
import { cn } from "@/lib/utils"

export interface Recipe {
  id: string
  name: string
  image: string
  rating: number
  tags: string[]
  description: string
  prepTime: string
  servings: number
  ingredients: { name: string; amount: string }[]
  instructions: string[]
}

interface RecipeCardProps {
  recipe: Recipe
  isFavorite?: boolean
  onFavoriteToggle?: (recipeId: string) => void
  onClick?: () => void
}

export function RecipeCard({ recipe, isFavorite = false, onFavoriteToggle, onClick }: RecipeCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteToggle?.(recipe.id)
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
              isFavorite
                ? "bg-red-500/90 text-white"
                : "bg-background/80 text-muted-foreground hover:bg-background hover:text-red-500"
            )}
          >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
        )}
      </div>
      <div className="flex flex-col gap-2 p-3">
        <h3 className="font-medium text-foreground line-clamp-1">{recipe.name}</h3>
        <StarRating rating={recipe.rating} />
        <div className="flex flex-wrap gap-1">
          {recipe.tags.slice(0, 2).map((tag) => (
            <DietaryBadge key={tag} type={tag as DietaryOption} />
          ))}
          {recipe.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">+{recipe.tags.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  )
}
