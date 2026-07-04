"use client"

import { useMemo } from "react"
import type { ActiveRecipeFilters } from "@/components/recipe-filter"
import { useBackendChat } from "@/hooks/use-backend-chat"
import { useBackendEvents } from "@/hooks/use-backend-events"
import { useBackendFriends } from "@/hooks/use-backend-friends"
import { useBackendLists } from "@/hooks/use-backend-lists"
import { useBackendMealPlanner } from "@/hooks/use-backend-meal-planner"
import { useBackendRecipes } from "@/hooks/use-backend-recipes"
import { useBackendSavedRecipes } from "@/hooks/use-backend-saved-recipes"
import { useBackendUser } from "@/hooks/use-backend-user"

interface UseHomeDataParams {
  activeTab: string
  debouncedRecipeSearchQuery: string
  recipeFilters: ActiveRecipeFilters
  hasCustomizedDietaryFilters: boolean
}

export function useHomeData({
  activeTab,
  debouncedRecipeSearchQuery,
  recipeFilters,
  hasCustomizedDietaryFilters,
}: UseHomeDataParams) {
  const chat = useBackendChat()
  const lists = useBackendLists()
  const events = useBackendEvents()
  const friends = useBackendFriends()
  const mealPlanner = useBackendMealPlanner()
  const savedRecipes = useBackendSavedRecipes()
  const user = useBackendUser()

  const effectiveRecipeFilters = useMemo(() => {
    if (hasCustomizedDietaryFilters || !user.hasResolvedUser) {
      return recipeFilters
    }

    return {
      ...recipeFilters,
      dietary: user.user.allergies,
    }
  }, [hasCustomizedDietaryFilters, recipeFilters, user.hasResolvedUser, user.user.allergies])

  const recipes = useBackendRecipes({
    enabled: hasCustomizedDietaryFilters || user.hasResolvedUser,
    filters: {
      search: activeTab === "recipes" ? debouncedRecipeSearchQuery : "",
      dietary: effectiveRecipeFilters.dietary,
      tags: effectiveRecipeFilters.tags,
      holidays: effectiveRecipeFilters.holidays,
      timeFilter: effectiveRecipeFilters.timeFilter,
    },
    onListUpdated: lists.syncListResponse,
  })

  return {
    chat,
    effectiveRecipeFilters,
    events,
    friends,
    lists,
    mealPlanner,
    recipes,
    savedRecipes,
    user,
  }
}
