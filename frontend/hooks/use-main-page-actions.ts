"use client"

import type { Dispatch, SetStateAction } from "react"
import { useClerk } from "@clerk/nextjs"
import type { ShopList } from "@/components/shoplist-banner"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import type { ListItem } from "@/features/lists/types"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"

interface UseMainPageActionsParams {
  lists: ShopList[]
  recipes: Recipe[]
  selectedList: ShopList | null
  editingList: ShopList | null
  listItems: Record<string, ListItem[]>
  setEditingList: Dispatch<SetStateAction<ShopList | null>>
  setRecipeDialogOpen: Dispatch<SetStateAction<boolean>>
  setSelectedList: Dispatch<SetStateAction<ShopList | null>>
  setListDialogOpen: Dispatch<SetStateAction<boolean>>
  openRecipe: (recipe: Recipe | null, context?: RecipeServingsContext) => void
  createList: (payload: { name: string; color: string; date?: string | null }) => Promise<ShopList>
  updateList: (listId: string, payload: { name?: string; color?: string; date?: string | null }) => Promise<ShopList>
  deleteList: (listId: string) => Promise<void>
  addItem: (listId: string, payload: { text: string; amount?: string; checked?: boolean }) => Promise<ListItem>
  updateItem: (listId: string, itemId: string, payload: { text?: string; amount?: string; checked?: boolean }) => Promise<ListItem>
  deleteItem: (listId: string, itemId: string) => Promise<void>
  deleteItems: (listId: string, itemIds: string[]) => Promise<void>
  addRecipeToList: (listId: string, recipeId: string, servings?: number | null) => Promise<void>
  removeRecipeFromList: (listId: string, recipeId: string) => Promise<void>
  updateMealPlanEntry: (
    entryId: string,
    payload: {
      listId?: string | null
      dayOfWeek?: DayOfWeek
      position?: number
      servings?: number | null
    }
  ) => Promise<MealPlanEntry>
  deleteMealPlanEntry: (entryId: string) => Promise<void>
  saveRecipe: (recipeId: string, servings?: number | null, notes?: string | null) => Promise<{ notes: string | null; servings: number | null }>
  removeSavedRecipe: (recipeId: string) => Promise<void>
  syncSavedRecipe: (recipe: Recipe, servings?: number | null, notes?: string | null) => void
  loadSavedRecipes: () => Promise<void>
  updateSavedRecipeState: (
    recipeId: string,
    isSaved: boolean,
    servings: number | null,
    notes: string | null
  ) => void
  toggleFavorite: (recipeId: string, isFavorite: boolean) => Promise<void>
  rateRecipe: (recipeId: string, rating: number) => Promise<void>
  removeRating: (recipeId: string) => Promise<void>
}

export function useMainPageActions({
  lists,
  recipes,
  selectedList,
  editingList,
  listItems,
  setEditingList,
  setRecipeDialogOpen,
  setSelectedList,
  setListDialogOpen,
  openRecipe,
  createList,
  updateList,
  deleteList,
  addItem,
  updateItem,
  deleteItem,
  deleteItems,
  addRecipeToList,
  removeRecipeFromList,
  updateMealPlanEntry,
  deleteMealPlanEntry,
  saveRecipe,
  removeSavedRecipe,
  syncSavedRecipe,
  loadSavedRecipes,
  updateSavedRecipeState,
  toggleFavorite,
  rateRecipe,
  removeRating,
}: UseMainPageActionsParams) {
  const { signOut } = useClerk()

  function getRecipeLinkedListIds(recipeId: string) {
    return lists
      .filter((list) => list.linkedRecipeIds?.includes(recipeId))
      .map((list) => list.id)
  }

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

  const handleAddRecipeToList = async (listId: string, recipe: Recipe, servings?: number | null) => {
    await addRecipeToList(listId, recipe.id, servings)
    await loadSavedRecipes()
    syncSavedRecipe(recipe, servings, recipe.saved_notes)
    updateSavedRecipeState(recipe.id, true, servings ?? recipe.servings, recipe.saved_notes)
    setRecipeDialogOpen(false)
  }

  const handleSaveRecipe = async (recipe: Recipe, servings?: number | null, notes?: string | null) => {
    const response = await saveRecipe(recipe.id, servings, notes)
    syncSavedRecipe(recipe, response.servings, response.notes)
    updateSavedRecipeState(recipe.id, true, response.servings, response.notes)
    setRecipeDialogOpen(false)
  }

  const handleSaveRecipeNotes = async (recipe: Recipe, notes: string | null) => {
    const response = await saveRecipe(recipe.id, undefined, notes)
    syncSavedRecipe(recipe, response.servings, response.notes)
    updateSavedRecipeState(recipe.id, true, response.servings, response.notes)
  }

  const handleRemoveSavedRecipe = async (recipeId: string) => {
    await removeSavedRecipe(recipeId)
    updateSavedRecipeState(recipeId, false, null, null)
  }

  const handleRemoveSavedRecipeCompletely = async (recipeId: string) => {
    const linkedListIds = getRecipeLinkedListIds(recipeId)
    await Promise.all(linkedListIds.map((listId) => removeRecipeFromList(listId, recipeId)))
    await removeSavedRecipe(recipeId)
    updateSavedRecipeState(recipeId, false, null, null)
  }

  const handleRemoveMealPlanRecipeCompletely = async (entryId: string, recipeId: string) => {
    const linkedListIds = getRecipeLinkedListIds(recipeId)
    await Promise.all([
      ...linkedListIds.map((listId) => removeRecipeFromList(listId, recipeId)),
      deleteMealPlanEntry(entryId),
      removeSavedRecipe(recipeId),
    ])
    updateSavedRecipeState(recipeId, false, null, null)
  }

  const handleRemoveRecipeFromList = async (recipeId: string) => {
    if (!selectedList) return

    await removeRecipeFromList(selectedList.id, recipeId)
  }

  const handleViewRecipeFromList = (recipe: Recipe) => {
    if (!selectedList) return

    setListDialogOpen(false)
    openRecipe(recipe, { type: "list", listId: selectedList.id })
  }

  const handlePersistRecipeServings = async (
    recipe: Recipe,
    servings: number | null,
    context: RecipeServingsContext
  ) => {
    if (context.type === "saved") {
      const response = await saveRecipe(recipe.id, servings, recipe.saved_notes)
      syncSavedRecipe(recipe, response.servings, response.notes)
      updateSavedRecipeState(recipe.id, true, response.servings, response.notes)
      return
    }

    if (context.type === "list") {
      await addRecipeToList(context.listId, recipe.id, servings)
      await loadSavedRecipes()
      syncSavedRecipe(recipe, servings, recipe.saved_notes)
      updateSavedRecipeState(recipe.id, true, servings ?? recipe.servings, recipe.saved_notes)
      return
    }

    await updateMealPlanEntry(context.entryId, { servings })
  }

  const handleToggleFavorite = async (recipe: Recipe) => {
    await toggleFavorite(recipe.id, recipe.is_favorite)
  }

  const getLinkedRecipes = (list: ShopList): Recipe[] => {
    if (!list.linkedRecipeIds) return []

    return recipes.flatMap((recipe) => {
      if (!list.linkedRecipeIds?.includes(recipe.id)) {
        return []
      }

      const recipeLink = list.listRecipes?.find((link) => link.recipeId === recipe.id)
      return [withRecipeServingsOverride(recipe, recipeLink?.servings)]
    })
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

  const handleRateRecipe = async (recipeId: string, rating: number) => {
    await rateRecipe(recipeId, rating)
  }

  const handleRemoveRating = async (recipeId: string) => {
    await removeRating(recipeId)
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
    handleSaveRecipe,
    handleSaveRecipeNotes,
    handleRemoveSavedRecipe,
    handleRemoveSavedRecipeCompletely,
    handleRemoveMealPlanRecipeCompletely,
    handleRemoveRecipeFromList,
    handleViewRecipeFromList,
    handleToggleFavorite,
    getLinkedRecipes,
    handlePersistRecipeServings,
    handleChangeListColor,
    handleChangeListDate,
    handleRateRecipe,
    handleRemoveRating,
    updateMealPlanEntry,
    deleteMealPlanEntry,
    handleLogout,
  }
}
