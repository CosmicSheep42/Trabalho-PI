"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type { Recipe, BackendRecipe, SavedRecipeResponse } from "@/features/recipes/types"
import { mapBackendRecipe } from "@/features/recipes/types"

function mapSavedRecipe(recipe: BackendRecipe): Recipe {
  const mappedRecipe = mapBackendRecipe(recipe)
  return {
    ...mappedRecipe,
    servings: recipe.saved_servings ?? mappedRecipe.servings,
  }
}

export function useBackendSavedRecipes() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])

  const loadSavedRecipes = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    const response = await apiRequest<BackendRecipe[]>("/api/recipes/saved-recipes", {
      method: "GET",
      token,
    })

    setSavedRecipes(response.map(mapSavedRecipe))
  }, [getToken])

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return
    }

    let isCancelled = false

    async function fetchSavedRecipes() {
      try {
        const token = await getToken()
        if (!isCancelled) {
          await loadSavedRecipes(token ?? undefined)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load saved recipes", error)
        }
      }
    }

    void fetchSavedRecipes()

    return () => {
      isCancelled = true
    }
  }, [getToken, isAuthLoaded, isSignedIn, loadSavedRecipes])

  async function withToken<T>(callback: (token: string) => Promise<T>) {
    const token = await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    return callback(token)
  }

  async function saveRecipe(recipeId: string, servings?: number | null, notes?: string | null) {
    return withToken(async (token) => {
      const response = await apiRequest<SavedRecipeResponse>(`/api/recipes/${recipeId}/save`, {
        method: "POST",
        token,
        body: JSON.stringify({
          ...(servings !== undefined ? { servings } : {}),
          ...(notes !== undefined ? { notes } : {}),
        }),
      })
      await loadSavedRecipes(token)
      return response
    })
  }

  async function removeSavedRecipe(recipeId: string) {
    await withToken(async (token) => {
      await apiRequest<SavedRecipeResponse>(`/api/recipes/${recipeId}/save`, {
        method: "DELETE",
        token,
      })
      await loadSavedRecipes(token)
    })
  }

  function syncSavedRecipe(recipe: Recipe, servings?: number | null, notes?: string | null) {
    const nextRecipe = {
      ...recipe,
      servings: servings ?? recipe.servings,
      is_saved: true,
      saved_servings: servings ?? recipe.servings,
      saved_notes: notes ?? recipe.saved_notes,
    }
    setSavedRecipes((prev) => {
      const exists = prev.some((currentRecipe) => currentRecipe.id === recipe.id)
      if (exists) {
        return prev.map((currentRecipe) => (currentRecipe.id === recipe.id ? nextRecipe : currentRecipe))
      }
      return [...prev, nextRecipe]
    })
  }

  return {
    savedRecipes,
    saveRecipe,
    removeSavedRecipe,
    syncSavedRecipe,
    loadSavedRecipes,
  }
}
