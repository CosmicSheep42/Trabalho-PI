"use client"

import type { Dispatch, SetStateAction } from "react"
import type { ShopList } from "@/components/shoplist-banner"
import type { ActiveRecipeFilters } from "@/components/recipe-filter"
import type { CalendarEvent } from "@/features/events/types"
import type { ListItem } from "@/features/lists/types"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import type { RecipeSortOrder } from "@/hooks/use-main-page-state"

export interface HomeShellState {
  activeTab: string
  setActiveTab: (value: string) => void
  profileOpen: boolean
  setProfileOpen: Dispatch<SetStateAction<boolean>>
  friendsOpen: boolean
  setFriendsOpen: Dispatch<SetStateAction<boolean>>
  settingsOpen: boolean
  setSettingsOpen: Dispatch<SetStateAction<boolean>>
  createListOpen: boolean
  setCreateListOpen: Dispatch<SetStateAction<boolean>>
  recipeDialogOpen: boolean
  setRecipeDialogOpen: Dispatch<SetStateAction<boolean>>
  listDialogOpen: boolean
  setListDialogOpen: Dispatch<SetStateAction<boolean>>
  editingList: ShopList | null
  setEditingList: Dispatch<SetStateAction<ShopList | null>>
}

export interface HomeRecipesState {
  recipeFilters: ActiveRecipeFilters
  setRecipeFilters: (value: SetStateAction<ActiveRecipeFilters>) => void
  recipeSearchQuery: string
  setRecipeSearchQuery: (value: string) => void
  recipeSortOrder: RecipeSortOrder
  setRecipeSortOrder: Dispatch<SetStateAction<RecipeSortOrder>>
  selectedRecipe: Recipe | null
  selectedRecipeContext: RecipeServingsContext | null
  openRecipe: (recipe: Recipe | null, context?: RecipeServingsContext) => void
  updateSelectedRecipeServings: (servings: number | null) => void
}

export interface HomeListsState {
  listSearchQuery: string
  setListSearchQuery: (value: string) => void
  selectedList: ShopList | null
  setSelectedList: Dispatch<SetStateAction<ShopList | null>>
}

export interface HomeDataSources {
  effectiveRecipeFilters: ActiveRecipeFilters
  events: ReturnType<typeof import("@/hooks/use-backend-events").useBackendEvents>
  friends: ReturnType<typeof import("@/hooks/use-backend-friends").useBackendFriends>
  lists: ReturnType<typeof import("@/hooks/use-backend-lists").useBackendLists>
  mealPlanner: ReturnType<typeof import("@/hooks/use-backend-meal-planner").useBackendMealPlanner>
  recipes: ReturnType<typeof import("@/hooks/use-backend-recipes").useBackendRecipes>
  savedRecipes: ReturnType<typeof import("@/hooks/use-backend-saved-recipes").useBackendSavedRecipes>
  user: ReturnType<typeof import("@/hooks/use-backend-user").useBackendUser>
}

export interface HomeProfileModel {
  user: HomeDataSources["user"]["user"]
  hasResolvedUser: boolean
  isSavingUser: boolean
  isSavingUsername: boolean
  saveUserAllergies: HomeDataSources["user"]["saveUserAllergies"]
  saveUsername: (username: string) => Promise<void>
}

export interface HomeSocialModel {
  friends: HomeDataSources["friends"]["friends"]
  incomingFriendRequests: HomeDataSources["friends"]["incomingFriendRequests"]
  outgoingFriendRequests: HomeDataSources["friends"]["outgoingFriendRequests"]
  searchResults: HomeDataSources["friends"]["searchResults"]
  isLoadingFriends: boolean
  isSearchingFriends: boolean
  isSavingFriendAction: boolean
  searchFriends: HomeDataSources["friends"]["searchFriends"]
  sendFriendRequest: HomeDataSources["friends"]["sendFriendRequest"]
  acceptFriendRequest: HomeDataSources["friends"]["acceptFriendRequest"]
  declineFriendRequest: HomeDataSources["friends"]["declineFriendRequest"]
  cancelFriendRequest: HomeDataSources["friends"]["cancelFriendRequest"]
  removeFriend: HomeDataSources["friends"]["removeFriend"]
}

export interface HomeListsModel {
  lists: ShopList[]
  filteredLists: ShopList[]
  listItems: Record<string, ListItem[]>
  selectedList: ShopList | null
  linkedRecipes: (list: ShopList) => Recipe[]
  savedRecipes: Recipe[]
  events: CalendarEvent[]
  mealPlanEntries: MealPlanEntry[]
  createList: (payload: { name: string; color: string; date?: string | null }) => Promise<ShopList>
  createMealPlanEntry: (payload: {
    recipeId: string
    listId?: string | null
    dayOfWeek: DayOfWeek
    position: number
    servings?: number | null
  }) => Promise<MealPlanEntry>
  updateMealPlanEntry: HomeDataSources["mealPlanner"]["updateMealPlanEntry"]
  deleteMealPlanEntry: HomeDataSources["mealPlanner"]["deleteMealPlanEntry"]
  createEvent: HomeDataSources["events"]["createEvent"]
  updateEvent: HomeDataSources["events"]["updateEvent"]
  deleteEvent: HomeDataSources["events"]["deleteEvent"]
  searchQuery: string
  setSearchQuery: (value: string) => void
  openList: (list: ShopList) => void
  editList: (list: ShopList) => void
  createListDialog: () => void
  openRecipeFromList: (recipe: Recipe, context?: RecipeServingsContext) => void
  actions: {
    createList: (name: string, color: string, date?: string) => Promise<void>
    deleteList: (listId: string) => Promise<void>
    toggleItem: (itemId: string) => Promise<void>
    addItem: (name: string, amount: string) => Promise<void>
    deleteItem: (itemId: string) => Promise<void>
    deleteItems: (itemIds: string[]) => Promise<void>
    updateItem: (itemId: string, name: string, amount: string) => Promise<void>
    removeRecipeFromList: (recipeId: string) => Promise<void>
    viewRecipeFromList: (recipe: Recipe) => void
    removeSavedRecipeCompletely: (recipeId: string) => Promise<void>
    removeMealPlanRecipeCompletely: (entryId: string, recipeId: string) => Promise<void>
    changeListColor: (color: string) => Promise<void>
    changeListDate: (date: string | undefined) => Promise<void>
  }
}

export interface HomeRecipesModel {
  allRecipes: Recipe[]
  recipes: Recipe[]
  filteredRecipes: Recipe[]
  tagGroups: HomeDataSources["recipes"]["tagGroups"]
  recipeFilters: ActiveRecipeFilters
  setRecipeFilters: (value: SetStateAction<ActiveRecipeFilters>) => void
  recipeSearchQuery: string
  setRecipeSearchQuery: (value: string) => void
  recipeSortOrder: RecipeSortOrder
  setRecipeSortOrder: Dispatch<SetStateAction<RecipeSortOrder>>
  isLoadingRecipes: boolean
  recipesError: string | null
  hasActiveRecipeQuery: boolean
  selectedRecipe: Recipe | null
  selectedRecipeContext: RecipeServingsContext | null
  openRecipe: (recipe: Recipe | null, context?: RecipeServingsContext) => void
  updateSelectedRecipeServings: (servings: number | null) => void
  actions: {
    addToList: (listId: string, recipe: Recipe, servings?: number | null) => Promise<void>
    saveRecipe: (recipe: Recipe, servings?: number | null, notes?: string | null) => Promise<void>
    saveRecipeNotes: (recipe: Recipe, notes: string | null) => Promise<void>
    persistRecipeServings: (
      recipe: Recipe,
      servings: number | null,
      context: RecipeServingsContext
    ) => Promise<void>
    toggleFavorite: (recipe: Recipe) => Promise<void>
    rateRecipe: (recipeId: string, rating: number) => Promise<void>
    removeRating: (recipeId: string) => Promise<void>
  }
}

export interface HomeScreenModel {
  shell: HomeShellState
  profile: HomeProfileModel
  social: HomeSocialModel
  lists: HomeListsModel
  recipes: HomeRecipesModel
  session: {
    logout: () => Promise<void>
  }
}
