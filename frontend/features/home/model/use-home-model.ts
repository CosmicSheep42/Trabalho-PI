"use client"

import { useMemo } from "react"
import { withRecipeServingsOverride } from "@/features/recipes/types"
import { useMainPageFilters } from "@/hooks/use-main-page-filters"
import { useHomeActions } from "@/features/home/model/use-home-actions"
import { useHomeData } from "@/features/home/model/use-home-data"
import { useHomeUiState } from "@/features/home/model/use-home-ui-state"
import type { HomeDataSources, HomeScreenModel } from "@/features/home/model/types"
import type { Recipe } from "@/features/recipes/types"

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

export function useHomeModel(): HomeScreenModel {
  const ui = useHomeUiState()

  const data = useHomeData({
    activeTab: ui.activeTab,
    debouncedRecipeSearchQuery: ui.debouncedRecipeSearchQuery,
    recipeFilters: ui.recipeFilters,
    hasCustomizedDietaryFilters: ui.hasCustomizedDietaryFilters,
  })

  const selectedRecipe = useMemo(() => {
    const selectedRecipeState = ui.selectedRecipeState
    if (!selectedRecipeState) {
      return null
    }

    const canonicalRecipe =
      data.recipes.recipes.find((recipe) => recipe.id === selectedRecipeState.id) ??
      data.recipes.allRecipes.find((recipe) => recipe.id === selectedRecipeState.id) ??
      data.savedRecipes.savedRecipes.find((recipe) => recipe.id === selectedRecipeState.id) ??
      selectedRecipeState.fallbackRecipe ??
      null
    if (!canonicalRecipe) {
      return null
    }

    return withRecipeServingsOverride(canonicalRecipe, selectedRecipeState.servingsOverride)
  }, [data.recipes.allRecipes, data.recipes.recipes, data.savedRecipes.savedRecipes, ui.selectedRecipeState])

  const filteredListsState = useMainPageFilters({
    lists: data.lists.lists,
    listSearchQuery: ui.listSearchQuery,
  })

  const actions = useHomeActions({
    data,
    shell: ui,
    listsState: {
      selectedList: ui.selectedList,
      setSelectedList: ui.setSelectedList,
    },
    recipesState: {
      openRecipe: ui.openRecipe,
    },
    editingList: ui.editingList,
  })

  const hasActiveRecipeQuery = useMemo(
    () =>
      ui.recipeSearchQuery.trim().length > 0 ||
      data.effectiveRecipeFilters.dietary.length > 0 ||
      data.effectiveRecipeFilters.tags.length > 0 ||
      data.effectiveRecipeFilters.holidays.length > 0 ||
      data.effectiveRecipeFilters.timeFilter !== null,
    [data.effectiveRecipeFilters, ui.recipeSearchQuery]
  )

  const filteredRecipes = useMemo(() => {
    if (ui.recipeSortOrder === "alphabetical") {
      return [...data.recipes.recipes].sort((left, right) => left.name.localeCompare(right.name))
    }

    if (ui.recipeSortOrder === "ratings") {
      return sortByRatings(data.recipes.recipes)
    }

    return data.recipes.recipes
  }, [data.recipes.recipes, ui.recipeSortOrder])

  return {
    shell: {
      activeTab: ui.activeTab,
      setActiveTab: ui.setActiveTab,
      profileOpen: ui.profileOpen,
      setProfileOpen: ui.setProfileOpen,
      friendsOpen: ui.friendsOpen,
      setFriendsOpen: ui.setFriendsOpen,
      settingsOpen: ui.settingsOpen,
      setSettingsOpen: ui.setSettingsOpen,
      createListOpen: ui.createListOpen,
      setCreateListOpen: ui.setCreateListOpen,
      recipeDialogOpen: ui.recipeDialogOpen,
      setRecipeDialogOpen: ui.setRecipeDialogOpen,
      listDialogOpen: ui.listDialogOpen,
      setListDialogOpen: ui.setListDialogOpen,
      editingList: ui.editingList,
      setEditingList: ui.setEditingList,
    },
    profile: {
      user: data.user.user,
      hasResolvedUser: data.user.hasResolvedUser,
      isSavingUser: data.user.isSavingUser,
      isSavingUsername: data.user.isSavingUsername,
      saveUserAllergies: data.user.saveUserAllergies,
      saveUsername: async (username: string) => {
        await data.user.saveUsername(username)
      },
    },
    social: {
      friends: data.friends.friends,
      incomingFriendRequests: data.friends.incomingFriendRequests,
      outgoingFriendRequests: data.friends.outgoingFriendRequests,
      searchResults: data.friends.searchResults,
      isLoadingFriends: data.friends.isLoadingFriends,
      isSearchingFriends: data.friends.isSearchingFriends,
      isSavingFriendAction: data.friends.isSavingFriendAction,
      searchFriends: data.friends.searchFriends,
      sendFriendRequest: data.friends.sendFriendRequest,
      acceptFriendRequest: data.friends.acceptFriendRequest,
      declineFriendRequest: data.friends.declineFriendRequest,
      cancelFriendRequest: data.friends.cancelFriendRequest,
      removeFriend: data.friends.removeFriend,
    },
    lists: {
      lists: data.lists.lists,
      filteredLists: filteredListsState.filteredLists,
      listItems: data.lists.listItems,
      selectedList: ui.selectedList,
      linkedRecipes: actions.linkedRecipes,
      savedRecipes: data.savedRecipes.savedRecipes,
      events: data.events.events,
      mealPlanEntries: data.mealPlanner.mealPlanEntries,
      createList: data.lists.createList,
      createMealPlanEntry: data.mealPlanner.createMealPlanEntry,
      updateMealPlanEntry: data.mealPlanner.updateMealPlanEntry,
      deleteMealPlanEntry: data.mealPlanner.deleteMealPlanEntry,
      createEvent: data.events.createEvent,
      updateEvent: data.events.updateEvent,
      deleteEvent: data.events.deleteEvent,
      shareList: data.lists.shareList,
      searchQuery: ui.listSearchQuery,
      setSearchQuery: ui.setListSearchQuery,
      openList: actions.openList,
      editList: actions.editList,
      createListDialog: actions.createListDialog,
      openRecipeFromList: actions.openRecipeFromList,
      actions: actions.listsActions,
    },
    recipes: {
      allRecipes: data.recipes.allRecipes,
      recipes: data.recipes.recipes,
      filteredRecipes,
      tagGroups: data.recipes.tagGroups,
      recipeFilters: data.effectiveRecipeFilters,
      setRecipeFilters: ui.setRecipeFilters,
      recipeSearchQuery: ui.recipeSearchQuery,
      setRecipeSearchQuery: ui.setRecipeSearchQuery,
      recipeSortOrder: ui.recipeSortOrder,
      setRecipeSortOrder: ui.setRecipeSortOrder,
      isLoadingRecipes: data.recipes.isLoadingRecipes,
      recipesError: data.recipes.recipesError,
      hasActiveRecipeQuery,
      selectedRecipe,
      selectedRecipeContext: ui.selectedRecipeContext,
      openRecipe: ui.openRecipe,
      updateSelectedRecipeServings: ui.updateSelectedRecipeServings,
      actions: actions.recipeActions,
    },
    session: {
      logout: actions.logout,
    },
  }
}
