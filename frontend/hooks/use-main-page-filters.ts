"use client"

import type { Recipe } from "@/components/recipe-card"
import type { ShopList } from "@/components/shoplist-banner"

interface UseMainPageFiltersParams {
  lists: ShopList[]
  recipes: Recipe[]
  searchQuery: string
  selectedTags: string[]
  minRating: number | null
}

export function useMainPageFilters({
  lists,
  recipes,
  searchQuery,
  selectedTags,
  minRating,
}: UseMainPageFiltersParams) {
  const normalizedQuery = searchQuery.toLowerCase()

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(normalizedQuery) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => recipe.tags.includes(tag))

    const matchesRating = !minRating || recipe.rating >= minRating

    return matchesSearch && matchesTags && matchesRating
  })

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(normalizedQuery)
  )

  return {
    filteredRecipes,
    filteredLists,
  }
}
