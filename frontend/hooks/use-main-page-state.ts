"use client"

import { useEffect, useRef, useState } from "react"
import type { ShopList } from "@/components/shoplist-banner"
import { useBackendLists } from "@/hooks/use-backend-lists"
import { useBackendRecipes } from "@/hooks/use-backend-recipes"
import { useBackendUser } from "@/hooks/use-backend-user"
import type { ActiveRecipeFilters } from "@/components/recipe-filter"
import type { Recipe } from "@/features/recipes/types"

export function useMainPageState() {
  const backendLists = useBackendLists()
  const backendUser = useBackendUser()
  const [activeTab, setActiveTab] = useState("lists")
  const [searchQuery, setSearchQuery] = useState("")
  const [recipeFilters, setRecipeFilters] = useState<ActiveRecipeFilters>({
    dietary: [],
    tags: [],
    holidays: [],
    timeFilter: null,
  })

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<ShopList | null>(null)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createListOpen, setCreateListOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShopList | null>(null)
  const hasInitializedDietaryFilters = useRef(false)
  const backendRecipes = useBackendRecipes({
    filters: {
      search: activeTab === "recipes" ? searchQuery : "",
      dietary: recipeFilters.dietary,
      tags: recipeFilters.tags,
      holidays: recipeFilters.holidays,
      timeFilter: recipeFilters.timeFilter,
    },
    onListUpdated: backendLists.syncListResponse,
  })

  useEffect(() => {
    if (hasInitializedDietaryFilters.current) {
      return
    }

    if (backendUser.user.allergies.length === 0) {
      return
    }

    hasInitializedDietaryFilters.current = true
    setRecipeFilters((prev) => ({
      ...prev,
      dietary: backendUser.user.allergies,
    }))
  }, [backendUser.user.allergies])

  useEffect(() => {
    if (!selectedList) {
      return
    }

    const nextSelectedList = backendLists.lists.find((list) => list.id === selectedList.id)

    if (!nextSelectedList) {
      setSelectedList(null)
      setListDialogOpen(false)
      return
    }

    if (nextSelectedList !== selectedList) {
      setSelectedList(nextSelectedList)
    }
  }, [backendLists.lists, selectedList])

  useEffect(() => {
    if (!selectedRecipe) {
      return
    }

    const nextSelectedRecipe = backendRecipes.recipes.find((recipe) => recipe.id === selectedRecipe.id)
    if (!nextSelectedRecipe) {
      return
    }

    if (nextSelectedRecipe !== selectedRecipe) {
      setSelectedRecipe(nextSelectedRecipe)
    }
  }, [backendRecipes.recipes, selectedRecipe])

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedList,
    setSelectedList,
    listDialogOpen,
    setListDialogOpen,
    recipeFilters,
    setRecipeFilters,
    selectedRecipe,
    setSelectedRecipe,
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
    ...backendLists,
    ...backendUser,
  }
}
