"use client"

import type { DietaryOption } from "@/lib/dietary-options"

export interface RecipeIngredient {
  name: string
  amount: string
}

export interface RecipeTag {
  id: number
  name: string
  slug: string
  category: "meal_type" | "cuisine" | "occasion"
}

export interface BackendRecipe {
  id: number
  name: string
  description: string
  image: string
  prep_time_minutes: number
  servings: number | null
  ingredients: RecipeIngredient[]
  instructions: string[]
  vegan: boolean
  vegetarian: boolean
  lactose_free: boolean
  egg_free: boolean
  gluten_free: boolean
  nut_free: boolean
  shellfish_free: boolean
  soy_free: boolean
  sesame_free: boolean
  sulfite_free: boolean
  tags: RecipeTag[]
  average_rating: number | null
  ratings_count: number
  user_rating: number | null
  is_favorite: boolean
}

export interface Recipe {
  id: string
  name: string
  description: string
  image: string
  prep_time_minutes: number
  servings: number | null
  ingredients: RecipeIngredient[]
  instructions: string[]
  vegan: boolean
  vegetarian: boolean
  lactose_free: boolean
  egg_free: boolean
  gluten_free: boolean
  nut_free: boolean
  shellfish_free: boolean
  soy_free: boolean
  sesame_free: boolean
  sulfite_free: boolean
  tags: RecipeTag[]
  dietaryOptions: DietaryOption[]
  average_rating: number | null
  ratings_count: number
  user_rating: number | null
  is_favorite: boolean
}

export interface BackendTagGroups {
  meal_type: RecipeTag[]
  cuisine: RecipeTag[]
  occasion: RecipeTag[]
}

export interface RecipeRatingSummary {
  success: boolean
  recipe_id: number
  average_rating: number | null
  ratings_count: number
  user_rating: number | null
}

export interface FavoriteRecipeResponse {
  success: boolean
  recipe_id: number
  is_favorite: boolean
}

export type TimeFilter = "under_15m" | "under_30m" | "under_60m" | "above_60m"

export interface RecipeFilters {
  search: string
  dietary: DietaryOption[]
  tags: string[]
  timeFilter: TimeFilter | null
}

export function getRecipeDietaryOptions(recipe: Omit<Recipe, "dietaryOptions"> | BackendRecipe): DietaryOption[] {
  const options: DietaryOption[] = []

  if (recipe.vegan) options.push("vegan")
  if (recipe.vegetarian) options.push("vegetarian")
  if (recipe.lactose_free) options.push("lactose-free")
  if (recipe.egg_free) options.push("egg-free")
  if (recipe.gluten_free) options.push("gluten-free")
  if (recipe.nut_free) options.push("nut-free")
  if (recipe.shellfish_free) options.push("shellfish-free")
  if (recipe.soy_free) options.push("soy-free")
  if (recipe.sesame_free) options.push("sesame-free")
  if (recipe.sulfite_free) options.push("sulfite-free")

  return options
}

export function mapBackendRecipe(recipe: BackendRecipe): Recipe {
  return {
    ...recipe,
    id: String(recipe.id),
    dietaryOptions: getRecipeDietaryOptions(recipe),
  }
}

export function formatPrepTime(prepTimeMinutes: number) {
  if (prepTimeMinutes < 60) {
    return `${prepTimeMinutes} min`
  }

  const hours = Math.floor(prepTimeMinutes / 60)
  const minutes = prepTimeMinutes % 60
  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}
