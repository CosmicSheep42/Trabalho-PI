"use client"

import type { ShopList } from "@/components/shoplist-banner"

interface UseMainPageFiltersParams {
  lists: ShopList[]
  searchQuery: string
}

export function useMainPageFilters({
  lists,
  searchQuery,
}: UseMainPageFiltersParams) {
  const normalizedQuery = searchQuery.toLowerCase()

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(normalizedQuery)
  )

  return {
    filteredLists,
  }
}
