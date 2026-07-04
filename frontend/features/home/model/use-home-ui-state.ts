"use client"

import type { SetStateAction } from "react"
import { startTransition, useDeferredValue, useState } from "react"
import type { ShopList } from "@/components/shoplist-banner"
import type { ActiveRecipeFilters } from "@/components/recipe-filter"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { RecipeSortOrder } from "@/hooks/use-main-page-state"

export function useHomeUiState() {
  const [activeTab, setActiveTab] = useState("lists")
  const [listSearchQuery, setListSearchQuery] = useState("")
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("")
  const [recipeSortOrder, setRecipeSortOrder] = useState<RecipeSortOrder>("default")
  const [recipeFilters, setRecipeFilters] = useState<ActiveRecipeFilters>({
    dietary: [],
    tags: [],
    holidays: [],
    timeFilter: null,
  })
  const [selectedRecipeState, setSelectedRecipeState] = useState<{
    id: string
    servingsOverride?: number | null
    fallbackRecipe?: Recipe
    context?: RecipeServingsContext
  } | null>(null)
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<ShopList | null>(null)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createListOpen, setCreateListOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShopList | null>(null)
  const [hasCustomizedDietaryFilters, setHasCustomizedDietaryFilters] = useState(false)

  const deferredRecipeSearchQuery = useDeferredValue(recipeSearchQuery)
  const debouncedRecipeSearchQuery = useDebouncedValue(deferredRecipeSearchQuery, 250)

  function handleTabChange(nextTab: string) {
    startTransition(() => {
      setActiveTab(nextTab)
    })
  }

  function handleListSearchQueryChange(value: string) {
    startTransition(() => {
      setListSearchQuery(value)
    })
  }

  function handleRecipeSearchQueryChange(value: string) {
    startTransition(() => {
      setRecipeSearchQuery(value)
    })
  }

  function handleRecipeFiltersChange(value: SetStateAction<ActiveRecipeFilters>) {
    setHasCustomizedDietaryFilters(true)
    setRecipeFilters(value)
  }

  function handleSelectedListChange(value: SetStateAction<ShopList | null>) {
    startTransition(() => {
      const nextValue = typeof value === "function" ? value(selectedList) : value
      setSelectedList(nextValue)
      if (!nextValue) {
        setListDialogOpen(false)
      }
    })
  }

  function openRecipe(nextValue: Recipe | null, context?: RecipeServingsContext) {
    startTransition(() => {
      if (!nextValue) {
        setSelectedRecipeState(null)
        return
      }

      setSelectedRecipeState({
        id: nextValue.id,
        servingsOverride: undefined,
        fallbackRecipe: nextValue,
        context,
      })
      setRecipeDialogOpen(true)
    })
  }

  function updateSelectedRecipeServings(servings: number | null) {
    startTransition(() => {
      setSelectedRecipeState((currentState) => {
        if (!currentState) {
          return currentState
        }

        return {
          ...currentState,
          servingsOverride: servings,
          fallbackRecipe: currentState.fallbackRecipe
            ? withRecipeServingsOverride(currentState.fallbackRecipe, servings)
            : currentState.fallbackRecipe,
        }
      })
    })
  }

  return {
    activeTab,
    chatOpen,
    createListOpen,
    debouncedRecipeSearchQuery,
    editingList,
    friendsOpen,
    hasCustomizedDietaryFilters,
    listDialogOpen,
    listSearchQuery,
    profileOpen,
    recipeDialogOpen,
    recipeFilters,
    recipeSearchQuery,
    recipeSortOrder,
    selectedList,
    selectedRecipeState,
    selectedRecipeContext: selectedRecipeState?.context ?? null,
    settingsOpen,
    setCreateListOpen,
    setChatOpen,
    setEditingList,
    setFriendsOpen,
    setHasCustomizedDietaryFilters,
    setListDialogOpen,
    setProfileOpen,
    setRecipeDialogOpen,
    setRecipeSortOrder,
    setSelectedList: handleSelectedListChange,
    setSettingsOpen,
    setActiveTab: handleTabChange,
    setListSearchQuery: handleListSearchQueryChange,
    setRecipeFilters: handleRecipeFiltersChange,
    setRecipeSearchQuery: handleRecipeSearchQueryChange,
    openRecipe,
    updateSelectedRecipeServings,
  }
}
