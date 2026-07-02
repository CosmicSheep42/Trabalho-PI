"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns"
import type { CalendarEvent } from "@/features/events/types"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import { weekDays } from "@/features/meal-planner/types"
import type { Recipe } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"
import { CalendarSection } from "@/features/home/components/lists-tab/calendar-section"
import { eventIconOptions, inlineListColorOptions } from "@/features/home/components/lists-tab/constants"
import { EventDialogs } from "@/features/home/components/lists-tab/event-dialogs"
import { MyListsSection } from "@/features/home/components/lists-tab/my-lists-section"
import { ListsTabRecipeCard } from "@/features/home/components/lists-tab/recipe-card"
import { SavedRecipesSection } from "@/features/home/components/lists-tab/saved-recipes-section"
import type {
  EventFormState,
  EventInlineListFormState,
  ListsTabProps,
  PendingRemoval,
  PlannerEventSuggestion,
  SavedRecipeTab,
} from "@/features/home/components/lists-tab/types"
import { WeeklyMealPlannerSection } from "@/features/home/components/lists-tab/weekly-meal-planner-section"

function ListsTabComponent({
  lists,
  allLists,
  recipes,
  savedRecipes,
  events,
  mealPlanEntries,
  searchQuery,
  onSearchQueryChange,
  onCreateList,
  onOpenList,
  onOpenRecipe,
  onEditList,
  onDeleteList,
  onCreateMealPlanEntry,
  onUpdateMealPlanEntry,
  onUnplanMealPlanEntry,
  onDeleteMealPlanEntry,
  onDeleteSavedRecipe,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onCreateListForEvent,
}: ListsTabProps) {
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
  const autoScrollDirectionRef = useRef<1 | -1 | 0>(0)
  const autoScrollFrameRef = useRef<number | null>(null)
  const savedTabsScrollRef = useRef<HTMLDivElement | null>(null)
  const savedTabsDragStateRef = useRef<{
    pointerId: number
    startX: number
    startScrollLeft: number
  } | null>(null)

  const mealPlannerRecipeIds = useMemo(
    () => new Set(mealPlanEntries.map((entry) => entry.recipeId)),
    [mealPlanEntries]
  )
  const mealPlannerRecipes = useMemo(
    () => savedRecipes.filter((recipe) => !mealPlannerRecipeIds.has(recipe.id)),
    [mealPlannerRecipeIds, savedRecipes]
  )
  const sortedVisibleLists = useMemo(() => {
    const pinned = lists.filter((list) => pinnedListIds.includes(list.id))
    const unpinned = lists.filter((list) => !pinnedListIds.includes(list.id))
    return [...pinned, ...unpinned]
  }, [lists, pinnedListIds])
  const sortedAllLists = useMemo(() => {
    const pinned = allLists.filter((list) => pinnedListIds.includes(list.id))
    const unpinned = allLists.filter((list) => !pinnedListIds.includes(list.id))
    return [...pinned, ...unpinned]
  }, [allLists, pinnedListIds])
  const recipeMap = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes])

  const savedRecipeTabs = useMemo<SavedRecipeTab[]>(() => {
    const listRecipeIds = new Set<string>()

    const listTabs = sortedAllLists
      .map((list) => {
        const recipeLinks =
          list.listRecipes && list.listRecipes.length > 0
            ? list.listRecipes
            : (list.linkedRecipeIds ?? []).map((recipeId) => ({ recipeId, servings: null }))
        const recipesForList = recipeLinks
          .map((link) => {
            listRecipeIds.add(link.recipeId)
            const recipe = recipeMap.get(link.recipeId)
            return recipe ? withRecipeServingsOverride(recipe, link.servings) : null
          })
          .filter((recipe): recipe is Recipe => recipe !== null)

        return {
          id: `list-${list.id}`,
          label: list.name,
          recipes: recipesForList,
          emptyMessage: `No recipes are linked to ${list.name} yet.`,
        }
      })
      .filter((tab) => tab.recipes.length > 0)

    const ungroupedRecipes = mealPlannerRecipes.filter((recipe) => !listRecipeIds.has(recipe.id))

    return [
      {
        id: "saved-recipes",
        label: "Saved Recipes",
        recipes: ungroupedRecipes,
        emptyMessage: "Your saved recipes will appear here.",
      },
      ...listTabs,
    ]
  }, [mealPlannerRecipes, recipeMap, sortedAllLists])

  const activeSavedTabId = savedRecipeTabs.some((tab) => tab.id === selectedSavedTab)
    ? selectedSavedTab
    : (savedRecipeTabs[0]?.id ?? "saved-recipes")

  useEffect(() => {
    if (!draggedRecipeId) {
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

    function handleDragOver(event: DragEvent) {
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
  }, [draggedRecipeId])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [calendarMonth])

  const plannerEntriesByDay = useMemo(
    () =>
      Object.fromEntries(
        weekDays.map((day) => [
          day,
          mealPlanEntries
            .filter((entry) => entry.dayOfWeek === day)
            .sort((left, right) => left.position - right.position),
        ])
      ) as Record<DayOfWeek, MealPlanEntry[]>,
    [mealPlanEntries]
  )

  const currentPlannerWeekDates = useMemo(
    () =>
      Object.fromEntries(
        weekDays.map((day, index) => [day, addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index)])
      ) as Record<DayOfWeek, Date>,
    []
  )

  const eventsByDate = useMemo(
    () =>
      events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        acc[event.date] = [...(acc[event.date] ?? []), event]
        return acc
      }, {}),
    [events]
  )

  const plannerEventSuggestionsByDay = useMemo(
    () =>
      weekDays.reduce<Record<DayOfWeek, PlannerEventSuggestion[]>>((acc, day) => {
        const currentDate = currentPlannerWeekDates[day]
        const dateKey = format(currentDate, "yyyy-MM-dd")
        const dayEvents = eventsByDate[dateKey] ?? []
        const plannedRecipeIds = new Set(plannerEntriesByDay[day].map((entry) => entry.recipeId))
        const seenRecipeIds = new Set<string>()
        const daySuggestions: PlannerEventSuggestion[] = []

        for (const event of dayEvents) {
          for (const listId of event.listIds) {
            const linkedList = allLists.find((list) => list.id === listId)
            if (!linkedList) {
              continue
            }

            const recipeLinks =
              linkedList.listRecipes && linkedList.listRecipes.length > 0
                ? linkedList.listRecipes
                : (linkedList.linkedRecipeIds ?? []).map((recipeId) => ({ recipeId, servings: null }))

            for (const link of recipeLinks) {
              if (plannedRecipeIds.has(link.recipeId) || seenRecipeIds.has(link.recipeId)) {
                continue
              }

              const recipe = recipeMap.get(link.recipeId)
              if (!recipe) {
                continue
              }

              daySuggestions.push({
                key: `${event.id}-${link.recipeId}`,
                recipe: withRecipeServingsOverride(recipe, link.servings),
              })
              seenRecipeIds.add(link.recipeId)
            }
          }
        }

        acc[day] = daySuggestions
        return acc
      }, {} as Record<DayOfWeek, PlannerEventSuggestion[]>),
    [allLists, currentPlannerWeekDates, eventsByDate, plannerEntriesByDay, recipeMap]
  )

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null
  const selectedDayEvents = selectedDateKey ? eventsByDate[selectedDateKey] ?? [] : []

  async function persistDayEntries(day: DayOfWeek, entries: MealPlanEntry[]) {
    await Promise.all(
      entries.map((entry, index) => {
        const persistedEntry = mealPlanEntries.find((currentEntry) => currentEntry.id === entry.id)
        if (persistedEntry && persistedEntry.dayOfWeek === day && persistedEntry.position === index) {
          return Promise.resolve(entry)
        }

        return onUpdateMealPlanEntry(entry.id, {
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

      await onUnplanMealPlanEntry(entryId)
      return
    }

    let insertionIndex = Math.max(
      0,
      Math.min(targetIndex ?? plannerEntriesByDay[toDay].length, plannerEntriesByDay[toDay].length)
    )

    if (fromDay === "bank") {
      const savedRecipe = mealPlannerRecipes.find((recipe) => recipe.id === recipeId)
      const createdEntry = await onCreateMealPlanEntry({
        recipeId,
        dayOfWeek: toDay,
        position: insertionIndex,
        servings: savedRecipe?.servings,
      })

      const nextTargetEntries = [...plannerEntriesByDay[toDay]]
      nextTargetEntries.splice(insertionIndex, 0, createdEntry)
      await persistDayEntries(toDay, nextTargetEntries)
      return
    }

    if (!entryId) {
      return
    }

    const movingEntry = mealPlanEntries.find((entry) => entry.id === entryId)
    if (!movingEntry) {
      return
    }

    if (fromDay === toDay && targetIndex !== undefined && movingEntry.position < targetIndex) {
      insertionIndex = Math.max(0, insertionIndex - 1)
    }

    const nextSourceEntries = plannerEntriesByDay[fromDay].filter((entry) => entry.id !== entryId)
    const nextTargetEntries = fromDay === toDay ? nextSourceEntries : [...plannerEntriesByDay[toDay]]

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
    if (!pendingRemoval) {
      return
    }

    if (pendingRemoval.source === "saved") {
      await onDeleteSavedRecipe(pendingRemoval.recipeId)
      setPendingRemoval(null)
      return
    }

    if (pendingRemoval.entryId) {
      await onDeleteMealPlanEntry(pendingRemoval.entryId, pendingRemoval.recipeId)
    }
    setPendingRemoval(null)
  }

  function handleSavedTabsPointerDown(event: React.PointerEvent<HTMLDivElement>) {
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

  function handleSavedTabsPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const container = savedTabsScrollRef.current
    const dragState = savedTabsDragStateRef.current

    if (!container || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    container.scrollLeft = dragState.startScrollLeft - deltaX
  }

  function handleSavedTabsPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const container = savedTabsScrollRef.current
    const dragState = savedTabsDragStateRef.current

    if (!container || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    savedTabsDragStateRef.current = null
    container.releasePointerCapture(event.pointerId)
  }

  function openEventDialog(date?: Date) {
    setEventForm({
      name: "",
      description: "",
      icon: eventIconOptions[0].value,
      date: format(date ?? selectedDate ?? new Date(), "yyyy-MM-dd"),
      listIds: [],
    })
    setEventInlineListForm({
      name: "",
      color: inlineListColorOptions[0].name,
    })
    setEventDialogOpen(true)
  }

  function openEventViewer(date: Date) {
    setSelectedDate(date)
    setEventViewerOpen(true)
  }

  function openEventDetail(event: CalendarEvent) {
    setSelectedEvent(event)
    setSelectedEventForm({
      name: event.name,
      description: event.description,
      icon: event.icon,
      date: event.date,
      listIds: event.listIds,
    })
  }

  function handleCalendarDayClick(day: Date, dayEvents: CalendarEvent[]) {
    setSelectedDate(day)

    if (dayEvents.length === 1) {
      openEventDetail(dayEvents[0])
      return
    }

    if (dayEvents.length > 1) {
      openEventViewer(day)
    }
  }

  function toggleSelectedEventList(listId: string, checked: boolean) {
    setSelectedEventForm((current) => ({
      ...current,
      listIds: checked
        ? [...current.listIds, listId]
        : current.listIds.filter((currentListId) => currentListId !== listId),
    }))
  }

  function toggleEventList(listId: string, checked: boolean) {
    setEventForm((current) => ({
      ...current,
      listIds: checked
        ? [...current.listIds, listId]
        : current.listIds.filter((currentListId) => currentListId !== listId),
    }))
  }

  function handleCalendarDayClick(day: Date, dayEvents: CalendarEvent[]) {
    setSelectedDate(day)

    if (dayEvents.length === 1) {
      openEventDetail(dayEvents[0])
      return
    }

    if (dayEvents.length > 1) {
      openEventViewer(day)
    }
  }

  function toggleSelectedEventList(listId: string, checked: boolean) {
    setSelectedEventForm((current) => ({
      ...current,
      listIds: checked
        ? [...current.listIds, listId]
        : current.listIds.filter((currentListId) => currentListId !== listId),
    }))
  }

  function toggleEventList(listId: string, checked: boolean) {
    setEventForm((current) => ({
      ...current,
      listIds: checked
        ? [...current.listIds, listId]
        : current.listIds.filter((currentListId) => currentListId !== listId),
    }))
  }

  async function handleUpdateSelectedEvent() {
    if (!selectedEvent || !selectedEventForm.name.trim()) {
      return
    }

    const updatedEvent = await onUpdateEvent(selectedEvent.id, {
      ...selectedEventForm,
      name: selectedEventForm.name.trim(),
      description: selectedEventForm.description.trim(),
    })
    setSelectedEvent(updatedEvent)
    setSelectedEventForm({
      name: updatedEvent.name,
      description: updatedEvent.description,
      icon: updatedEvent.icon,
      date: updatedEvent.date,
      listIds: updatedEvent.listIds,
    })
    setSelectedEvent(null)
  }

  async function handleCreateEvent() {
    if (!eventForm.name.trim()) {
      return
    }

    await onCreateEvent({
      ...eventForm,
      name: eventForm.name.trim(),
      description: eventForm.description.trim(),
    })
    setEventDialogOpen(false)
  }

  async function handleCreateInlineListForEvent() {
    if (!eventInlineListForm.name.trim()) {
      return
    }

    const createdList = await onCreateListForEvent({
      name: eventInlineListForm.name.trim(),
      color: eventInlineListForm.color,
      date: eventForm.date || null,
    })

    setEventForm((current) => ({
      ...current,
      listIds: current.listIds.includes(createdList.id) ? current.listIds : [...current.listIds, createdList.id],
    }))
    setEventInlineListForm({
      name: "",
      color: inlineListColorOptions[0].name,
    })
  }

  function handlePlannerDayDrop(day: DayOfWeek, event: React.DragEvent<HTMLDivElement>, targetIndex?: number) {
    event.preventDefault()
    const recipeId = event.dataTransfer.getData("text/recipe-id")
    const fromDay = event.dataTransfer.getData("text/from-day")
    const entryId = event.dataTransfer.getData("text/entry-id") || undefined
    if (!recipeId || !fromDay) {
      return
    }
    void moveRecipe(recipeId, fromDay as DayOfWeek | "bank", day, targetIndex, entryId)
    setDraggedRecipeId(null)
  }

  function handleSavedBankDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const recipeId = event.dataTransfer.getData("text/recipe-id")
    const fromDay = event.dataTransfer.getData("text/from-day")
    const entryId = event.dataTransfer.getData("text/entry-id") || undefined
    if (!recipeId || !fromDay || fromDay === "bank") {
      return
    }
    void moveRecipe(recipeId, fromDay as DayOfWeek, "bank", undefined, entryId)
    setDraggedRecipeId(null)
  }

  function renderRecipeCard(
    recipe: Recipe,
    options?: {
      day?: DayOfWeek
      entry?: MealPlanEntry
      index?: number
      draggable?: boolean
      fromDay?: DayOfWeek | "bank"
      onDropAtCard?: (event: React.DragEvent<HTMLDivElement>) => void
      onRemove?: () => void
    }
  ) {
    return (
      <ListsTabRecipeCard
        draggedRecipeId={draggedRecipeId}
        onOpenRecipe={onOpenRecipe}
        onPendingRemoval={(recipeId, recipeName, entryId) =>
          setPendingRemoval({
            source: entryId ? "planner" : "saved",
            recipeId,
            recipeName,
            entryId,
          })
        }
        onDragStateChange={setDraggedRecipeId}
        recipe={recipe}
        options={options}
      />
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(420px,1.1fr)]">
        <MyListsSection
          lists={sortedVisibleLists}
          pinnedListIds={pinnedListIds}
          searchQuery={searchQuery}
          onCreateList={onCreateList}
          onDeleteList={onDeleteList}
          onEditList={onEditList}
          onOpenList={onOpenList}
          onSearchQueryChange={onSearchQueryChange}
          onTogglePin={(listId) =>
            setPinnedListIds((currentPinned) =>
              currentPinned.includes(listId)
                ? currentPinned.filter((id) => id !== listId)
                : [listId, ...currentPinned]
            )
          }
        />

        <CalendarSection
          calendarDays={calendarDays}
          calendarMonth={calendarMonth}
          eventsByDate={eventsByDate}
          selectedDate={selectedDate}
          onCalendarMonthChange={setCalendarMonth}
          onCalendarDayClick={handleCalendarDayClick}
          onCreateEvent={() => openEventDialog(selectedDate)}
        />
      </div>

      <SavedRecipesSection
        activeTabId={activeSavedTabId}
        draggedRecipeId={draggedRecipeId}
        savedRecipesExpanded={savedRecipesExpanded}
        savedRecipeTabs={savedRecipeTabs}
        savedTabsScrollRef={savedTabsScrollRef}
        onDropToBank={handleSavedBankDrop}
        onPointerCancel={handleSavedTabsPointerEnd}
        onPointerDown={handleSavedTabsPointerDown}
        onPointerMove={handleSavedTabsPointerMove}
        onPointerUp={handleSavedTabsPointerEnd}
        onRemoveSavedRecipe={(recipe) =>
          setPendingRemoval({
            source: "saved",
            recipeId: recipe.id,
            recipeName: recipe.name,
          })
        }
        onSavedTabChange={setSelectedSavedTab}
        onSavedRecipesExpandedChange={setSavedRecipesExpanded}
        renderRecipeCard={renderRecipeCard}
      />

      <WeeklyMealPlannerSection
        currentPlannerWeekDates={currentPlannerWeekDates}
        plannerEntriesByDay={plannerEntriesByDay}
        plannerEventSuggestionsByDay={plannerEventSuggestionsByDay}
        recipeMap={recipeMap}
        onDayDrop={handlePlannerDayDrop}
        renderRecipeCard={renderRecipeCard}
      />

      <EventDialogs
        allLists={allLists}
        eventDialogOpen={eventDialogOpen}
        eventForm={eventForm}
        eventInlineListForm={eventInlineListForm}
        eventViewerOpen={eventViewerOpen}
        pendingRemoval={pendingRemoval}
        selectedDate={selectedDate}
        selectedDayEvents={selectedDayEvents}
        selectedEvent={selectedEvent}
        selectedEventForm={selectedEventForm}
        onCloseSelectedEvent={() => setSelectedEvent(null)}
        onConfirmRemoval={confirmRemoval}
        onCreateEvent={handleCreateEvent}
        onCreateInlineListForEvent={handleCreateInlineListForEvent}
        onDeleteEvent={onDeleteEvent}
        onEventDialogOpenChange={setEventDialogOpen}
        onEventFormChange={(updater) => setEventForm(updater)}
        onEventInlineListFormChange={(updater) => setEventInlineListForm(updater)}
        onEventViewerOpenChange={setEventViewerOpen}
        onOpenEventDetail={openEventDetail}
        onOpenList={onOpenList}
        onPendingRemovalChange={setPendingRemoval}
        onSelectedEventFormChange={(updater) => setSelectedEventForm(updater)}
        onToggleEventList={toggleEventList}
        onToggleSelectedEventList={toggleSelectedEventList}
        onUpdateSelectedEvent={handleUpdateSelectedEvent}
      />
    </div>
  )
}

export const ListsTab = memo(ListsTabComponent)
