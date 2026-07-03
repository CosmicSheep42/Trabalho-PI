"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useEffect, useState } from "react"
import type { ShopList } from "@/components/shoplist-banner"
import { apiRequest } from "@/lib/api"
import type {
  BackendList,
  BackendListItem,
  BackendListUser,
  ListItem,
  ListMemberUser,
} from "@/features/lists/types"

interface ListPayload {
  name: string
  color: string
  date?: string | null
}

interface ShareListPayload {
  friend_user_id?: number | null
  friend_user_ids?: number[]
  group_ids?: number[]
}

interface FriendAvatarsResponse {
  avatars: Record<string, string>
}

interface ListItemPayload {
  text?: string
  amount?: string
  checked?: boolean
}

function formatAmount(quantity: number | null, unit: string | null): string {
  if (quantity === null && !unit) {
    return ""
  }

  const quantityText =
    quantity === null
      ? ""
      : Number.isInteger(quantity)
        ? String(quantity)
        : String(quantity)

  if (!quantityText) {
    return unit ?? ""
  }

  return unit ? `${quantityText} ${unit}` : quantityText
}

function parseAmount(value: string): { quantity?: number | null; unit?: string | null } {
  const rawValue = value.trim()
  if (!rawValue) {
    return { quantity: null, unit: null }
  }

  const match = rawValue.match(/^(\d+(?:[.,]\d+)?)(?:\s*(.*))?$/)
  if (!match) {
    return { quantity: null, unit: rawValue }
  }

  const quantity = Number.parseFloat(match[1].replace(",", "."))
  const unit = match[2]?.trim() || null
  return { quantity, unit }
}

function mapBackendItem(item: BackendListItem): ListItem {
  return {
    id: String(item.id),
    text: item.name,
    amount: formatAmount(item.quantity, item.unit),
    checked: item.checked,
  }
}

function attachAvatarToBackendListUser(user: BackendListUser, avatars: Record<string, string>): BackendListUser {
  return {
    ...user,
    avatar: avatars[user.clerk_user_id] ?? user.avatar ?? null,
  }
}

function mapBackendListUser(user: BackendListUser): ListMemberUser {
  return {
    id: String(user.id),
    username: user.username,
    clerkUserId: user.clerk_user_id,
    avatar: user.avatar ?? null,
  }
}

function mapBackendList(list: BackendList): ShopList {
  return {
    id: String(list.id),
    name: list.name,
    color: list.color,
    itemCount: list.items.length,
    owner: mapBackendListUser(list.owner),
    collaborators: list.collaborators.map(mapBackendListUser),
    linkedRecipeIds: list.recipe_ids.map(String),
    listRecipes: list.list_recipes.map((link) => ({
      recipeId: String(link.recipe_id),
      servings: link.servings,
    })),
    date: list.date ?? undefined,
  }
}

function buildListState(lists: BackendList[]) {
  return {
    lists: lists.map(mapBackendList),
    listItems: Object.fromEntries(
      lists.map((list) => [String(list.id), list.items.map(mapBackendItem)])
    ) as Record<string, ListItem[]>,
  }
}

export function useBackendLists() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [lists, setLists] = useState<ShopList[]>([])
  const [listItems, setListItems] = useState<Record<string, ListItem[]>>({})
  const [isLoadingLists, setIsLoadingLists] = useState(false)

  const loadAvatars = useCallback(async (clerkUserIds: string[]) => {
    try {
      const response = await fetch("/api/friend-avatars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clerkUserIds }),
      })

      if (!response.ok) {
        return {}
      }

      const { avatars } = await response.json() as FriendAvatarsResponse
      return avatars
    } catch (error) {
      console.error("Failed to load list member avatars", error)
      return {}
    }
  }, [])

  const attachAvatarsToLists = useCallback(async (lists: BackendList[]) => {
    const clerkUserIds = Array.from(
      new Set(
        lists.flatMap((list) => [
          list.owner.clerk_user_id,
          ...list.collaborators.map((member) => member.clerk_user_id),
        ]).filter(Boolean)
      )
    )

    if (clerkUserIds.length === 0) {
      return lists
    }

    const avatars = await loadAvatars(clerkUserIds)
    return lists.map((list) => ({
      ...list,
      owner: attachAvatarToBackendListUser(list.owner, avatars),
      collaborators: list.collaborators.map((member) => attachAvatarToBackendListUser(member, avatars)),
    }))
  }, [loadAvatars])

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return
    }

    let isCancelled = false

    async function loadLists() {
      setIsLoadingLists(true)

      try {
        const token = await getToken()
        if (!token) {
          throw new Error("Missing Clerk session token")
        }

        const response = await apiRequest<BackendList[]>("/api/lists", {
          method: "GET",
          token,
        })

        if (!isCancelled) {
          const enrichedLists = await attachAvatarsToLists(response)
          const nextState = buildListState(enrichedLists)
          setLists(nextState.lists)
          setListItems(nextState.listItems)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load lists", error)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLists(false)
        }
      }
    }

    void loadLists()

    return () => {
      isCancelled = true
    }
  }, [attachAvatarsToLists, getToken, isAuthLoaded, isSignedIn])

  async function withToken<T>(callback: (token: string) => Promise<T>) {
    const token = await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    return callback(token)
  }

  async function syncListResponse(response: BackendList): Promise<ShopList> {
    const [enrichedResponse] = await attachAvatarsToLists([response])
    const nextList = mapBackendList(enrichedResponse)
    setLists((prev) => {
      const exists = prev.some((list) => list.id === nextList.id)
      if (!exists) {
        return [nextList, ...prev]
      }
      return prev.map((list) => (list.id === nextList.id ? nextList : list))
    })
    setListItems((prev) => ({
      ...prev,
      [nextList.id]: enrichedResponse.items.map(mapBackendItem),
    }))
    return nextList
  }

  async function createList(payload: ListPayload): Promise<ShopList> {
    const response = await withToken((token) =>
      apiRequest<BackendList>("/api/lists", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      })
    )

    return await syncListResponse(response)
  }

  async function updateList(listId: string, payload: Partial<ListPayload>): Promise<ShopList> {
    const response = await withToken((token) =>
      apiRequest<BackendList>(`/api/lists/${listId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      })
    )

    return await syncListResponse(response)
  }

  async function shareList(listId: string, payload: ShareListPayload): Promise<ShopList> {
    const response = await withToken((token) =>
      apiRequest<BackendList>(`/api/lists/${listId}/share`, {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      })
    )

    return await syncListResponse(response)
  }

  async function removeListCollaborator(listId: string, memberUserId: string): Promise<ShopList> {
    const response = await withToken((token) =>
      apiRequest<BackendList>(`/api/lists/${listId}/members/${memberUserId}`, {
        method: "DELETE",
        token,
      })
    )

    return await syncListResponse(response)
  }

  async function deleteList(listId: string): Promise<void> {
    await withToken((token) =>
      apiRequest<{ success: boolean }>(`/api/lists/${listId}`, {
        method: "DELETE",
        token,
      })
    )

    setLists((prev) => prev.filter((list) => list.id !== listId))
    setListItems((prev) => {
      const { [listId]: _removed, ...rest } = prev
      return rest
    })
  }

  async function addItem(listId: string, payload: Required<Pick<ListItemPayload, "text">> & ListItemPayload): Promise<ListItem> {
    const parsedAmount = parseAmount(payload.amount ?? "")
    const response = await withToken((token) =>
      apiRequest<BackendListItem>(`/api/lists/${listId}/items`, {
        method: "POST",
        token,
        body: JSON.stringify({
          name: payload.text,
          quantity: parsedAmount.quantity ?? null,
          unit: parsedAmount.unit ?? null,
          checked: payload.checked ?? false,
        }),
      })
    )

    const nextItem = mapBackendItem(response)
    setListItems((prev) => ({
      ...prev,
      [listId]: [...(prev[listId] ?? []), nextItem],
    }))
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, itemCount: list.itemCount + 1 } : list
      )
    )
    return nextItem
  }

  async function updateItem(listId: string, itemId: string, payload: ListItemPayload): Promise<ListItem> {
    const nextPayload: Record<string, boolean | number | string | null> = {}
    if (payload.text !== undefined) {
      nextPayload.name = payload.text
    }
    if (payload.amount !== undefined) {
      const parsedAmount = parseAmount(payload.amount)
      nextPayload.quantity = parsedAmount.quantity ?? null
      nextPayload.unit = parsedAmount.unit ?? null
    }
    if (payload.checked !== undefined) {
      nextPayload.checked = payload.checked
    }

    const response = await withToken((token) =>
      apiRequest<BackendListItem>(`/api/lists/items/${itemId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(nextPayload),
      })
    )

    const nextItem = mapBackendItem(response)
    setListItems((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).map((item) => (item.id === itemId ? nextItem : item)),
    }))
    return nextItem
  }

  async function deleteItem(listId: string, itemId: string): Promise<void> {
    await withToken((token) =>
      apiRequest<{ success: boolean }>(`/api/lists/items/${itemId}`, {
        method: "DELETE",
        token,
      })
    )

    setListItems((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).filter((item) => item.id !== itemId),
    }))
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, itemCount: Math.max(0, list.itemCount - 1) } : list
      )
    )
  }

  async function deleteItems(listId: string, itemIds: string[]): Promise<void> {
    await withToken((token) =>
      apiRequest<{ success: boolean }>(`/api/lists/${listId}/items/bulk-delete`, {
        method: "POST",
        token,
        body: JSON.stringify({ item_ids: itemIds.map(Number) }),
      })
    )

    setListItems((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).filter((item) => !itemIds.includes(item.id)),
    }))
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, itemCount: Math.max(0, list.itemCount - itemIds.length) }
          : list
      )
    )
  }

  async function addRecipeToList(
    listId: string,
    recipeId: string,
    servings?: number | null
  ): Promise<void> {
    const response = await withToken((token) =>
      apiRequest<BackendList>(`/api/lists/${listId}/recipes/${recipeId}`, {
        method: "POST",
        token,
        body: JSON.stringify({
          servings: servings ?? null,
        }),
      })
    )

    await syncListResponse(response)
  }

  async function removeRecipeFromList(listId: string, recipeId: string): Promise<void> {
    const response = await withToken((token) =>
      apiRequest<BackendList>(`/api/lists/${listId}/recipes/${recipeId}`, {
        method: "DELETE",
        token,
      })
    )

    await syncListResponse(response)
  }

  return {
    lists,
    listItems,
    isLoadingLists,
    syncListResponse,
    createList,
    updateList,
    shareList,
    removeListCollaborator,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    deleteItems,
    addRecipeToList,
    removeRecipeFromList,
  }
}
