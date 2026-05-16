"use client"

import { useEffect, useState } from "react"
import type { Recipe } from "@/components/recipe-card"
import type { ShopList } from "@/components/shoplist-banner"
import { mockRecipes } from "@/data/mock"
import { useBackendLists } from "@/hooks/use-backend-lists"
import { useBackendUser } from "@/hooks/use-backend-user"

export function useMainPageState() {
  const backendLists = useBackendLists()
  const backendUser = useBackendUser()
  const [activeTab, setActiveTab] = useState("lists")
  const [searchQuery, setSearchQuery] = useState("")
  const [recipes] = useState<Recipe[]>(mockRecipes)
  const [favoriteRecipes, setFavoriteRecipes] = useState<Set<string>>(new Set())

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<ShopList | null>(null)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createListOpen, setCreateListOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShopList | null>(null)

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

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedList,
    setSelectedList,
    listDialogOpen,
    setListDialogOpen,
    recipes,
    favoriteRecipes,
    setFavoriteRecipes,
    selectedTags,
    setSelectedTags,
    minRating,
    setMinRating,
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
    ...backendLists,
    ...backendUser,
  }
}
