"use client"

import { useMainPageActions } from "@/hooks/use-main-page-actions"
import { useMainPageFilters } from "@/hooks/use-main-page-filters"
import { useMainPageState } from "@/hooks/use-main-page-state"

export function useMainPage() {
  const state = useMainPageState()
  const filters = useMainPageFilters({
    lists: state.lists,
    recipes: state.recipes,
    searchQuery: state.searchQuery,
    selectedTags: state.selectedTags,
    minRating: state.minRating,
  })

  const actions = useMainPageActions({
    recipes: state.recipes,
    selectedList: state.selectedList,
    editingList: state.editingList,
    setLists: state.setLists,
    setListItems: state.setListItems,
    setEditingList: state.setEditingList,
    setRecipeDialogOpen: state.setRecipeDialogOpen,
    setSelectedList: state.setSelectedList,
    setListDialogOpen: state.setListDialogOpen,
    setSelectedRecipe: state.setSelectedRecipe,
    setFavoriteRecipes: state.setFavoriteRecipes,
  })

  return {
    ...state,
    ...filters,
    ...actions,
  }
}
