"use client"

import { BookOpen } from "lucide-react"
import { AlertCircle } from "lucide-react"
import { RecipeCard } from "@/components/recipe-card"
import type { Recipe } from "@/features/recipes/types"

interface RecipesTabProps {
  recipes: Recipe[]
  isLoading?: boolean
  error?: string | null
  onFavoriteToggle: (recipe: Recipe) => void
  onOpenRecipe: (recipe: Recipe) => void
}

export function RecipesTab({
  recipes,
  isLoading = false,
  error = null,
  onFavoriteToggle,
  onOpenRecipe,
}: RecipesTabProps) {
  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading recipes...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive/60 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Could not load recipes</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No recipes found</h3>
        <p className="text-muted-foreground">
          Try a different search term or adjust your filters
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onFavoriteToggle={onFavoriteToggle}
          onClick={() => onOpenRecipe(recipe)}
        />
      ))}
    </div>
  )
}
