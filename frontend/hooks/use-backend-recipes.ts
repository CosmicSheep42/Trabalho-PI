"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type { BackendList } from "@/features/lists/types"
import type {
  BackendRecipe,
  BackendTagGroups,
  FavoriteRecipeResponse,
  Recipe,
  RecipeFilters,
  RecipeRatingSummary,
} from "@/features/recipes/types"
import { mapBackendRecipe } from "@/features/recipes/types"

interface UseBackendRecipesParams {
  filters: RecipeFilters
  enabled?: boolean
  onListUpdated?: (list: BackendList) => void
}

function updateRecipeRatingState(recipe: Recipe, summary: RecipeRatingSummary): Recipe {
  if (recipe.id !== String(summary.recipe_id)) {
    return recipe
  }

  return {
    ...recipe,
    average_rating: summary.average_rating,
    ratings_count: summary.ratings_count,
    user_rating: summary.user_rating,
  }
}

export function useBackendRecipes({
  filters,
  enabled = true,
  onListUpdated,
}: UseBackendRecipesParams) {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [tagGroups, setTagGroups] = useState<BackendTagGroups>({
    meal_type: [],
    cuisine: [],
    occasion: [],
    weather: [],
    difficulty: [],
    cooking_method: [],
    main_protein: [],
    holidays: [],
  })
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [recipesError, setRecipesError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadTags() {
      try {
        const token = isSignedIn ? await getToken() : null
        const response = await apiRequest<BackendTagGroups>("/api/tags", {
          method: "GET",
          token,
        })
        if (!isCancelled) {
          setTagGroups(response)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load tags", error)
        }
      }
    }

    if (isAuthLoaded) {
      void loadTags()
    }

    return () => {
      isCancelled = true
    }
  }, [getToken, isAuthLoaded, isSignedIn])

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn || !enabled) {
      return
    }

    let isCancelled = false

    async function loadRecipes() {
      setIsLoadingRecipes(true)
      setRecipesError(null)

      try {
        const token = await getToken()
        if (!token) {
          throw new Error("Missing Clerk session token")
        }

        const params = new URLSearchParams()
        if (filters.search.trim()) {
          params.set("search", filters.search.trim())
        }
        if (filters.timeFilter) {
          params.set("time_filter", filters.timeFilter)
        }
        for (const tag of filters.tags) {
          params.append("tags", tag)
        }
        for (const holiday of filters.holidays) {
          params.append("holidays", holiday)
        }
        for (const option of filters.dietary) {
          params.set(option.replaceAll("-", "_"), "true")
        }

        const path = params.size > 0 ? `/api/recipes?${params.toString()}` : "/api/recipes"
        const response = await apiRequest<BackendRecipe[]>(path, {
          method: "GET",
          token,
        })

        if (!isCancelled) {
          setRecipes(response.map(mapBackendRecipe))
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Failed to load recipes"
          setRecipes([])
          setRecipesError(message)
          console.error("Failed to load recipes", error)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingRecipes(false)
        }
      }
    }

    void loadRecipes()

    return () => {
      isCancelled = true
    }
  }, [
    filters.search,
    filters.timeFilter,
    filters.dietary,
    filters.tags,
    filters.holidays,
    getToken,
    isAuthLoaded,
    isSignedIn,
    enabled,
  ])

  async function withToken<T>(callback: (token: string) => Promise<T>) {
    const token = await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    return callback(token)
  }

  async function toggleFavorite(recipeId: string, isFavorite: boolean) {
    const response = await withToken((token) =>
      apiRequest<FavoriteRecipeResponse>(`/api/recipes/${recipeId}/favorite`, {
        method: isFavorite ? "DELETE" : "POST",
        token,
      })
    )

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId ? { ...recipe, is_favorite: response.is_favorite } : recipe
      )
    )
  }

  function updateSavedRecipeState(
    recipeId: string,
    isSaved: boolean,
    servings: number | null,
    notes: string | null
  ) {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === recipeId
          ? { ...recipe, is_saved: isSaved, saved_servings: servings, saved_notes: notes }
          : recipe
      )
    )
  }

  async function rateRecipe(recipeId: string, rating: number) {
    const response = await withToken((token) =>
      apiRequest<RecipeRatingSummary>(`/api/recipes/${recipeId}/rating`, {
        method: "POST",
        token,
        body: JSON.stringify({ rating }),
      })
    )

    setRecipes((prev) => prev.map((recipe) => updateRecipeRatingState(recipe, response)))
  }

  async function removeRating(recipeId: string) {
    const response = await withToken((token) =>
      apiRequest<RecipeRatingSummary>(`/api/recipes/${recipeId}/rating`, {
        method: "DELETE",
        token,
      })
    )

    setRecipes((prev) => prev.map((recipe) => updateRecipeRatingState(recipe, response)))
  }

  async function addRecipeToList(listId: string, recipeId: string) {
    const response = await withToken((token) =>
      apiRequest<BackendList>(`/api/lists/${listId}/recipes/${recipeId}`, {
        method: "POST",
        token,
      })
    )

    onListUpdated?.(response)
  }

  async function removeRecipeFromList(listId: string, recipeId: string) {
    const response = await withToken((token) =>
      apiRequest<BackendList>(`/api/lists/${listId}/recipes/${recipeId}`, {
        method: "DELETE",
        token,
      })
    )

    onListUpdated?.(response)
  }

  return {
    recipes,
    tagGroups,
    isLoadingRecipes,
    recipesError,
    toggleFavorite,
    rateRecipe,
    removeRating,
    addRecipeToList,
    removeRecipeFromList,
    updateSavedRecipeState,
  }
}
