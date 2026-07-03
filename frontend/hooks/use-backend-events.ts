"use client"

import { useAuth } from "@clerk/nextjs"
import { useCallback, useEffect, useState } from "react"
import { apiRequest } from "@/lib/api"
import type {
  BackendCalendarEvent,
  CalendarEvent,
  CalendarEventPayload,
} from "@/features/events/types"
import { mapBackendCalendarEvent } from "@/features/events/types"

interface ShareEventPayload {
  friend_user_id?: number | null
  friend_user_ids?: number[]
  group_ids?: number[]
}

interface FriendAvatarsResponse {
  avatars: Record<string, string>
}

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((left, right) =>
    left.date === right.date ? left.name.localeCompare(right.name) : left.date.localeCompare(right.date)
  )
}

export function useBackendEvents() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])

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
      console.error("Failed to load event member avatars", error)
      return {}
    }
  }, [])

  const attachAvatarsToEvents = useCallback(async (backendEvents: BackendCalendarEvent[]) => {
    const clerkUserIds = Array.from(
      new Set(
        backendEvents.flatMap((event) => [
          event.owner.clerk_user_id,
          ...event.collaborators.map((member) => member.clerk_user_id),
        ]).filter(Boolean)
      )
    )

    if (clerkUserIds.length === 0) {
      return backendEvents
    }

    const avatars = await loadAvatars(clerkUserIds)
    return backendEvents.map((event) => ({
      ...event,
      owner: {
        ...event.owner,
        avatar: avatars[event.owner.clerk_user_id] ?? event.owner.avatar ?? null,
      },
      collaborators: event.collaborators.map((member) => ({
        ...member,
        avatar: avatars[member.clerk_user_id] ?? member.avatar ?? null,
      })),
    }))
  }, [loadAvatars])

  const loadEvents = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    const response = await apiRequest<BackendCalendarEvent[]>("/api/events", {
      method: "GET",
      token,
    })

    const enrichedResponse = await attachAvatarsToEvents(response)
    setEvents(enrichedResponse.map(mapBackendCalendarEvent))
  }, [attachAvatarsToEvents, getToken])

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return
    }

    let isCancelled = false

    async function fetchEvents() {
      try {
        const token = await getToken()
        if (!isCancelled) {
          await loadEvents(token ?? undefined)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load events", error)
        }
      }
    }

    void fetchEvents()

    return () => {
      isCancelled = true
    }
  }, [getToken, isAuthLoaded, isSignedIn, loadEvents])

  async function withToken<T>(callback: (token: string) => Promise<T>) {
    const token = await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    return callback(token)
  }

  async function createEvent(payload: CalendarEventPayload): Promise<CalendarEvent> {
    return withToken(async (token) => {
      const response = await apiRequest<BackendCalendarEvent>("/api/events", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...payload,
          list_ids: payload.listIds.map(Number),
        }),
      })
      const [enrichedResponse] = await attachAvatarsToEvents([response])
      const nextEvent = mapBackendCalendarEvent(enrichedResponse)
      setEvents((prev) => sortEvents([...prev, nextEvent]))
      return nextEvent
    })
  }

  async function updateEvent(eventId: string, payload: CalendarEventPayload): Promise<CalendarEvent> {
    return withToken(async (token) => {
      const response = await apiRequest<BackendCalendarEvent>(`/api/events/${eventId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          ...payload,
          list_ids: payload.listIds.map(Number),
        }),
      })
      const [enrichedResponse] = await attachAvatarsToEvents([response])
      const nextEvent = mapBackendCalendarEvent(enrichedResponse)
      setEvents((prev) =>
        sortEvents(prev.map((event) => (event.id === nextEvent.id ? nextEvent : event)))
      )
      return nextEvent
    })
  }

  async function shareEvent(eventId: string, payload: ShareEventPayload): Promise<CalendarEvent> {
    return withToken(async (token) => {
      const response = await apiRequest<BackendCalendarEvent>(`/api/events/${eventId}/share`, {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      })
      const [enrichedResponse] = await attachAvatarsToEvents([response])
      const nextEvent = mapBackendCalendarEvent(enrichedResponse)
      setEvents((prev) =>
        sortEvents(prev.map((event) => (event.id === nextEvent.id ? nextEvent : event)))
      )
      return nextEvent
    })
  }

  async function removeEventCollaborator(eventId: string, memberUserId: string): Promise<CalendarEvent> {
    return withToken(async (token) => {
      const response = await apiRequest<BackendCalendarEvent>(`/api/events/${eventId}/members/${memberUserId}`, {
        method: "DELETE",
        token,
      })
      const [enrichedResponse] = await attachAvatarsToEvents([response])
      const nextEvent = mapBackendCalendarEvent(enrichedResponse)
      setEvents((prev) =>
        sortEvents(prev.map((event) => (event.id === nextEvent.id ? nextEvent : event)))
      )
      return nextEvent
    })
  }

  async function deleteEvent(eventId: string): Promise<void> {
    await withToken(async (token) => {
      await apiRequest<{ success: boolean }>(`/api/events/${eventId}`, {
        method: "DELETE",
        token,
      })
      setEvents((prev) => prev.filter((event) => event.id !== eventId))
    })
  }

  return {
    events,
    loadEvents,
    createEvent,
    updateEvent,
    shareEvent,
    removeEventCollaborator,
    deleteEvent,
  }
}
