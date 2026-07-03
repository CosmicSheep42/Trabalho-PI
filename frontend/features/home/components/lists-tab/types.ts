"use client"

import type * as React from "react"
import type { ShopList } from "@/components/shoplist-banner"
import type { CalendarEvent } from "@/features/events/types"
import type { FriendGroup, FriendUser } from "@/features/friends/types"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"

export interface ListsTabProps {
  lists: ShopList[]
  allLists: ShopList[]
  recipes: Recipe[]
  savedRecipes: Recipe[]
  events: CalendarEvent[]
  currentUserId: number | null
  availableFriends: FriendUser[]
  availableGroups: FriendGroup[]
  mealPlanEntries: MealPlanEntry[]
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onCreateList: () => void
  onOpenList: (list: ShopList) => void
  onOpenRecipe: (recipe: Recipe, context?: RecipeServingsContext) => void
  onEditList: (list: ShopList) => void
  onDeleteList: (listId: string) => void
  onCreateMealPlanEntry: (payload: {
    recipeId: string
    listId?: string | null
    dayOfWeek: DayOfWeek
    position: number
    servings?: number | null
  }) => Promise<MealPlanEntry>
  onUpdateMealPlanEntry: (
    entryId: string,
    payload: {
      listId?: string | null
      dayOfWeek?: DayOfWeek
      position?: number
      servings?: number | null
    }
  ) => Promise<MealPlanEntry>
  onUnplanMealPlanEntry: (entryId: string) => Promise<void>
  onDeleteMealPlanEntry: (entryId: string, recipeId: string) => Promise<void>
  onDeleteSavedRecipe: (recipeId: string) => Promise<void>
  onCreateEvent: (payload: {
    name: string
    description: string
    icon: string
    date: string
    listIds: string[]
  }) => Promise<CalendarEvent>
  onUpdateEvent: (
    eventId: string,
    payload: {
      name: string
      description: string
      icon: string
      date: string
      listIds: string[]
    }
  ) => Promise<CalendarEvent>
  onDeleteEvent: (eventId: string) => Promise<void>
  onShareEventWithFriend: (eventId: string, friendUserId: number) => Promise<CalendarEvent>
  onShareEventWithGroup: (eventId: string, groupId: number) => Promise<CalendarEvent>
  onRemoveEventCollaborator: (eventId: string, memberUserId: string) => Promise<CalendarEvent>
  onCreateListForEvent: (payload: {
    name: string
    color: string
    date?: string | null
  }) => Promise<ShopList>
}

export interface PendingRemoval {
  source: "saved" | "planner"
  recipeId: string
  recipeName: string
  entryId?: string
}

export interface SavedRecipeTab {
  id: string
  label: string
  recipes: Recipe[]
  emptyMessage: string
}

export interface EventFormState {
  name: string
  description: string
  icon: string
  date: string
  listIds: string[]
}

export interface EventInlineListFormState {
  name: string
  color: string
}

export interface PlannerEventSuggestion {
  key: string
  recipe: Recipe
}

export interface RecipeCardOptions {
  day?: DayOfWeek
  entry?: MealPlanEntry
  index?: number
  draggable?: boolean
  fromDay?: DayOfWeek | "bank"
  onDropAtCard?: (event: React.DragEvent<HTMLDivElement>) => void
  onRemove?: () => void
}
