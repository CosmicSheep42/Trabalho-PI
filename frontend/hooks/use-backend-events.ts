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

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((left, right) =>
    left.date === right.date ? left.name.localeCompare(right.name) : left.date.localeCompare(right.date)
  )
}

export function useBackendEvents() {
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const loadEvents = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? await getToken()
    if (!token) {
      throw new Error("Missing Clerk session token")
    }

    const response = await apiRequest<BackendCalendarEvent[]>("/api/events", {
      method: "GET",
      token,
    })

    setEvents(response.map(mapBackendCalendarEvent))
  }, [getToken])

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
      const nextEvent = mapBackendCalendarEvent(response)
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
      const nextEvent = mapBackendCalendarEvent(response)
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
    deleteEvent,
  }
}
