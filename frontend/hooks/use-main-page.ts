"use client"

import { useMemo } from "react"
import type { Recipe } from "@/features/recipes/types"
import { useMainPageActions } from "@/hooks/use-main-page-actions"
import { useMainPageFilters } from "@/hooks/use-main-page-filters"
import { useMainPageState } from "@/hooks/use-main-page-state"

function sortByRatings(recipes: Recipe[]) {
  return [...recipes].sort((left, right) => {
    const leftRating = left.average_rating ?? -1
    const rightRating = right.average_rating ?? -1

    if (rightRating !== leftRating) {
      return rightRating - leftRating
    }

    if (right.ratings_count !== left.ratings_count) {
      return right.ratings_count - left.ratings_count
    }

    return left.name.localeCompare(right.name)
  })
}

export function useMainPage() {
  const state = useMainPageState()
  const filters = useMainPageFilters({
    lists: state.lists,
    listSearchQuery: state.listSearchQuery,
  })

  const actions = useMainPageActions({
    lists: state.lists,
    recipes: state.recipes,
    selectedList: state.selectedList,
    editingList: state.editingList,
    listItems: state.listItems,
    setEditingList: state.setEditingList,
    setRecipeDialogOpen: state.setRecipeDialogOpen,
    setSelectedList: state.setSelectedList,
    setListDialogOpen: state.setListDialogOpen,
    openRecipe: state.openRecipe,
    createList: state.createList,
    updateList: state.updateList,
    deleteList: state.deleteList,
    addItem: state.addItem,
    updateItem: state.updateItem,
    deleteItem: state.deleteItem,
    deleteItems: state.deleteItems,
    addRecipeToList: state.addRecipeToList,
    removeRecipeFromList: state.removeRecipeFromList,
    updateMealPlanEntry: state.updateMealPlanEntry,
    deleteMealPlanEntry: state.deleteMealPlanEntry,
    saveRecipe: state.saveRecipe,
    removeSavedRecipe: state.removeSavedRecipe,
    syncSavedRecipe: state.syncSavedRecipe,
    loadSavedRecipes: state.loadSavedRecipes,
    updateSavedRecipeState: state.updateSavedRecipeState,
    toggleFavorite: state.toggleFavorite,
    rateRecipe: state.rateRecipe,
    removeRating: state.removeRating,
  })

  const hasActiveRecipeQuery = useMemo(
    () =>
      state.recipeSearchQuery.trim().length > 0 ||
      state.recipeFilters.dietary.length > 0 ||
      state.recipeFilters.tags.length > 0 ||
      state.recipeFilters.holidays.length > 0 ||
      state.recipeFilters.timeFilter !== null,
    [state.recipeFilters, state.recipeSearchQuery]
  )

  const sortedRecipes = useMemo(() => {
    if (state.recipeSortOrder === "alphabetical") {
      return [...state.recipes].sort((left, right) => left.name.localeCompare(right.name))
    }

    if (state.recipeSortOrder === "ratings") {
      return sortByRatings(state.recipes)
    }

    return state.recipes
  }, [state.recipeSortOrder, state.recipes])

  return {
    ...state,
    filteredRecipes: sortedRecipes,
    hasActiveRecipeQuery,
    ...filters,
    ...actions,
  }
}
