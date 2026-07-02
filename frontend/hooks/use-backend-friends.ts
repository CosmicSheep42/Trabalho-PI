"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type { FriendSearchResult, FriendsOverview, FriendUser } from "@/features/friends/types"

export function useBackendFriends() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [overview, setOverview] = useState<FriendsOverview>({
    friends: [],
    incoming_requests: [],
    outgoing_requests: [],
  })
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [isSearchingFriends, setIsSearchingFriends] = useState(false)
  const [isSavingFriendAction, setIsSavingFriendAction] = useState(false)

  const loadFriends = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    const response = await apiRequest<FriendsOverview>("/api/friends", {
      method: "GET",
      token,
    })

    setOverview(response)
    return response
  }, [getToken])

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

  async function searchFriends(query: string) {
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
      setSearchResults(response)
      return response
    } finally {
      setIsSearchingFriends(false)
    }
  }

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

  return {
    friends: overview.friends,
    incomingFriendRequests: overview.incoming_requests,
    outgoingFriendRequests: overview.outgoing_requests,
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
  }
}
