"use client"

import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns"
import { useMemo } from "react"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import { weekDays } from "@/features/meal-planner/types"
import type { Recipe } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"
import type { ListsTabProps, PlannerEventSuggestion, SavedRecipeTab } from "@/features/home/components/lists-tab/types"

export function useListsTabData(
  props: Pick<ListsTabProps, "allLists" | "events" | "lists" | "mealPlanEntries" | "recipes" | "savedRecipes">,
  state: {
    calendarMonth: Date
    pinnedListIds: string[]
    selectedDate?: Date
    selectedSavedTab: string
  }
) {
  const { allLists, events, lists, mealPlanEntries, recipes, savedRecipes } = props

  const mealPlannerRecipeIds = useMemo(
    () => new Set(mealPlanEntries.map((entry) => entry.recipeId)),
    [mealPlanEntries]
  )

  const mealPlannerRecipes = useMemo(
    () => savedRecipes.filter((recipe) => !mealPlannerRecipeIds.has(recipe.id)),
    [mealPlannerRecipeIds, savedRecipes]
  )

  const sortedVisibleLists = useMemo(() => {
    const pinned = lists.filter((list) => state.pinnedListIds.includes(list.id))
    const unpinned = lists.filter((list) => !state.pinnedListIds.includes(list.id))
    return [...pinned, ...unpinned]
  }, [lists, state.pinnedListIds])

  const sortedAllLists = useMemo(() => {
    const pinned = allLists.filter((list) => state.pinnedListIds.includes(list.id))
    const unpinned = allLists.filter((list) => !state.pinnedListIds.includes(list.id))
    return [...pinned, ...unpinned]
  }, [allLists, state.pinnedListIds])

  const recipeMap = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes])

  const savedRecipeTabs = useMemo<SavedRecipeTab[]>(() => {
    const listRecipeIds = new Set<string>()

    const listTabs = sortedAllLists
      .map((list) => {
        const recipeLinks =
          list.listRecipes && list.listRecipes.length > 0
            ? list.listRecipes
            : (list.linkedRecipeIds ?? []).map((recipeId) => ({ recipeId, servings: null }))
        const recipesForList = recipeLinks
          .map((link) => {
            listRecipeIds.add(link.recipeId)
            const recipe = recipeMap.get(link.recipeId)
            return recipe ? withRecipeServingsOverride(recipe, link.servings) : null
          })
          .filter((recipe): recipe is Recipe => recipe !== null)

        return {
          id: `list-${list.id}`,
          label: list.name,
          recipes: recipesForList,
          emptyMessage: `No recipes are linked to ${list.name} yet.`,
        }
      })
      .filter((tab) => tab.recipes.length > 0)

    const ungroupedRecipes = mealPlannerRecipes.filter((recipe) => !listRecipeIds.has(recipe.id))

    return [
      {
        id: "saved-recipes",
        label: "Saved Recipes",
        recipes: ungroupedRecipes,
        emptyMessage: "Your saved recipes will appear here.",
      },
      ...listTabs,
    ]
  }, [mealPlannerRecipes, recipeMap, sortedAllLists])

  const activeSavedTabId = savedRecipeTabs.some((tab) => tab.id === state.selectedSavedTab)
    ? state.selectedSavedTab
    : (savedRecipeTabs[0]?.id ?? "saved-recipes")

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(state.calendarMonth)
    const monthEnd = endOfMonth(state.calendarMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [state.calendarMonth])

  const plannerEntriesByDay = useMemo(
    () =>
      Object.fromEntries(
        weekDays.map((day) => [
          day,
          mealPlanEntries
            .filter((entry) => entry.dayOfWeek === day)
            .sort((left, right) => left.position - right.position),
        ])
      ) as Record<DayOfWeek, MealPlanEntry[]>,
    [mealPlanEntries]
  )

  const currentPlannerWeekDates = useMemo(
    () =>
      Object.fromEntries(
        weekDays.map((day, index) => [day, addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index)])
      ) as Record<DayOfWeek, Date>,
    []
  )

  const eventsByDate = useMemo(
    () =>
      events.reduce<Record<string, typeof events>>((acc, event) => {
        acc[event.date] = [...(acc[event.date] ?? []), event]
        return acc
      }, {}),
    [events]
  )

  const plannerEventSuggestionsByDay = useMemo(
    () =>
      weekDays.reduce<Record<DayOfWeek, PlannerEventSuggestion[]>>((acc, day) => {
        const currentDate = currentPlannerWeekDates[day]
        const dateKey = format(currentDate, "yyyy-MM-dd")
        const dayEvents = eventsByDate[dateKey] ?? []
        const plannedRecipeIds = new Set(plannerEntriesByDay[day].map((entry) => entry.recipeId))
        const seenRecipeIds = new Set<string>()
        const daySuggestions: PlannerEventSuggestion[] = []

        for (const event of dayEvents) {
          for (const listId of event.listIds) {
            const linkedList = allLists.find((list) => list.id === listId)
            if (!linkedList) {
              continue
            }

            const recipeLinks =
              linkedList.listRecipes && linkedList.listRecipes.length > 0
                ? linkedList.listRecipes
                : (linkedList.linkedRecipeIds ?? []).map((recipeId) => ({ recipeId, servings: null }))

            for (const link of recipeLinks) {
              if (plannedRecipeIds.has(link.recipeId) || seenRecipeIds.has(link.recipeId)) {
                continue
              }

              const recipe = recipeMap.get(link.recipeId)
              if (!recipe) {
                continue
              }

              daySuggestions.push({
                key: `${event.id}-${link.recipeId}`,
                recipe: withRecipeServingsOverride(recipe, link.servings),
              })
              seenRecipeIds.add(link.recipeId)
            }
          }
        }

        acc[day] = daySuggestions
        return acc
      }, {} as Record<DayOfWeek, PlannerEventSuggestion[]>),
    [allLists, currentPlannerWeekDates, eventsByDate, plannerEntriesByDay, recipeMap]
  )

  const selectedDateKey = state.selectedDate ? format(state.selectedDate, "yyyy-MM-dd") : null
  const selectedDayEvents = selectedDateKey ? eventsByDate[selectedDateKey] ?? [] : []

  return {
    activeSavedTabId,
    calendarDays,
    currentPlannerWeekDates,
    eventsByDate,
    mealPlannerRecipes,
    plannerEntriesByDay,
    plannerEventSuggestionsByDay,
    recipeMap,
    savedRecipeTabs,
    selectedDayEvents,
    sortedAllLists,
    sortedVisibleLists,
  }
}
