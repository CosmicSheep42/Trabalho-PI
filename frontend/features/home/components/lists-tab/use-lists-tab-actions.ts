"use client"

import { format } from "date-fns"
import { useEffect, useRef } from "react"
import type { Dispatch, DragEvent as ReactDragEvent, PointerEvent, RefObject, SetStateAction } from "react"
import { eventIconOptions, inlineListColorOptions } from "@/features/home/components/lists-tab/constants"
import type { ListsTabProps } from "@/features/home/components/lists-tab/types"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import type { CalendarEvent } from "@/features/events/types"

interface ListsTabActionState {
  draggedRecipeId: string | null
  eventForm: {
    name: string
    description: string
    icon: string
    date: string
    listIds: string[]
  }
  eventInlineListForm: {
    name: string
    color: string
  }
  pendingRemoval: {
    source: "saved" | "planner"
    recipeId: string
    recipeName: string
    entryId?: string
  } | null
  selectedDate?: Date
  selectedEvent: CalendarEvent | null
  selectedEventForm: {
    name: string
    description: string
    icon: string
    date: string
    listIds: string[]
  }
  setDraggedRecipeId: (recipeId: string | null) => void
  setEventDialogOpen: (open: boolean) => void
  setEventForm: Dispatch<
    SetStateAction<{
      name: string
      description: string
      icon: string
      date: string
      listIds: string[]
    }>
  >
  setEventInlineListForm: Dispatch<
    SetStateAction<{
      name: string
      color: string
    }>
  >
  setEventViewerOpen: (open: boolean) => void
  setPendingRemoval: Dispatch<SetStateAction<ListsTabActionState["pendingRemoval"]>>
  setSelectedDate: (date: Date) => void
  setSelectedEvent: (event: CalendarEvent | null) => void
  setSelectedEventForm: Dispatch<SetStateAction<ListsTabActionState["selectedEventForm"]>>
}

interface ListsTabActionData {
  mealPlannerRecipes: ListsTabProps["savedRecipes"]
  plannerEntriesByDay: Record<DayOfWeek, MealPlanEntry[]>
}

export function useListsTabActions(
  props: Pick<
    ListsTabProps,
    | "allLists"
    | "mealPlanEntries"
    | "onCreateEvent"
    | "onCreateListForEvent"
    | "onCreateMealPlanEntry"
    | "onDeleteMealPlanEntry"
    | "onDeleteSavedRecipe"
    | "onUnplanMealPlanEntry"
    | "onShareEventWithFriend"
    | "onShareEventWithGroup"
    | "onRemoveEventCollaborator"
    | "onUpdateEvent"
    | "onUpdateMealPlanEntry"
  >,
  state: ListsTabActionState,
  data: ListsTabActionData
) {
  const autoScrollDirectionRef = useRef<1 | -1 | 0>(0)
  const autoScrollFrameRef = useRef<number | null>(null)
  const savedTabsScrollRef = useRef<HTMLDivElement | null>(null)
  const savedTabsDragStateRef = useRef<{
    pointerId: number
    startX: number
    startScrollLeft: number
  } | null>(null)

  useEffect(() => {
    if (!state.draggedRecipeId) {
      autoScrollDirectionRef.current = 0
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current)
        autoScrollFrameRef.current = null
      }
      return
    }

    const edgeThreshold = 96
    const scrollStep = 10

    function tick() {
      if (autoScrollDirectionRef.current !== 0) {
        window.scrollBy({ top: scrollStep * autoScrollDirectionRef.current, behavior: "auto" })
        autoScrollFrameRef.current = window.requestAnimationFrame(tick)
        return
      }

      autoScrollFrameRef.current = null
    }

    function ensureTicking() {
      if (autoScrollFrameRef.current === null) {
        autoScrollFrameRef.current = window.requestAnimationFrame(tick)
      }
    }

    function handleDragOver(event: globalThis.DragEvent) {
      const pointerY = event.clientY
      const viewportHeight = window.innerHeight

      if (pointerY <= edgeThreshold) {
        autoScrollDirectionRef.current = -1
        ensureTicking()
        return
      }

      if (pointerY >= viewportHeight - edgeThreshold) {
        autoScrollDirectionRef.current = 1
        ensureTicking()
        return
      }

      autoScrollDirectionRef.current = 0
    }

    function stopAutoScroll() {
      autoScrollDirectionRef.current = 0
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current)
        autoScrollFrameRef.current = null
      }
    }

    window.addEventListener("dragover", handleDragOver)
    window.addEventListener("drop", stopAutoScroll)
    window.addEventListener("dragend", stopAutoScroll)

    return () => {
      window.removeEventListener("dragover", handleDragOver)
      window.removeEventListener("drop", stopAutoScroll)
      window.removeEventListener("dragend", stopAutoScroll)
      stopAutoScroll()
    }
  }, [state.draggedRecipeId])

  async function persistDayEntries(day: DayOfWeek, entries: MealPlanEntry[]) {
    await Promise.all(
      entries.map((entry, index) => {
        const persistedEntry = props.mealPlanEntries.find((currentEntry) => currentEntry.id === entry.id)
        if (persistedEntry && persistedEntry.dayOfWeek === day && persistedEntry.position === index) {
          return Promise.resolve(entry)
        }

        return props.onUpdateMealPlanEntry(entry.id, {
          dayOfWeek: day,
          position: index,
        })
      })
    )
  }

  async function moveRecipe(
    recipeId: string,
    fromDay: DayOfWeek | "bank",
    toDay: DayOfWeek | "bank",
    targetIndex?: number,
    entryId?: string
  ) {
    if (toDay === "bank") {
      if (!entryId) {
        return
      }

      await props.onUnplanMealPlanEntry(entryId)
      return
    }

    let insertionIndex = Math.max(
      0,
      Math.min(targetIndex ?? data.plannerEntriesByDay[toDay].length, data.plannerEntriesByDay[toDay].length)
    )

    if (fromDay === "bank") {
      const savedRecipe = data.mealPlannerRecipes.find((recipe) => recipe.id === recipeId)
      const createdEntry = await props.onCreateMealPlanEntry({
        recipeId,
        dayOfWeek: toDay,
        position: insertionIndex,
        servings: savedRecipe?.servings,
      })

      const nextTargetEntries = [...data.plannerEntriesByDay[toDay]]
      nextTargetEntries.splice(insertionIndex, 0, createdEntry)
      await persistDayEntries(toDay, nextTargetEntries)
      return
    }

    if (!entryId) {
      return
    }

    const movingEntry = props.mealPlanEntries.find((entry) => entry.id === entryId)
    if (!movingEntry) {
      return
    }

    if (fromDay === toDay && targetIndex !== undefined && movingEntry.position < targetIndex) {
      insertionIndex = Math.max(0, insertionIndex - 1)
    }

    const nextSourceEntries = data.plannerEntriesByDay[fromDay].filter((entry) => entry.id !== entryId)
    const nextTargetEntries = fromDay === toDay ? nextSourceEntries : [...data.plannerEntriesByDay[toDay]]

    nextTargetEntries.splice(insertionIndex, 0, {
      ...movingEntry,
      dayOfWeek: toDay,
      position: insertionIndex,
    })

    await persistDayEntries(toDay, nextTargetEntries)
    if (fromDay !== toDay) {
      await persistDayEntries(fromDay, nextSourceEntries)
    }
  }

  async function confirmRemoval() {
    if (!state.pendingRemoval) {
      return
    }

    if (state.pendingRemoval.source === "saved") {
      await props.onDeleteSavedRecipe(state.pendingRemoval.recipeId)
      state.setPendingRemoval(null)
      return
    }

    if (state.pendingRemoval.entryId) {
      await props.onDeleteMealPlanEntry(state.pendingRemoval.entryId, state.pendingRemoval.recipeId)
    }
    state.setPendingRemoval(null)
  }

  function handleSavedTabsPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") {
      return
    }

    const container = savedTabsScrollRef.current
    if (!container) {
      return
    }

    savedTabsDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
    }
    container.setPointerCapture(event.pointerId)
  }

  function handleSavedTabsPointerMove(event: PointerEvent<HTMLDivElement>) {
    const container = savedTabsScrollRef.current
    const dragState = savedTabsDragStateRef.current

    if (!container || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    container.scrollLeft = dragState.startScrollLeft - deltaX
  }

  function handleSavedTabsPointerEnd(event: PointerEvent<HTMLDivElement>) {
    const container = savedTabsScrollRef.current
    const dragState = savedTabsDragStateRef.current

    if (!container || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    savedTabsDragStateRef.current = null
    container.releasePointerCapture(event.pointerId)
  }

  function openEventDialog(date?: Date) {
    state.setEventForm({
      name: "",
      description: "",
      icon: eventIconOptions[0].value,
      date: format(date ?? state.selectedDate ?? new Date(), "yyyy-MM-dd"),
      listIds: [],
    })
    state.setEventInlineListForm({
      name: "",
      color: inlineListColorOptions[0].name,
    })
    state.setEventDialogOpen(true)
  }

  function openEventViewer(date: Date) {
    state.setSelectedDate(date)
    state.setEventViewerOpen(true)
  }

  function openEventDetail(event: CalendarEvent) {
    state.setSelectedEvent(event)
    state.setSelectedEventForm({
      name: event.name,
      description: event.description,
      icon: event.icon,
      date: event.date,
      listIds: event.listIds,
    })
  }

  function handleCalendarDayClick(day: Date, dayEvents: CalendarEvent[]) {
    state.setSelectedDate(day)

    if (dayEvents.length === 1) {
      openEventDetail(dayEvents[0])
      return
    }

    if (dayEvents.length > 1) {
      openEventViewer(day)
    }
  }

  function toggleSelectedEventList(listId: string, checked: boolean) {
    state.setSelectedEventForm((current) => ({
      ...current,
      listIds: checked
        ? [...current.listIds, listId]
        : current.listIds.filter((currentListId) => currentListId !== listId),
    }))
  }

  function toggleEventList(listId: string, checked: boolean) {
    state.setEventForm((current) => ({
      ...current,
      listIds: checked
        ? [...current.listIds, listId]
        : current.listIds.filter((currentListId) => currentListId !== listId),
    }))
  }

  async function handleUpdateSelectedEvent() {
    if (!state.selectedEvent || !state.selectedEventForm.name.trim()) {
      return
    }

    const updatedEvent = await props.onUpdateEvent(state.selectedEvent.id, {
      ...state.selectedEventForm,
      name: state.selectedEventForm.name.trim(),
      description: state.selectedEventForm.description.trim(),
    })
    state.setSelectedEvent(updatedEvent)
    state.setSelectedEventForm({
      name: updatedEvent.name,
      description: updatedEvent.description,
      icon: updatedEvent.icon,
      date: updatedEvent.date,
      listIds: updatedEvent.listIds,
    })
    state.setSelectedEvent(null)
  }

  async function handleShareSelectedEventWithFriend(friendUserId: number) {
    if (!state.selectedEvent) {
      return
    }

    const updatedEvent = await props.onShareEventWithFriend(state.selectedEvent.id, friendUserId)
    state.setSelectedEvent(updatedEvent)
  }

  async function handleShareSelectedEventWithGroup(groupId: number) {
    if (!state.selectedEvent) {
      return
    }

    const updatedEvent = await props.onShareEventWithGroup(state.selectedEvent.id, groupId)
    state.setSelectedEvent(updatedEvent)
  }

  async function handleRemoveSelectedEventCollaborator(memberUserId: string) {
    if (!state.selectedEvent) {
      return
    }

    const updatedEvent = await props.onRemoveEventCollaborator(state.selectedEvent.id, memberUserId)
    state.setSelectedEvent(updatedEvent)
  }

  async function handleCreateEvent() {
    if (!state.eventForm.name.trim()) {
      return
    }

    await props.onCreateEvent({
      ...state.eventForm,
      name: state.eventForm.name.trim(),
      description: state.eventForm.description.trim(),
    })
    state.setEventDialogOpen(false)
  }

  async function handleCreateInlineListForEvent() {
    if (!state.eventInlineListForm.name.trim()) {
      return
    }

    const createdList = await props.onCreateListForEvent({
      name: state.eventInlineListForm.name.trim(),
      color: state.eventInlineListForm.color,
      date: state.eventForm.date || null,
    })

    state.setEventForm((current) => ({
      ...current,
      listIds: current.listIds.includes(createdList.id) ? current.listIds : [...current.listIds, createdList.id],
    }))
    state.setEventInlineListForm({
      name: "",
      color: inlineListColorOptions[0].name,
    })
  }

  function handlePlannerDayDrop(day: DayOfWeek, event: ReactDragEvent<HTMLDivElement>, targetIndex?: number) {
    event.preventDefault()
    const recipeId = event.dataTransfer.getData("text/recipe-id")
    const fromDay = event.dataTransfer.getData("text/from-day")
    const entryId = event.dataTransfer.getData("text/entry-id") || undefined
    if (!recipeId || !fromDay) {
      return
    }
    void moveRecipe(recipeId, fromDay as DayOfWeek | "bank", day, targetIndex, entryId)
    state.setDraggedRecipeId(null)
  }

  function handleSavedBankDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault()
    const recipeId = event.dataTransfer.getData("text/recipe-id")
    const fromDay = event.dataTransfer.getData("text/from-day")
    const entryId = event.dataTransfer.getData("text/entry-id") || undefined
    if (!recipeId || !fromDay || fromDay === "bank") {
      return
    }
    void moveRecipe(recipeId, fromDay as DayOfWeek, "bank", undefined, entryId)
    state.setDraggedRecipeId(null)
  }

  return {
    confirmRemoval,
    handleCalendarDayClick,
    handleCreateEvent,
    handleCreateInlineListForEvent,
    handleRemoveSelectedEventCollaborator,
    handlePlannerDayDrop,
    handleSavedBankDrop,
    handleSavedTabsPointerDown,
    handleSavedTabsPointerEnd,
    handleSavedTabsPointerMove,
    handleShareSelectedEventWithFriend,
    handleShareSelectedEventWithGroup,
    handleUpdateSelectedEvent,
    openEventDetail,
    openEventDialog,
    savedTabsScrollRef,
    toggleEventList,
    toggleSelectedEventList,
  }
}
