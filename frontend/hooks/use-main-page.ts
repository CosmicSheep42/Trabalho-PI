"use client"

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
    searchQuery: state.searchQuery,
  })

  const actions = useMainPageActions({
    recipes: state.recipes,
    selectedList: state.selectedList,
    editingList: state.editingList,
    listItems: state.listItems,
    setEditingList: state.setEditingList,
    setRecipeDialogOpen: state.setRecipeDialogOpen,
    setSelectedList: state.setSelectedList,
    setListDialogOpen: state.setListDialogOpen,
    setSelectedRecipe: state.setSelectedRecipe,
    createList: state.createList,
    updateList: state.updateList,
    deleteList: state.deleteList,
    addItem: state.addItem,
    updateItem: state.updateItem,
    deleteItem: state.deleteItem,
    deleteItems: state.deleteItems,
    addRecipeToList: state.addRecipeToList,
    removeRecipeFromList: state.removeRecipeFromList,
    toggleFavorite: state.toggleFavorite,
    rateRecipe: state.rateRecipe,
    removeRating: state.removeRating,
  })

  const hasActiveRecipeQuery =
    state.searchQuery.trim().length > 0 ||
    state.recipeFilters.dietary.length > 0 ||
    state.recipeFilters.tags.length > 0 ||
    state.recipeFilters.holidays.length > 0 ||
    state.recipeFilters.timeFilter !== null

  const sortedRecipes =
    state.recipeSortOrder === "alphabetical"
      ? [...state.recipes].sort((left, right) => left.name.localeCompare(right.name))
      : state.recipeSortOrder === "ratings"
        ? sortByRatings(state.recipes)
        : state.recipes

  return {
    ...state,
    filteredRecipes: sortedRecipes,
    hasActiveRecipeQuery,
    ...filters,
    ...actions,
  }
}
