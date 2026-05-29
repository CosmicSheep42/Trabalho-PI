"use client"

import type { ShopList } from "@/components/shoplist-banner"

interface UseMainPageFiltersParams {
  lists: ShopList[]
  listSearchQuery: string
}

export function useMainPageFilters({
  lists,
  listSearchQuery,
}: UseMainPageFiltersParams) {
  const normalizedQuery = listSearchQuery.trim().toLowerCase()

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(normalizedQuery)
  )

  return {
    filteredLists,
  }
}
