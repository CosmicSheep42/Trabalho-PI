"use client"

export interface BackendCalendarEvent {
  id: number
  name: string
  description: string
  icon: string
  date: string
  list_ids: number[]
}

export interface CalendarEvent {
  id: string
  name: string
  description: string
  icon: string
  date: string
  listIds: string[]
}

export interface CalendarEventPayload {
  name: string
  description: string
  icon: string
  date: string
  listIds: string[]
}

export function mapBackendCalendarEvent(event: BackendCalendarEvent): CalendarEvent {
  return {
    id: String(event.id),
    name: event.name,
    description: event.description,
    icon: event.icon,
    date: event.date,
    listIds: event.list_ids.map(String),
  }
}
