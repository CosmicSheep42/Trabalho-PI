"use client"

export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

export type DayOfWeek = (typeof weekDays)[number]

export interface BackendMealPlanEntry {
  id: number
  user_id: number
  recipe_id: number
  list_id: number | null
  day_of_week: DayOfWeek
  position: number
  servings: number | null
}

export interface MealPlanEntry {
  id: string
  userId: string
  recipeId: string
  listId: string | null
  dayOfWeek: DayOfWeek
  position: number
  servings: number | null
}

export interface MealPlanEntryCreatePayload {
  recipeId: string
  listId?: string | null
  dayOfWeek: DayOfWeek
  position: number
  servings?: number | null
}

export interface MealPlanEntryUpdatePayload {
  listId?: string | null
  dayOfWeek?: DayOfWeek
  position?: number
  servings?: number | null
}
