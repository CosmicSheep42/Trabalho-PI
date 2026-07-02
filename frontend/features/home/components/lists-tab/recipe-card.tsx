"use client"

import Image from "next/image"
import { GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"
import type { RecipeCardOptions } from "./types"

interface RecipeCardProps {
  draggedRecipeId: string | null
  onOpenRecipe: (recipe: Recipe, context?: RecipeServingsContext) => void
  onPendingRemoval: (recipeId: string, recipeName: string, entryId?: string) => void
  onDragStateChange: (recipeId: string | null) => void
  recipe: Recipe
  options?: RecipeCardOptions
}

export function ListsTabRecipeCard({
  draggedRecipeId,
  onOpenRecipe,
  onPendingRemoval,
  onDragStateChange,
  recipe,
  options,
}: RecipeCardProps) {
  const { day, entry, draggable = false, fromDay = "bank", onDropAtCard, onRemove } = options ?? {}
  const mealTypeTag = recipe.tags.find((tag) => tag.category === "meal_type")
  const effectiveServings = entry?.servings ?? recipe.servings
  const recipeForDialog = withRecipeServingsOverride(recipe, effectiveServings)
  const recipeContext: RecipeServingsContext | undefined = entry
    ? { type: "meal-planner", entryId: entry.id }
    : fromDay === "bank"
      ? { type: "saved" }
      : undefined

  return (
    <div
      key={`${day ?? "bank"}-${recipe.id}`}
      draggable={draggable}
      role="button"
      tabIndex={0}
      onClick={() => onOpenRecipe(recipeForDialog, recipeContext)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpenRecipe(recipeForDialog, recipeContext)
        }
      }}
      onDragStart={(event) => {
        if (!draggable) {
          return
        }
        event.dataTransfer.setData("text/recipe-id", recipe.id)
        event.dataTransfer.setData("text/from-day", fromDay)
        if (entry) {
          event.dataTransfer.setData("text/entry-id", entry.id)
        }
        onDragStateChange(recipe.id)
      }}
      onDragEnd={() => onDragStateChange(null)}
      onDragOver={(event) => {
        if (!onDropAtCard) {
          return
        }
        event.preventDefault()
      }}
      onDrop={onDropAtCard}
      className={`cursor-pointer overflow-hidden rounded-2xl border bg-background shadow-sm transition ${
        draggedRecipeId === recipe.id ? "opacity-50" : "hover:border-primary/40"
      } ${draggable ? "cursor-grab" : ""}`}
    >
      <div className="relative h-32 overflow-hidden rounded-t-2xl">
        <Image
          src={recipe.image}
          alt={recipe.name}
          fill
          draggable={false}
          className="object-cover"
        />
        {entry ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-background/85 backdrop-blur-sm"
            onClick={(event) => {
              event.stopPropagation()
              onPendingRemoval(recipe.id, recipe.name, entry.id)
            }}
          >
            <span className="text-base leading-none">×</span>
          </Button>
        ) : null}
        {!entry && onRemove ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-background/85 backdrop-blur-sm"
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
          >
            <span className="text-base leading-none">×</span>
          </Button>
        ) : null}
      </div>
      <div className="flex items-start gap-3 p-4">
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{recipe.name}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {recipe.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{recipe.prep_time_minutes} min</Badge>
            {effectiveServings ? <Badge variant="secondary">{effectiveServings} servings</Badge> : null}
            {mealTypeTag ? <Badge variant="outline">{mealTypeTag.name}</Badge> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
