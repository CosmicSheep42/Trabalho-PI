"use client"

import Image from "next/image"
import { BookOpen, ChevronDown, ChevronUp, X } from "lucide-react"
import { DietaryBadge } from "@/components/dietary-badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"

interface LinkedRecipesSectionProps {
  linkedRecipes: Recipe[]
  listId: string
  recipesExpanded: boolean
  onRemoveRecipe: (recipeId: string) => void
  onToggleExpanded: () => void
  onViewRecipe: (recipe: Recipe, context?: RecipeServingsContext) => void
}

export function LinkedRecipesSection({
  linkedRecipes,
  listId,
  recipesExpanded,
  onRemoveRecipe,
  onToggleExpanded,
  onViewRecipe,
}: LinkedRecipesSectionProps) {
  if (linkedRecipes.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <button
        onClick={onToggleExpanded}
        className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <BookOpen className="h-4 w-4" />
        <span>Recipes in this list ({linkedRecipes.length})</span>
        {recipesExpanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
      </button>

      {recipesExpanded ? (
        <div className="mt-3 space-y-2">
          {linkedRecipes.map((recipe) => (
            <div key={recipe.id} className="group flex items-center gap-3 rounded-lg bg-secondary/50 p-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onViewRecipe(recipe, { type: "list", listId })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onViewRecipe(recipe, { type: "list", listId })
                  }
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity hover:opacity-80"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                  <Image src={recipe.image} alt={recipe.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-1 text-sm font-medium">{recipe.name}</h4>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StarRating rating={recipe.average_rating ?? 0} size="sm" />
                    <div className="flex gap-1">
                      {recipe.dietaryOptions.slice(0, 1).map((option) => (
                        <DietaryBadge key={option} type={option} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onRemoveRecipe(recipe.id)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
