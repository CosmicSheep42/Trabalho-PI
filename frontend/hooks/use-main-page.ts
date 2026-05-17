"use client"

import { useMainPageActions } from "@/hooks/use-main-page-actions"
import { useMainPageFilters } from "@/hooks/use-main-page-filters"
import { useMainPageState } from "@/hooks/use-main-page-state"

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

  return {
    ...state,
    filteredRecipes: state.recipes,
    ...filters,
    ...actions,
  }
}
