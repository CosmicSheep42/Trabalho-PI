"use client"

import { format } from "date-fns"
import { useState } from "react"
import { eventIconOptions, inlineListColorOptions } from "@/features/home/components/lists-tab/constants"
import type {
  EventFormState,
  EventInlineListFormState,
  PendingRemoval,
} from "@/features/home/components/lists-tab/types"
import type { CalendarEvent } from "@/features/events/types"

export function useListsTabState() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [pinnedListIds, setPinnedListIds] = useState<string[]>([])
  const [draggedRecipeId, setDraggedRecipeId] = useState<string | null>(null)
  const [savedRecipesExpanded, setSavedRecipesExpanded] = useState(false)
  const [selectedSavedTab, setSelectedSavedTab] = useState("saved-recipes")
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [eventViewerOpen, setEventViewerOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedEventForm, setSelectedEventForm] = useState<EventFormState>({
    name: "",
    description: "",
    icon: eventIconOptions[0].value,
    date: format(new Date(), "yyyy-MM-dd"),
    listIds: [],
  })
  const [eventForm, setEventForm] = useState<EventFormState>({
    name: "",
    description: "",
    icon: eventIconOptions[0].value,
    date: format(new Date(), "yyyy-MM-dd"),
    listIds: [],
  })
  const [eventInlineListForm, setEventInlineListForm] = useState<EventInlineListFormState>({
    name: "",
    color: inlineListColorOptions[0].name,
  })
  return {
    calendarMonth,
    draggedRecipeId,
    eventDialogOpen,
    eventForm,
    eventInlineListForm,
    eventViewerOpen,
    pendingRemoval,
    pinnedListIds,
    savedRecipesExpanded,
    selectedDate,
    selectedEvent,
    selectedEventForm,
    selectedSavedTab,
    setCalendarMonth,
    setDraggedRecipeId,
    setEventDialogOpen,
    setEventForm,
    setEventInlineListForm,
    setEventViewerOpen,
    setPendingRemoval,
    setPinnedListIds,
    setSavedRecipesExpanded,
    setSelectedDate,
    setSelectedEvent,
    setSelectedEventForm,
    setSelectedSavedTab,
  }
}
