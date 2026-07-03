"use client"

import type { ListMemberUser } from "@/features/lists/types"

export interface BackendCalendarEvent {
  id: number
  name: string
  description: string
  icon: string
  date: string
  list_ids: number[]
  owner: {
    id: number
    username: string
    clerk_user_id: string
    avatar?: string | null
  }
  collaborators: Array<{
    id: number
    username: string
    clerk_user_id: string
    avatar?: string | null
  }>
}

export interface CalendarEvent {
  id: string
  name: string
  description: string
  icon: string
  date: string
  listIds: string[]
  owner: ListMemberUser
  collaborators: ListMemberUser[]
}

export interface CalendarEventPayload {
  name: string
  description: string
  icon: string
  date: string
  listIds: string[]
}

function mapBackendEventUser(user: BackendCalendarEvent["owner"]): ListMemberUser {
  return {
    id: String(user.id),
    username: user.username,
    clerkUserId: user.clerk_user_id,
    avatar: user.avatar ?? null,
  }
}

export function mapBackendCalendarEvent(event: BackendCalendarEvent): CalendarEvent {
  return {
    id: String(event.id),
    name: event.name,
    description: event.description,
    icon: event.icon,
    date: event.date,
    listIds: event.list_ids.map(String),
    owner: mapBackendEventUser(event.owner),
    collaborators: event.collaborators.map(mapBackendEventUser),
  }
}
