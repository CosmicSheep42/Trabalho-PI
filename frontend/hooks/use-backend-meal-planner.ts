"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type {
  BackendMealPlanEntry,
  MealPlanEntry,
  MealPlanEntryCreatePayload,
  MealPlanEntryUpdatePayload,
} from "@/features/meal-planner/types"
import { weekDays } from "@/features/meal-planner/types"

const dayOrder = Object.fromEntries(weekDays.map((day, index) => [day, index])) as Record<string, number>

function mapBackendMealPlanEntry(entry: BackendMealPlanEntry): MealPlanEntry {
  return {
    id: String(entry.id),
    userId: String(entry.user_id),
    recipeId: String(entry.recipe_id),
    listId: entry.list_id !== null ? String(entry.list_id) : null,
    dayOfWeek: entry.day_of_week,
    position: entry.position,
    servings: entry.servings,
  }
}

function sortEntries(entries: MealPlanEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.dayOfWeek !== right.dayOfWeek) {
      return dayOrder[left.dayOfWeek] - dayOrder[right.dayOfWeek]
    }

    if (left.position !== right.position) {
      return left.position - right.position
    }

    return Number(left.id) - Number(right.id)
  })
}

export function useBackendMealPlanner() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [mealPlanEntries, setMealPlanEntries] = useState<MealPlanEntry[]>([])
  const [isLoadingMealPlanner, setIsLoadingMealPlanner] = useState(false)

  const loadMealPlanEntries = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    const response = await apiRequest<BackendMealPlanEntry[]>("/api/meal-planner", {
      method: "GET",
      token,
    })

    setMealPlanEntries(sortEntries(response.map(mapBackendMealPlanEntry)))
  }, [getToken])

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return
    }

    let isCancelled = false

    async function hydrateMealPlanEntries() {
      setIsLoadingMealPlanner(true)

      try {
        const token = await getToken()
        if (!token) {
          throw new Error("Missing Clerk session token")
        }

        if (!isCancelled) {
          await loadMealPlanEntries(token)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load meal planner entries", error)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMealPlanner(false)
        }
      }
    }

    void hydrateMealPlanEntries()

    return () => {
      isCancelled = true
    }
  }, [getToken, isAuthLoaded, isSignedIn, loadMealPlanEntries])

  async function withToken<T>(callback: (token: string) => Promise<T>) {
    const token = await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    return callback(token)
  }

  function syncMealPlanEntry(entry: BackendMealPlanEntry) {
    const nextEntry = mapBackendMealPlanEntry(entry)
    setMealPlanEntries((prev) => {
      const exists = prev.some((currentEntry) => currentEntry.id === nextEntry.id)
      const nextEntries = exists
        ? prev.map((currentEntry) => (currentEntry.id === nextEntry.id ? nextEntry : currentEntry))
        : [...prev, nextEntry]
      return sortEntries(nextEntries)
    })
    return nextEntry
  }

  async function createMealPlanEntry(payload: MealPlanEntryCreatePayload) {
    const response = await withToken((token) =>
      apiRequest<BackendMealPlanEntry>("/api/meal-planner", {
        method: "POST",
        token,
        body: JSON.stringify({
          recipe_id: Number(payload.recipeId),
          list_id: payload.listId ? Number(payload.listId) : null,
          day_of_week: payload.dayOfWeek,
          position: payload.position,
          servings: payload.servings ?? null,
        }),
      })
    )

    return syncMealPlanEntry(response)
  }

  async function updateMealPlanEntry(entryId: string, payload: MealPlanEntryUpdatePayload) {
    const response = await withToken((token) =>
      apiRequest<BackendMealPlanEntry>(`/api/meal-planner/${entryId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          ...(payload.listId !== undefined ? { list_id: payload.listId ? Number(payload.listId) : null } : {}),
          ...(payload.dayOfWeek !== undefined ? { day_of_week: payload.dayOfWeek } : {}),
          ...(payload.position !== undefined ? { position: payload.position } : {}),
          ...(payload.servings !== undefined ? { servings: payload.servings } : {}),
        }),
      })
    )

    return syncMealPlanEntry(response)
  }

  async function deleteMealPlanEntry(entryId: string) {
    await withToken((token) =>
      apiRequest<{ success: boolean }>(`/api/meal-planner/${entryId}`, {
        method: "DELETE",
        token,
      })
    )

    setMealPlanEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  return {
    mealPlanEntries,
    isLoadingMealPlanner,
    loadMealPlanEntries,
    createMealPlanEntry,
    updateMealPlanEntry,
    deleteMealPlanEntry,
    syncMealPlanEntry,
  }
}
