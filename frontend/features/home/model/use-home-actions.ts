"use client"

import { useCallback, useMemo } from "react"
import { useClerk } from "@clerk/nextjs"
import type { ShopList } from "@/components/shoplist-banner"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"
import type { HomeDataSources, HomeListsState, HomeRecipesState, HomeShellState } from "@/features/home/model/types"

interface UseHomeActionsParams {
  data: HomeDataSources
  shell: Pick<HomeShellState, "setCreateListOpen" | "setEditingList" | "setListDialogOpen" | "setRecipeDialogOpen">
  listsState: Pick<HomeListsState, "selectedList" | "setSelectedList">
  recipesState: Pick<HomeRecipesState, "openRecipe">
  editingList: ShopList | null
}

export function useHomeActions({
  data,
  shell,
  listsState,
  recipesState,
  editingList,
}: UseHomeActionsParams) {
  const { signOut } = useClerk()

  const getRecipeLinkedListIds = useCallback((recipeId: string) => {
    return data.lists.lists
      .filter((list) => list.linkedRecipeIds?.includes(recipeId))
      .map((list) => list.id)
  }, [data.lists.lists])

  const listsActions = useMemo(() => ({
    createList: async (name: string, color: string, date?: string) => {
      if (editingList) {
        const updatedList = await data.lists.updateList(editingList.id, { name, color, date: date ?? null })
        listsState.setSelectedList((prev) => (prev?.id === updatedList.id ? updatedList : prev))
        shell.setEditingList(null)
        return
      }

      await data.lists.createList({ name, color, date })
    },
    deleteList: async (listId: string) => {
      const shouldCloseDialog = listsState.selectedList?.id === listId
      await data.lists.deleteList(listId)
      listsState.setSelectedList((prev) => (prev?.id === listId ? null : prev))
      if (shouldCloseDialog) {
        shell.setListDialogOpen(false)
      }
    },
    toggleItem: async (itemId: string) => {
      if (!listsState.selectedList) return
      const currentItem = (data.lists.listItems[listsState.selectedList.id] ?? []).find((item) => item.id === itemId)
      if (!currentItem) return
      await data.lists.updateItem(listsState.selectedList.id, itemId, { checked: !currentItem.checked })
    },
    addItem: async (name: string, amount: string) => {
      if (!listsState.selectedList) return
      await data.lists.addItem(listsState.selectedList.id, { text: name, amount, checked: false })
    },
    deleteItem: async (itemId: string) => {
      if (!listsState.selectedList) return
      await data.lists.deleteItem(listsState.selectedList.id, itemId)
    },
    deleteItems: async (itemIds: string[]) => {
      if (!listsState.selectedList) return
      await data.lists.deleteItems(listsState.selectedList.id, itemIds)
    },
    updateItem: async (itemId: string, name: string, amount: string) => {
      if (!listsState.selectedList) return
      await data.lists.updateItem(listsState.selectedList.id, itemId, { text: name, amount })
    },
    removeRecipeFromList: async (recipeId: string) => {
      if (!listsState.selectedList) return
      await data.lists.removeRecipeFromList(listsState.selectedList.id, recipeId)
    },
    viewRecipeFromList: (recipe: Recipe) => {
      if (!listsState.selectedList) return
      shell.setListDialogOpen(false)
      recipesState.openRecipe(recipe, { type: "list", listId: listsState.selectedList.id })
    },
    removeSavedRecipeCompletely: async (recipeId: string) => {
      const linkedListIds = getRecipeLinkedListIds(recipeId)
      await Promise.all(linkedListIds.map((listId) => data.lists.removeRecipeFromList(listId, recipeId)))
      await data.savedRecipes.removeSavedRecipe(recipeId)
      data.recipes.updateSavedRecipeState(recipeId, false, null, null)
    },
    removeMealPlanRecipeCompletely: async (entryId: string, recipeId: string) => {
      const linkedListIds = getRecipeLinkedListIds(recipeId)
      await Promise.all([
        ...linkedListIds.map((listId) => data.lists.removeRecipeFromList(listId, recipeId)),
        data.mealPlanner.deleteMealPlanEntry(entryId),
        data.savedRecipes.removeSavedRecipe(recipeId),
      ])
      data.recipes.updateSavedRecipeState(recipeId, false, null, null)
    },
    changeListColor: async (color: string) => {
      if (!listsState.selectedList) return
      const updatedList = await data.lists.updateList(listsState.selectedList.id, { color })
      listsState.setSelectedList(updatedList)
    },
    changeListDate: async (date: string | undefined) => {
      if (!listsState.selectedList) return
      const updatedList = await data.lists.updateList(listsState.selectedList.id, { date: date ?? null })
      listsState.setSelectedList(updatedList)
    },
  }), [data, editingList, getRecipeLinkedListIds, listsState, recipesState, shell])

  const recipeActions = useMemo(() => ({
    addToList: async (listId: string, recipe: Recipe, servings?: number | null) => {
      await data.lists.addRecipeToList(listId, recipe.id, servings)
      await data.savedRecipes.loadSavedRecipes()
      data.savedRecipes.syncSavedRecipe(recipe, servings, recipe.saved_notes)
      data.recipes.updateSavedRecipeState(recipe.id, true, servings ?? recipe.servings, recipe.saved_notes)
      shell.setRecipeDialogOpen(false)
    },
    saveRecipe: async (recipe: Recipe, servings?: number | null, notes?: string | null) => {
      const response = await data.savedRecipes.saveRecipe(recipe.id, servings, notes)
      data.savedRecipes.syncSavedRecipe(recipe, response.servings, response.notes)
      data.recipes.updateSavedRecipeState(recipe.id, true, response.servings, response.notes)
      shell.setRecipeDialogOpen(false)
    },
    saveRecipeNotes: async (recipe: Recipe, notes: string | null) => {
      const response = await data.savedRecipes.saveRecipe(recipe.id, undefined, notes)
      data.savedRecipes.syncSavedRecipe(recipe, response.servings, response.notes)
      data.recipes.updateSavedRecipeState(recipe.id, true, response.servings, response.notes)
    },
    persistRecipeServings: async (recipe: Recipe, servings: number | null, context: RecipeServingsContext) => {
      if (context.type === "saved") {
        const response = await data.savedRecipes.saveRecipe(recipe.id, servings, recipe.saved_notes)
        data.savedRecipes.syncSavedRecipe(recipe, response.servings, response.notes)
        data.recipes.updateSavedRecipeState(recipe.id, true, response.servings, response.notes)
        return
      }

      if (context.type === "list") {
        await data.lists.addRecipeToList(context.listId, recipe.id, servings)
        await data.savedRecipes.loadSavedRecipes()
        data.savedRecipes.syncSavedRecipe(recipe, servings, recipe.saved_notes)
        data.recipes.updateSavedRecipeState(recipe.id, true, servings ?? recipe.servings, recipe.saved_notes)
        return
      }

      await data.mealPlanner.updateMealPlanEntry(context.entryId, { servings })
    },
    toggleFavorite: async (recipe: Recipe) => {
      await data.recipes.toggleFavorite(recipe.id, recipe.is_favorite)
    },
    rateRecipe: async (recipeId: string, rating: number) => {
      await data.recipes.rateRecipe(recipeId, rating)
    },
    removeRating: async (recipeId: string) => {
      await data.recipes.removeRating(recipeId)
    },
  }), [data, shell])

  const linkedRecipes = (list: ShopList): Recipe[] => {
    if (!list.linkedRecipeIds) return []

    return data.recipes.recipes.flatMap((recipe) => {
      if (!list.linkedRecipeIds?.includes(recipe.id)) {
        return []
      }

      const recipeLink = list.listRecipes?.find((link) => link.recipeId === recipe.id)
      return [withRecipeServingsOverride(recipe, recipeLink?.servings)]
    })
  }

  return {
    linkedRecipes,
    listsActions,
    openList: (list: ShopList) => {
      listsState.setSelectedList(list)
      shell.setListDialogOpen(true)
    },
    editList: (list: ShopList) => {
      shell.setEditingList(list)
      shell.setCreateListOpen(true)
    },
    createListDialog: () => shell.setCreateListOpen(true),
    openRecipeFromList: (recipe: Recipe, context?: RecipeServingsContext) => {
      recipesState.openRecipe(recipe, context)
    },
    recipeActions,
    logout: async () => {
      await signOut({ redirectUrl: "/login" })
    },
  }
}
