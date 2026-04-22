"use client"

import { BookOpen } from "lucide-react"
import type { Recipe } from "@/components/recipe-card"
import { RecipeCard } from "@/components/recipe-card"

interface RecipesTabProps {
  recipes: Recipe[]
  favoriteRecipes: Set<string>
  onFavoriteToggle: (recipeId: string) => void
  onOpenRecipe: (recipe: Recipe) => void
}

export function RecipesTab({
  recipes,
  favoriteRecipes,
  onFavoriteToggle,
  onOpenRecipe,
}: RecipesTabProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          isFavorite={favoriteRecipes.has(recipe.id)}
          onFavoriteToggle={onFavoriteToggle}
          onClick={() => onOpenRecipe(recipe)}
        />
      ))}
    </div>
  )
}
