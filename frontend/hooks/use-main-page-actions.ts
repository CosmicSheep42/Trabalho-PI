"use client"

import type { Dispatch, SetStateAction } from "react"
import { useClerk } from "@clerk/nextjs"
import type { Recipe } from "@/components/recipe-card"
import type { ShopList } from "@/components/shoplist-banner"
import type { ListItem } from "@/features/lists/types"

interface UseMainPageActionsParams {
  recipes: Recipe[]
  selectedList: ShopList | null
  editingList: ShopList | null
  setLists: Dispatch<SetStateAction<ShopList[]>>
  setListItems: Dispatch<SetStateAction<Record<string, ListItem[]>>>
  setEditingList: Dispatch<SetStateAction<ShopList | null>>
  setRecipeDialogOpen: Dispatch<SetStateAction<boolean>>
  setSelectedList: Dispatch<SetStateAction<ShopList | null>>
  setListDialogOpen: Dispatch<SetStateAction<boolean>>
  setSelectedRecipe: Dispatch<SetStateAction<Recipe | null>>
  setFavoriteRecipes: Dispatch<SetStateAction<Set<string>>>
}

export function useMainPageActions({
  recipes,
  selectedList,
  editingList,
  setLists,
  setListItems,
  setEditingList,
  setRecipeDialogOpen,
  setSelectedList,
  setListDialogOpen,
  setSelectedRecipe,
  setFavoriteRecipes,
}: UseMainPageActionsParams) {
  const { signOut } = useClerk()

  const handleCreateList = (name: string, color: string) => {
    if (editingList) {
      setLists((prev) =>
        prev.map((list) => (list.id === editingList.id ? { ...list, name, color } : list))
      )
      setEditingList(null)
      return
    }

    const newList: ShopList = {
      id: Date.now().toString(),
      name,
      color,
      itemCount: 0,
      linkedRecipeIds: [],
    }

    setLists((prev) => [...prev, newList])
    setListItems((prev) => ({ ...prev, [newList.id]: [] }))
  }

  const handleDeleteList = (listId: string) => {
    setLists((prev) => prev.filter((list) => list.id !== listId))
    setListItems((prev) => {
      const { [listId]: _, ...rest } = prev
      return rest
    })
  }

  const handleToggleItem = (itemId: string) => {
    if (!selectedList) return

    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }))
  }

  const handleAddItem = (name: string, amount: string) => {
    if (!selectedList) return

    const newItem: ListItem = {
      id: Date.now().toString(),
      name,
      amount,
      checked: false,
    }

    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: [...prev[selectedList.id], newItem],
    }))
    setLists((prev) =>
      prev.map((list) =>
        list.id === selectedList.id
          ? { ...list, itemCount: list.itemCount + 1 }
          : list
      )
    )
  }

  const handleDeleteItem = (itemId: string) => {
    if (!selectedList) return

    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].filter((item) => item.id !== itemId),
    }))
    setLists((prev) =>
      prev.map((list) =>
        list.id === selectedList.id
          ? { ...list, itemCount: list.itemCount - 1 }
          : list
      )
    )
  }

  const handleDeleteItems = (itemIds: string[]) => {
    if (!selectedList) return

    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].filter((item) => !itemIds.includes(item.id)),
    }))
    setLists((prev) =>
      prev.map((list) =>
        list.id === selectedList.id
          ? { ...list, itemCount: list.itemCount - itemIds.length }
          : list
      )
    )
  }

  const handleUpdateItem = (itemId: string, name: string, amount: string) => {
    if (!selectedList) return

    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].map((item) =>
        item.id === itemId ? { ...item, name, amount } : item
      ),
    }))
  }

  const handleAddRecipeToList = (listId: string, recipe: Recipe) => {
    const newItems = recipe.ingredients.map((ingredient, index) => ({
      id: `${Date.now()}-${index}`,
      name: ingredient.name,
      amount: ingredient.amount,
      checked: false,
    }))

    setListItems((prev) => ({
      ...prev,
      [listId]: [...(prev[listId] || []), ...newItems],
    }))
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              itemCount: list.itemCount + newItems.length,
              linkedRecipeIds: list.linkedRecipeIds?.includes(recipe.id)
                ? list.linkedRecipeIds
                : [...(list.linkedRecipeIds || []), recipe.id],
            }
          : list
      )
    )
    setRecipeDialogOpen(false)
  }

  const handleRemoveRecipeFromList = (recipeId: string) => {
    if (!selectedList) return

    setLists((prev) =>
      prev.map((list) =>
        list.id === selectedList.id
          ? {
              ...list,
              linkedRecipeIds: list.linkedRecipeIds?.filter((id) => id !== recipeId) || [],
            }
          : list
      )
    )
    setSelectedList((prev) =>
      prev
        ? {
            ...prev,
            linkedRecipeIds: prev.linkedRecipeIds?.filter((id) => id !== recipeId) || [],
          }
        : null
    )
  }

  const handleViewRecipeFromList = (recipe: Recipe) => {
    setListDialogOpen(false)
    setSelectedRecipe(recipe)
    setRecipeDialogOpen(true)
  }

  const handleToggleFavorite = (recipeId: string) => {
    setFavoriteRecipes((prev) => {
      const next = new Set(prev)
      if (next.has(recipeId)) {
        next.delete(recipeId)
      } else {
        next.add(recipeId)
      }
      return next
    })
  }

  const getLinkedRecipes = (list: ShopList): Recipe[] => {
    if (!list.linkedRecipeIds) return []
    return recipes.filter((recipe) => list.linkedRecipeIds?.includes(recipe.id))
  }

  const handleChangeListColor = (color: string) => {
    if (!selectedList) return

    setLists((prev) =>
      prev.map((list) => (list.id === selectedList.id ? { ...list, color } : list))
    )
    setSelectedList((prev) => (prev ? { ...prev, color } : null))
  }

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/login" })
  }

  return {
    handleCreateList,
    handleDeleteList,
    handleToggleItem,
    handleAddItem,
    handleDeleteItem,
    handleDeleteItems,
    handleUpdateItem,
    handleAddRecipeToList,
    handleRemoveRecipeFromList,
    handleViewRecipeFromList,
    handleToggleFavorite,
    getLinkedRecipes,
    handleChangeListColor,
    handleLogout,
  }
}
