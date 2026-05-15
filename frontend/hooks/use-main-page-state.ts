"use client"

import { useState } from "react"
import type { Recipe } from "@/components/recipe-card"
import type { ShopList } from "@/components/shoplist-banner"
import type { ListItem } from "@/features/lists/types"
import { mockListItems, mockLists, mockRecipes } from "@/data/mock"
import { useBackendUser } from "@/hooks/use-backend-user"

export function useMainPageState() {
  const backendUser = useBackendUser()
  const [activeTab, setActiveTab] = useState("lists")
  const [searchQuery, setSearchQuery] = useState("")
  const [lists, setLists] = useState<ShopList[]>(mockLists)
  const [listItems, setListItems] = useState<Record<string, ListItem[]>>(mockListItems)
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

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    lists,
    setLists,
    listItems,
    setListItems,
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
    selectedList,
    setSelectedList,
    listDialogOpen,
    setListDialogOpen,
    profileOpen,
    setProfileOpen,
    settingsOpen,
    setSettingsOpen,
    createListOpen,
    setCreateListOpen,
    editingList,
    setEditingList,
    ...backendUser,
  }
}
