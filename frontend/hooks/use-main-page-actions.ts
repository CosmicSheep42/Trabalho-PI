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
  listItems: Record<string, ListItem[]>
  setEditingList: Dispatch<SetStateAction<ShopList | null>>
  setRecipeDialogOpen: Dispatch<SetStateAction<boolean>>
  setSelectedList: Dispatch<SetStateAction<ShopList | null>>
  setListDialogOpen: Dispatch<SetStateAction<boolean>>
  setSelectedRecipe: Dispatch<SetStateAction<Recipe | null>>
  setFavoriteRecipes: Dispatch<SetStateAction<Set<string>>>
  createList: (payload: { name: string; color: string; date?: string | null }) => Promise<ShopList>
  updateList: (listId: string, payload: { name?: string; color?: string; date?: string | null }) => Promise<ShopList>
  deleteList: (listId: string) => Promise<void>
  addItem: (listId: string, payload: { text: string; amount?: string; checked?: boolean }) => Promise<ListItem>
  updateItem: (listId: string, itemId: string, payload: { text?: string; amount?: string; checked?: boolean }) => Promise<ListItem>
  deleteItem: (listId: string, itemId: string) => Promise<void>
  deleteItems: (listId: string, itemIds: string[]) => Promise<void>
}

export function useMainPageActions({
  recipes,
  selectedList,
  editingList,
  listItems,
  setEditingList,
  setRecipeDialogOpen,
  setSelectedList,
  setListDialogOpen,
  setSelectedRecipe,
  setFavoriteRecipes,
  createList,
  updateList,
  deleteList,
  addItem,
  updateItem,
  deleteItem,
  deleteItems,
}: UseMainPageActionsParams) {
  const { signOut } = useClerk()

  const handleCreateList = async (name: string, color: string, date?: string) => {
    if (editingList) {
      const updatedList = await updateList(editingList.id, { name, color, date: date ?? null })
      setSelectedList((prev) => (prev?.id === updatedList.id ? updatedList : prev))
      setEditingList(null)
      return
    }

    await createList({ name, color, date })
  }

  const handleDeleteList = async (listId: string) => {
    const shouldCloseDialog = selectedList?.id === listId
    await deleteList(listId)
    setSelectedList((prev) => (prev?.id === listId ? null : prev))
    if (shouldCloseDialog) {
      setListDialogOpen(false)
    }
  }

  const handleToggleItem = async (itemId: string) => {
    if (!selectedList) return

    const currentItem = (listItems[selectedList.id] ?? []).find((item) => item.id === itemId)
    if (!currentItem) return

    await updateItem(selectedList.id, itemId, { checked: !currentItem.checked })
  }

  const handleAddItem = async (name: string, amount: string) => {
    if (!selectedList) return

    await addItem(selectedList.id, { text: name, amount, checked: false })
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedList) return

    await deleteItem(selectedList.id, itemId)
  }

  const handleDeleteItems = async (itemIds: string[]) => {
    if (!selectedList) return

    await deleteItems(selectedList.id, itemIds)
  }

  const handleUpdateItem = async (itemId: string, name: string, amount: string) => {
    if (!selectedList) return

    await updateItem(selectedList.id, itemId, { text: name, amount })
  }

  const handleAddRecipeToList = async (listId: string, recipe: Recipe) => {
    for (const ingredient of recipe.ingredients) {
      await addItem(listId, {
        text: ingredient.name,
        amount: ingredient.amount,
        checked: false,
      })
    }

    setRecipeDialogOpen(false)
  }

  const handleRemoveRecipeFromList = (recipeId: string) => {
    if (!selectedList) return

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

  const handleChangeListColor = async (color: string) => {
    if (!selectedList) return

    const updatedList = await updateList(selectedList.id, { color })
    setSelectedList(updatedList)
  }

  const handleChangeListDate = async (date: string | undefined) => {
    if (!selectedList) return

    const updatedList = await updateList(selectedList.id, { date: date ?? null })
    setSelectedList(updatedList)
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
    handleChangeListDate,
    handleLogout,
  }
}
