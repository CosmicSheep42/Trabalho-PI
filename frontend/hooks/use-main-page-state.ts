"use client"

import type { SetStateAction } from "react"
import { startTransition, useDeferredValue, useMemo, useState } from "react"
import type { ShopList } from "@/components/shoplist-banner"
import type { ActiveRecipeFilters } from "@/components/recipe-filter"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"
import { useBackendEvents } from "@/hooks/use-backend-events"
import { useBackendLists } from "@/hooks/use-backend-lists"
import { useBackendMealPlanner } from "@/hooks/use-backend-meal-planner"
import { useBackendSavedRecipes } from "@/hooks/use-backend-saved-recipes"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useBackendRecipes } from "@/hooks/use-backend-recipes"
import { useBackendUser } from "@/hooks/use-backend-user"

export type RecipeSortOrder = "default" | "alphabetical" | "ratings"

export function useMainPageState() {
  const backendLists = useBackendLists()
  const backendEvents = useBackendEvents()
  const backendMealPlanner = useBackendMealPlanner()
  const backendSavedRecipes = useBackendSavedRecipes()
  const backendUser = useBackendUser()
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
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createListOpen, setCreateListOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShopList | null>(null)
  const [hasCustomizedDietaryFilters, setHasCustomizedDietaryFilters] = useState(false)
  const deferredRecipeSearchQuery = useDeferredValue(recipeSearchQuery)
  const debouncedRecipeSearchQuery = useDebouncedValue(deferredRecipeSearchQuery, 250)
  const effectiveRecipeFilters = useMemo(() => {
    if (hasCustomizedDietaryFilters || backendUser.user.allergies.length === 0) {
      return recipeFilters
    }

    return {
      ...recipeFilters,
      dietary: backendUser.user.allergies,
    }
  }, [backendUser.user.allergies, hasCustomizedDietaryFilters, recipeFilters])
  const backendRecipes = useBackendRecipes({
    filters: {
      search: activeTab === "recipes" ? debouncedRecipeSearchQuery : "",
      dietary: effectiveRecipeFilters.dietary,
      tags: effectiveRecipeFilters.tags,
      holidays: effectiveRecipeFilters.holidays,
      timeFilter: effectiveRecipeFilters.timeFilter,
    },
    onListUpdated: backendLists.syncListResponse,
  })
  const selectedList = useMemo(
    () => (selectedListId ? backendLists.lists.find((list) => list.id === selectedListId) ?? null : null),
    [backendLists.lists, selectedListId]
  )
  const selectedRecipe = useMemo(
    () => {
      if (!selectedRecipeState) {
        return null
      }

      const canonicalRecipe =
        backendRecipes.recipes.find((recipe) => recipe.id === selectedRecipeState.id) ??
        backendSavedRecipes.savedRecipes.find((recipe) => recipe.id === selectedRecipeState.id) ??
        selectedRecipeState.fallbackRecipe ??
        null
      if (!canonicalRecipe) {
        return null
      }

      return withRecipeServingsOverride(canonicalRecipe, selectedRecipeState.servingsOverride)
    },
    [backendRecipes.recipes, backendSavedRecipes.savedRecipes, selectedRecipeState]
  )

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
      const nextValue =
        typeof value === "function" ? value(selectedList) : value
      setSelectedListId(nextValue?.id ?? null)
      if (!nextValue) {
        setListDialogOpen(false)
      }
    })
  }

  function handleSelectedRecipeChange(value: SetStateAction<Recipe | null>) {
    const nextValue =
      typeof value === "function" ? value(selectedRecipe) : value
    handleOpenRecipe(nextValue)
  }

  function handleOpenRecipe(nextValue: Recipe | null, context?: RecipeServingsContext) {
    startTransition(() => {
      if (!nextValue) {
        setSelectedRecipeState(null)
        return
      }

      const canonicalRecipe =
        backendRecipes.recipes.find((recipe) => recipe.id === nextValue.id) ??
        backendSavedRecipes.savedRecipes.find((recipe) => recipe.id === nextValue.id) ??
        null
      const servingsOverride =
        canonicalRecipe && canonicalRecipe.servings !== nextValue.servings
          ? nextValue.servings
          : undefined

      setSelectedRecipeState({
        id: nextValue.id,
        servingsOverride,
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
    setActiveTab: handleTabChange,
    listSearchQuery,
    setListSearchQuery: handleListSearchQueryChange,
    recipeSearchQuery,
    setRecipeSearchQuery: handleRecipeSearchQueryChange,
    recipeSortOrder,
    setRecipeSortOrder,
    selectedList,
    setSelectedList: handleSelectedListChange,
    listDialogOpen,
    setListDialogOpen,
    recipeFilters: effectiveRecipeFilters,
    setRecipeFilters: handleRecipeFiltersChange,
    selectedRecipe,
    selectedRecipeContext: selectedRecipeState?.context ?? null,
    setSelectedRecipe: handleSelectedRecipeChange,
    openRecipe: handleOpenRecipe,
    updateSelectedRecipeServings,
    recipeDialogOpen,
    setRecipeDialogOpen,
    profileOpen,
    setProfileOpen,
    settingsOpen,
    setSettingsOpen,
    createListOpen,
    setCreateListOpen,
    editingList,
    setEditingList,
    ...backendRecipes,
    ...backendEvents,
    ...backendLists,
    ...backendMealPlanner,
    ...backendSavedRecipes,
    ...backendUser,
  }
}
