"use client"

import { useEffect, useMemo, useRef } from "react"
import type { ActiveRecipeFilters } from "@/components/recipe-filter"
import type { ChatMessage } from "@/features/chat/types"
import { useBackendChat } from "@/hooks/use-backend-chat"
import { useBackendEvents } from "@/hooks/use-backend-events"
import { useBackendFriends } from "@/hooks/use-backend-friends"
import { useBackendLists } from "@/hooks/use-backend-lists"
import { useBackendMealPlanner } from "@/hooks/use-backend-meal-planner"
import { useBackendRecipes } from "@/hooks/use-backend-recipes"
import { useBackendSavedRecipes } from "@/hooks/use-backend-saved-recipes"
import { useBackendUser } from "@/hooks/use-backend-user"

interface UseHomeDataParams {
  activeTab: string
  debouncedRecipeSearchQuery: string
  recipeFilters: ActiveRecipeFilters
  hasCustomizedDietaryFilters: boolean
}

export function useHomeData({
  activeTab,
  debouncedRecipeSearchQuery,
  recipeFilters,
  hasCustomizedDietaryFilters,
}: UseHomeDataParams) {
  const chat = useBackendChat()
  const lists = useBackendLists()
  const events = useBackendEvents()
  const friends = useBackendFriends()
  const mealPlanner = useBackendMealPlanner()
  const savedRecipes = useBackendSavedRecipes()
  const user = useBackendUser()

  const effectiveRecipeFilters = useMemo(() => {
    if (hasCustomizedDietaryFilters || !user.hasResolvedUser) {
      return recipeFilters
    }

    return {
      ...recipeFilters,
      dietary: user.user.allergies,
    }
  }, [hasCustomizedDietaryFilters, recipeFilters, user.hasResolvedUser, user.user.allergies])

  const recipes = useBackendRecipes({
    enabled: hasCustomizedDietaryFilters || user.hasResolvedUser,
    filters: {
      search: activeTab === "recipes" ? debouncedRecipeSearchQuery : "",
      dietary: effectiveRecipeFilters.dietary,
      tags: effectiveRecipeFilters.tags,
      holidays: effectiveRecipeFilters.holidays,
      timeFilter: effectiveRecipeFilters.timeFilter,
    },
    onListUpdated: lists.syncListResponse,
  })

  const lastProcessedChatMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    const latestAssistantMessage = [...chat.messages].reverse().find(
      (message): message is ChatMessage => message.role === "assistant" && (message.executedToolCalls?.length ?? 0) > 0
    )
    if (!latestAssistantMessage || latestAssistantMessage.id === lastProcessedChatMessageIdRef.current) {
      return
    }

    lastProcessedChatMessageIdRef.current = latestAssistantMessage.id

    const successfulToolNames = new Set(
      (latestAssistantMessage.executedToolCalls ?? [])
        .filter((toolCall) => toolCall.success)
        .map((toolCall) => toolCall.name)
    )
    if (successfulToolNames.size === 0) {
      return
    }

    const listMutationToolNames = new Set([
      "create_list",
      "update_list",
      "delete_list",
      "create_list_item",
      "update_list_item",
      "delete_list_item",
      "add_people_to_list",
      "add_recipe_to_list",
      "remove_recipe_from_list",
    ])
    const eventMutationToolNames = new Set([
      "create_event",
      "update_event",
      "delete_event",
      "add_lists_to_event",
      "remove_lists_from_event",
    ])
    const savedRecipeMutationToolNames = new Set([
      "save_recipe",
      "remove_saved_recipe",
    ])

    const shouldReloadLists = [...successfulToolNames].some((toolName) => listMutationToolNames.has(toolName))
    const shouldReloadEvents = [...successfulToolNames].some((toolName) => eventMutationToolNames.has(toolName))
    const shouldReloadMealPlanner =
      shouldReloadEvents ||
      successfulToolNames.has("add_recipe_to_list") ||
      successfulToolNames.has("remove_recipe_from_list")
    const shouldReloadSavedRecipes =
      [...successfulToolNames].some((toolName) => savedRecipeMutationToolNames.has(toolName)) ||
      successfulToolNames.has("add_recipe_to_list")

    void (async () => {
      if (shouldReloadLists) {
        await lists.loadLists().catch((error) => {
          console.error("Failed to refresh lists after chat tool execution", error)
        })
      }

      if (shouldReloadEvents) {
        await events.loadEvents().catch((error) => {
          console.error("Failed to refresh events after chat tool execution", error)
        })
      }

      if (shouldReloadMealPlanner) {
        await mealPlanner.loadMealPlanEntries().catch((error) => {
          console.error("Failed to refresh meal planner after chat tool execution", error)
        })
      }

      if (shouldReloadSavedRecipes) {
        const nextSavedRecipes = await savedRecipes.loadSavedRecipes().catch((error) => {
          console.error("Failed to refresh saved recipes after chat tool execution", error)
          return null
        })
        if (nextSavedRecipes) {
          recipes.syncSavedRecipes(nextSavedRecipes)
        }
      }
    })()
  }, [chat.messages, events, lists, mealPlanner, recipes, savedRecipes])

  return {
    chat,
    effectiveRecipeFilters,
    events,
    friends,
    lists,
    mealPlanner,
    recipes,
    savedRecipes,
    user,
  }
}
