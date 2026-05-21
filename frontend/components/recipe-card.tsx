"use client"

import Image from "next/image"
import { Clock3, Heart, Users } from "lucide-react"
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

  const visibleBadges =
    Math.min(recipe.dietaryOptions.length, 2) +
    Math.min(recipe.tags.length, 1) +
    Math.min(recipe.holidays.length, 1)
  const totalBadges = recipe.dietaryOptions.length + recipe.tags.length + recipe.holidays.length
  const primaryTag = recipe.tags[0]?.name
  const primaryHoliday = recipe.holidays[0]?.name

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        "text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
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
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
          {primaryTag && (
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {primaryTag}
            </span>
          )}
          {!primaryTag && primaryHoliday && (
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {primaryHoliday}
            </span>
          )}
        </div>
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-2 right-2 rounded-full p-1.5 transition-all backdrop-blur-sm",
              recipe.is_favorite
                ? "bg-red-500/90 text-white"
                : "bg-background/80 text-muted-foreground hover:bg-background hover:text-red-500"
            )}
          >
          <Heart className={cn("h-4 w-4", recipe.is_favorite && "fill-current")} />
        </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="space-y-1">
          <h3 className="line-clamp-1 font-medium text-foreground">{recipe.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {recipe.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {formatPrepTime(recipe.prep_time_minutes)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {recipe.servings ?? "?"} servings
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StarRating rating={recipe.average_rating ?? 0} />
            <span className="text-xs text-muted-foreground">
              {recipe.average_rating?.toFixed(1) ?? "New"} · {recipe.ratings_count}
            </span>
          </div>
          {recipe.user_rating && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              You rated {recipe.user_rating}/5
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {recipe.dietaryOptions.slice(0, 2).map((option) => (
            <DietaryBadge key={option} type={option} size="sm" />
          ))}
          {recipe.tags.slice(primaryTag ? 1 : 0, primaryTag ? 2 : 1).map((tag) => (
            <span key={tag.id} className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-muted-foreground">
              {tag.name}
            </span>
          ))}
          {!primaryHoliday && recipe.holidays.length > 0 && (
            <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-muted-foreground">
              {recipe.holidays[0].name}
            </span>
          )}
          {totalBadges > visibleBadges && (
            <span className="text-xs text-muted-foreground">+{totalBadges - visibleBadges}</span>
          )}
        </div>
      </div>
    </div>
  )
}
