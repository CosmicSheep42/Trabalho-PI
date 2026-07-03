"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type { FriendGroup, FriendSearchResult, FriendsOverview, FriendUser } from "@/features/friends/types"

interface FriendAvatarsResponse {
  avatars: Record<string, string>
}

function attachAvatarToUser(user: FriendUser, avatars: Record<string, string>): FriendUser {
  return {
    ...user,
    avatar: avatars[user.clerk_user_id] ?? user.avatar ?? null,
  }
}

export function useBackendFriends() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [overview, setOverview] = useState<FriendsOverview>({
    friends: [],
    incoming_requests: [],
    outgoing_requests: [],
    groups: [],
  })
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [isSearchingFriends, setIsSearchingFriends] = useState(false)
  const [isSavingFriendAction, setIsSavingFriendAction] = useState(false)

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
      console.error("Failed to load friend avatars", error)
      return {}
    }
  }, [])

  const attachAvatarsToSearchResults = useCallback(async (results: FriendSearchResult[]) => {
    const clerkUserIds = Array.from(
      new Set(results.map((result) => result.user.clerk_user_id).filter(Boolean))
    )

    if (clerkUserIds.length === 0) {
      return results
    }

    const avatars = await loadAvatars(clerkUserIds)
    return results.map((result) => ({
      ...result,
      user: attachAvatarToUser(result.user, avatars),
    }))
  }, [loadAvatars])

  const attachAvatarsToOverview = useCallback(async (nextOverview: FriendsOverview) => {
    const clerkUserIds = Array.from(
      new Set([
        ...nextOverview.friends.map((friend) => friend.clerk_user_id),
        ...nextOverview.incoming_requests.map((request) => request.user.clerk_user_id),
        ...nextOverview.outgoing_requests.map((request) => request.user.clerk_user_id),
      ].filter(Boolean))
    )

    if (clerkUserIds.length === 0) {
      return nextOverview
    }

    const avatars = await loadAvatars(clerkUserIds)
    return {
      ...nextOverview,
      friends: nextOverview.friends.map((friend) => attachAvatarToUser(friend, avatars)),
      incoming_requests: nextOverview.incoming_requests.map((request) => ({
        ...request,
        user: attachAvatarToUser(request.user, avatars),
      })),
      outgoing_requests: nextOverview.outgoing_requests.map((request) => ({
        ...request,
        user: attachAvatarToUser(request.user, avatars),
      })),
      groups: nextOverview.groups.map((group) => ({
        ...group,
        members: group.members.map((member) => attachAvatarToUser(member, avatars)),
      })),
    }
  }, [loadAvatars])

  const loadFriends = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    const response = await apiRequest<FriendsOverview>("/api/friends", {
      method: "GET",
      token,
    })
    const enrichedOverview = await attachAvatarsToOverview(response)

    setOverview(enrichedOverview)
    return enrichedOverview
  }, [attachAvatarsToOverview, getToken])

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return
    }

    let isCancelled = false

    async function fetchFriends() {
      setIsLoadingFriends(true)
      try {
        const token = await getToken()
        if (!isCancelled) {
          await loadFriends(token ?? undefined)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load friends", error)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFriends(false)
        }
      }
    }

    void fetchFriends()

    return () => {
      isCancelled = true
    }
  }, [getToken, isAuthLoaded, isSignedIn, loadFriends])

  const searchFriends = useCallback(async (query: string) => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      setSearchResults([])
      return []
    }

    setIsSearchingFriends(true)
    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Missing Clerk session token")
      }

      const response = await apiRequest<FriendSearchResult[]>(
        `/api/friends/search?query=${encodeURIComponent(normalizedQuery)}`,
        {
          method: "GET",
          token,
        }
      )
      const enrichedResults = await attachAvatarsToSearchResults(response)
      setSearchResults(enrichedResults)
      return enrichedResults
    } finally {
      setIsSearchingFriends(false)
    }
  }, [attachAvatarsToSearchResults, getToken])

  async function withAction<T>(callback: (token: string) => Promise<T>) {
    setIsSavingFriendAction(true)
    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Missing Clerk session token")
      }
      return await callback(token)
    } finally {
      setIsSavingFriendAction(false)
    }
  }

  async function sendFriendRequest(username: string) {
    return withAction(async (token) => {
      await apiRequest("/api/friends/requests", {
        method: "POST",
        token,
        body: JSON.stringify({ username }),
      })
      await loadFriends(token)
      await searchFriends(username)
    })
  }

  async function acceptFriendRequest(requestId: number): Promise<FriendUser> {
    return withAction(async (token) => {
      const response = await apiRequest<FriendUser>(`/api/friends/requests/${requestId}/accept`, {
        method: "POST",
        token,
      })
      await loadFriends(token)
      return response
    })
  }

  async function declineFriendRequest(requestId: number) {
    return withAction(async (token) => {
      await apiRequest(`/api/friends/requests/${requestId}/decline`, {
        method: "POST",
        token,
      })
      await loadFriends(token)
    })
  }

  async function cancelFriendRequest(requestId: number) {
    return withAction(async (token) => {
      await apiRequest(`/api/friends/requests/${requestId}`, {
        method: "DELETE",
        token,
      })
      await loadFriends(token)
    })
  }

  async function removeFriend(friendUserId: number) {
    return withAction(async (token) => {
      await apiRequest(`/api/friends/${friendUserId}`, {
        method: "DELETE",
        token,
      })
      await loadFriends(token)
    })
  }

  async function createFriendGroup(name: string, friendUserIds: number[]): Promise<FriendGroup> {
    return withAction(async (token) => {
      const response = await apiRequest<FriendGroup>("/api/friends/groups", {
        method: "POST",
        token,
        body: JSON.stringify({ name, friend_user_ids: friendUserIds }),
      })
      await loadFriends(token)
      return response
    })
  }

  async function updateFriendGroup(groupId: number, name: string, friendUserIds: number[]): Promise<FriendGroup> {
    return withAction(async (token) => {
      const response = await apiRequest<FriendGroup>(`/api/friends/groups/${groupId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ name, friend_user_ids: friendUserIds }),
      })
      await loadFriends(token)
      return response
    })
  }

  async function deleteFriendGroup(groupId: number) {
    return withAction(async (token) => {
      await apiRequest(`/api/friends/groups/${groupId}`, {
        method: "DELETE",
        token,
      })
      await loadFriends(token)
    })
  }

  return {
    friends: overview.friends,
    incomingFriendRequests: overview.incoming_requests,
    outgoingFriendRequests: overview.outgoing_requests,
    friendGroups: overview.groups,
    searchResults,
    isLoadingFriends,
    isSearchingFriends,
    isSavingFriendAction,
    loadFriends,
    searchFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    createFriendGroup,
    updateFriendGroup,
    deleteFriendGroup,
  }
}
