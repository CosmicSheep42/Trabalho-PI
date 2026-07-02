"use client"

import Image from "next/image"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import {
  CalendarPlus,
  CalendarDays,
  CakeSlice,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  GripVertical,
  Heart,
  PartyPopper,
  Pin,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Soup,
  Trash2,
  UtensilsCrossed,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  CardAction,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ShopListBanner, type ShopList } from "@/components/shoplist-banner"
import type { CalendarEvent } from "@/features/events/types"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import { weekDays } from "@/features/meal-planner/types"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"

interface ListsTabProps {
  lists: ShopList[]
  allLists: ShopList[]
  recipes: Recipe[]
  savedRecipes: Recipe[]
  events: CalendarEvent[]
  mealPlanEntries: MealPlanEntry[]
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onCreateList: () => void
  onOpenList: (list: ShopList) => void
  onOpenRecipe: (recipe: Recipe, context?: RecipeServingsContext) => void
  onEditList: (list: ShopList) => void
  onDeleteList: (listId: string) => void
  onCreateMealPlanEntry: (payload: {
    recipeId: string
    listId?: string | null
    dayOfWeek: DayOfWeek
    position: number
    servings?: number | null
  }) => Promise<MealPlanEntry>
  onUpdateMealPlanEntry: (
    entryId: string,
    payload: {
      listId?: string | null
      dayOfWeek?: DayOfWeek
      position?: number
      servings?: number | null
    }
  ) => Promise<MealPlanEntry>
  onUnplanMealPlanEntry: (entryId: string) => Promise<void>
  onDeleteMealPlanEntry: (entryId: string, recipeId: string) => Promise<void>
  onDeleteSavedRecipe: (recipeId: string) => Promise<void>
  onCreateEvent: (payload: {
    name: string
    description: string
    icon: string
    date: string
    listIds: string[]
  }) => Promise<CalendarEvent>
  onUpdateEvent: (
    eventId: string,
    payload: {
      name: string
      description: string
      icon: string
      date: string
      listIds: string[]
    }
  ) => Promise<CalendarEvent>
  onDeleteEvent: (eventId: string) => Promise<void>
  onCreateListForEvent: (payload: {
    name: string
    color: string
    date?: string | null
  }) => Promise<ShopList>
}

interface PendingRemoval {
  source: "saved" | "planner"
  recipeId: string
  recipeName: string
  entryId?: string
}

interface SavedRecipeTab {
  id: string
  label: string
  recipes: Recipe[]
  emptyMessage: string
}

interface EventFormState {
  name: string
  description: string
  icon: string
  date: string
  listIds: string[]
}

interface EventInlineListFormState {
  name: string
  color: string
}

interface PlannerEventSuggestion {
  key: string
  recipe: Recipe
}

const calendarWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const eventIconOptions = [
  { value: "party", label: "Party", icon: PartyPopper },
  { value: "dinner", label: "Dinner", icon: UtensilsCrossed },
  { value: "cake", label: "Cake", icon: CakeSlice },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
] as const

const inlineListColorOptions = [
  { name: "green", className: "bg-green-600" },
  { name: "blue", className: "bg-blue-600" },
  { name: "purple", className: "bg-purple-600" },
  { name: "orange", className: "bg-orange-600" },
  { name: "pink", className: "bg-pink-600" },
  { name: "cyan", className: "bg-cyan-600" },
  { name: "amber", className: "bg-amber-600" },
  { name: "rose", className: "bg-rose-600" },
] as const

function getEventIcon(icon: string) {
  return eventIconOptions.find((option) => option.value === icon)?.icon ?? CalendarDays
}

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
  const recipeMap = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes]
  )
  const savedRecipeTabs = useMemo<SavedRecipeTab[]>(() => {
    const savedRecipeMap = new Map(mealPlannerRecipes.map((recipe) => [recipe.id, recipe]))
    const listRecipeIds = new Set<string>()

    const listTabs = sortedAllLists.map((list) => {
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
    }).filter((tab) => tab.recipes.length > 0)

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
        window.scrollBy({
          top: scrollStep * autoScrollDirectionRef.current,
          behavior: "auto",
        })
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

    return eachDayOfInterval({
      start: gridStart,
      end: gridEnd,
    })
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
        weekDays.map((day, index) => [
          day,
          addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index),
        ])
      ) as Record<DayOfWeek, Date>,
    []
  )
  const listsByDate = useMemo(() => {
    return allLists.reduce<Record<string, ShopList[]>>((acc, list) => {
      if (!list.date) {
        return acc
      }

      acc[list.date] = [...(acc[list.date] ?? []), list]
      return acc
    }, {})
  }, [allLists])
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event]
      return acc
    }, {})
  }, [events])
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
                : (linkedList.linkedRecipeIds ?? []).map((recipeId) => ({
                    recipeId,
                    servings: null,
                  }))

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
        if (
          persistedEntry &&
          persistedEntry.dayOfWeek === day &&
          persistedEntry.position === index
        ) {
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
    const nextTargetEntries =
      fromDay === toDay
        ? nextSourceEntries
        : [...plannerEntriesByDay[toDay]]

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
      listIds: current.listIds.includes(createdList.id)
        ? current.listIds
        : [...current.listIds, createdList.id],
    }))
    setEventInlineListForm({
      name: "",
      color: inlineListColorOptions[0].name,
    })
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
    const { day, entry, draggable = false, fromDay = "bank", onDropAtCard, onRemove } = options ?? {}
    const mealTypeTag = recipe.tags.find((tag) => tag.category === "meal_type")
    const effectiveServings = entry?.servings ?? recipe.servings
    const recipeForDialog = withRecipeServingsOverride(recipe, effectiveServings)
    const recipeContext: RecipeServingsContext | undefined = entry
      ? { type: "meal-planner", entryId: entry.id }
      : fromDay === "bank"
        ? { type: "saved" }
        : undefined

    return (
      <div
        key={`${day ?? "bank"}-${recipe.id}`}
        draggable={draggable}
        role="button"
        tabIndex={0}
        onClick={() => onOpenRecipe(recipeForDialog, recipeContext)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onOpenRecipe(recipeForDialog, recipeContext)
          }
        }}
        onDragStart={(event) => {
          if (!draggable) {
            return
          }
          event.dataTransfer.setData("text/recipe-id", recipe.id)
          event.dataTransfer.setData("text/from-day", fromDay)
          if (entry) {
            event.dataTransfer.setData("text/entry-id", entry.id)
          }
          setDraggedRecipeId(recipe.id)
        }}
        onDragEnd={() => setDraggedRecipeId(null)}
        onDragOver={(event) => {
          if (!onDropAtCard) {
            return
          }
          event.preventDefault()
        }}
        onDrop={onDropAtCard}
        className={`cursor-pointer overflow-hidden rounded-2xl border bg-background shadow-sm transition ${
          draggedRecipeId === recipe.id ? "opacity-50" : "hover:border-primary/40"
        } ${draggable ? "cursor-grab" : ""}`}
      >
        <div className="relative h-32 overflow-hidden rounded-t-2xl">
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            draggable={false}
            className="object-cover"
          />
          {entry && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-background/85 backdrop-blur-sm"
              onClick={(event) => {
                event.stopPropagation()
                setPendingRemoval({
                  source: "planner",
                  recipeId: recipe.id,
                  recipeName: recipe.name,
                  entryId: entry.id,
                })
              }}
            >
              <span className="text-base leading-none">×</span>
            </Button>
          )}
          {!entry && onRemove ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-background/85 backdrop-blur-sm"
              onClick={(event) => {
                event.stopPropagation()
                onRemove()
              }}
            >
              <span className="text-base leading-none">×</span>
            </Button>
          ) : null}
        </div>
        <div className="flex items-start gap-3 p-4">
          <div className="rounded-full bg-muted p-2 text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{recipe.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {recipe.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{recipe.prep_time_minutes} min</Badge>
              {effectiveServings ? (
                <Badge variant="secondary">{effectiveServings} servings</Badge>
              ) : null}
              {mealTypeTag ? (
                <Badge variant="outline">{mealTypeTag.name}</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(420px,1.1fr)]">
        <Card className="overflow-hidden py-0">
          <CardHeader className="min-h-16 border-b py-3">
            <CardTitle className="flex items-center gap-2 text-xl leading-none">
              <Pin className="h-6 w-6 shrink-0 text-primary" />
              My Lists
            </CardTitle>
            <CardAction className="static col-auto row-auto self-center justify-self-stretch sm:justify-self-end">
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="relative min-w-0 flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search lists..."
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={onCreateList} className="shrink-0">
                  <Plus className="mr-1 h-4" />
                
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[32rem]">
              {sortedVisibleLists.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                  {sortedVisibleLists.map((list) => (
                    <ShopListBanner
                      key={list.id}
                      list={list}
                      pinned={pinnedListIds.includes(list.id)}
                      onClick={() => onOpenList(list)}
                      onTogglePin={() =>
                        setPinnedListIds((currentPinned) =>
                          currentPinned.includes(list.id)
                            ? currentPinned.filter((id) => id !== list.id)
                            : [list.id, ...currentPinned]
                        )
                      }
                      onEdit={() => onEditList(list)}
                      onDelete={() => onDeleteList(list.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-[20rem] flex-col items-center justify-center px-6 text-center">
                  <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 text-lg font-medium">No lists yet</h3>
                  <p className="mb-4 text-muted-foreground">
                    Create a shopping list, or start planning meals directly below.
                  </p>
                  <Button onClick={onCreateList}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create List
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="overflow-hidden py-0">
          <CardHeader className="min-h-16 border-b py-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-6 w-6 shrink-0 text-primary" />
              Calendar
            </CardTitle>
            <CardAction className="static col-auto row-auto self-center justify-self-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => openEventDialog(selectedDate)}
              >
                <CalendarPlus className="h-4 w-4" />
                New Event
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="h-[32rem] p-4">
            <div className="flex h-full min-h-0 flex-col rounded-xl border bg-background shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCalendarMonth((current) => subMonths(current, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold">
                  {format(calendarMonth, "MMMM yyyy")}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCalendarMonth((current) => addMonths(current, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-2 px-4 pt-4 text-center text-xs font-medium text-muted-foreground">
                {calendarWeekdays.map((weekday) => (
                  <div key={weekday}>{weekday}</div>
                ))}
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-7 gap-2 p-4">
                {calendarDays.map((day) => {
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                  const inCurrentMonth = isSameMonth(day, calendarMonth)
                  const dayKey = format(day, "yyyy-MM-dd")
                  const dayEvents = eventsByDate[dayKey] ?? []
                  const visibleDayEvents = dayEvents.slice(0, 2)

                  return (
                    <div
                      key={day.toISOString()}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCalendarDayClick(day, dayEvents)}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                          keyboardEvent.preventDefault()
                          handleCalendarDayClick(day, dayEvents)
                        }
                      }}
                      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : inCurrentMonth
                            ? "border-border bg-card hover:bg-muted/60"
                            : "border-border/60 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="flex w-full items-start justify-end px-2 pt-2 text-right">
                        <span className="font-medium">{format(day, "d")}</span>
                      </div>
                      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-2">
                        <div className="flex h-6 items-center justify-center gap-1 overflow-hidden">
                        {visibleDayEvents.map((event) => {
                          const EventIcon = getEventIcon(event.icon)

                          return (
                            <span
                              key={event.id}
                              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors ${
                                isSelected
                                  ? "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground"
                                  : "border-border bg-muted text-foreground hover:bg-muted/80"
                              }`}
                              aria-hidden="true"
                            >
                              <EventIcon className="h-3.5 w-3.5" />
                            </span>
                          )
                        })}
                        {dayEvents.length > visibleDayEvents.length ? (
                          <span
                            className={`inline-flex h-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-medium ${
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            }`}
                          >
                            +{dayEvents.length - visibleDayEvents.length}
                          </span>
                        ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden py-0">
        <CardHeader className="min-h-16 border-b py-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Soup className="h-6 w-6 shrink-0 text-primary" />
            Your Recipes
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-hidden p-6">
          <Tabs
            value={activeSavedTabId}
            onValueChange={setSelectedSavedTab}
            className="gap-4"
          >
            {savedRecipeTabs.length > 4 ? (
              <p className="text-xs text-muted-foreground">
                Drag and pull to see more tabs.
              </p>
            ) : null}
            <div
              ref={savedTabsScrollRef}
              className="cursor-grab overflow-x-auto pb-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onPointerDown={handleSavedTabsPointerDown}
              onPointerMove={handleSavedTabsPointerMove}
              onPointerUp={handleSavedTabsPointerEnd}
              onPointerCancel={handleSavedTabsPointerEnd}
            >
              <TabsList className="inline-flex h-auto min-w-max justify-start rounded-2xl bg-muted/40 p-1">
                {savedRecipeTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="min-w-fit px-4 py-2"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {savedRecipeTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <div
                  className={`rounded-2xl border bg-muted/10 p-4 transition-colors ${
                    draggedRecipeId ? "border-primary/40 bg-primary/5" : ""
                  }`}
                  onDragOver={(event) => {
                    if (!draggedRecipeId) {
                      return
                    }
                    event.preventDefault()
                    event.dataTransfer.dropEffect = "move"
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const recipeId = event.dataTransfer.getData("text/recipe-id")
                    const fromDay = event.dataTransfer.getData("text/from-day")
                    const entryId = event.dataTransfer.getData("text/entry-id") || undefined
                    if (!recipeId || !fromDay || fromDay === "bank") {
                      return
                    }
                    void moveRecipe(recipeId, fromDay as DayOfWeek, "bank", undefined, entryId)
                    setDraggedRecipeId(null)
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{tab.label}</p>
                      <p className="text-sm text-muted-foreground">Drag any recipe into a day.</p>
                    </div>
                    {tab.recipes.length > 4 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSavedRecipesExpanded((current) => !current)}
                        className="shrink-0"
                      >
                        {savedRecipesExpanded ? "Retract" : "Expand"}
                        <ChevronDown
                          className={`ml-2 h-4 w-4 transition-transform ${
                            savedRecipesExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                  <div
                    className={`overflow-hidden transition-[max-height] duration-300 ${
                      savedRecipesExpanded ? "max-h-[80rem]" : "max-h-[20rem]"
                    }`}
                  >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {(savedRecipesExpanded ? tab.recipes : tab.recipes.slice(0, 4)).map((recipe) => (
                        <div key={`saved-${recipe.id}`}>
                          {renderRecipeCard(recipe, {
                            draggable: true,
                            fromDay: "bank",
                            onRemove: () =>
                              setPendingRemoval({
                                source: "saved",
                                recipeId: recipe.id,
                                recipeName: recipe.name,
                              }),
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  {tab.recipes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      {tab.emptyMessage}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        <CardHeader className="min-h-16 border-b py-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Soup className="h-6 w-6 shrink-0 text-primary" />
            Weekly Meal Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-hidden p-6">
          <div className="space-y-3">
            {weekDays.map((day) => {
              const plannedEntries = plannerEntriesByDay[day]
              const eventSuggestions = plannerEventSuggestionsByDay[day]
              const plannerDate = currentPlannerWeekDates[day]

              return (
                <div
                  key={day}
                  className="rounded-2xl border bg-gradient-to-r from-background via-background to-muted/20 p-4"
                  onDragOver={(event) => {
                    event.preventDefault()
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const recipeId = event.dataTransfer.getData("text/recipe-id")
                    const fromDay = event.dataTransfer.getData("text/from-day")
                    const entryId = event.dataTransfer.getData("text/entry-id") || undefined
                    if (!recipeId || !fromDay) {
                      return
                    }
                    void moveRecipe(recipeId, fromDay as DayOfWeek | "bank", day, undefined, entryId)
                    setDraggedRecipeId(null)
                  }}
                >
                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
                    <div className="space-y-2">
                      <p className="text-base font-semibold">{day}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(plannerDate, "MMM d")}
                      </p>
                    </div>

                    <div className="min-h-24 rounded-2xl border border-dashed bg-muted/15 p-3">
                      {plannedEntries.length > 0 || eventSuggestions.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {plannedEntries.map((entry, index) => {
                            const recipe = recipeMap.get(entry.recipeId)
                            if (!recipe) {
                              return null
                            }

                            return (
                              <div key={entry.id} className="w-full sm:min-w-[320px] sm:max-w-[360px]">
                                {renderRecipeCard(recipe, {
                                  day,
                                  entry,
                                  index,
                                  draggable: true,
                                  fromDay: day,
                                  onDropAtCard: (event) => {
                                    event.preventDefault()
                                    const incomingRecipeId = event.dataTransfer.getData("text/recipe-id")
                                    const originDay = event.dataTransfer.getData("text/from-day")
                                    const incomingEntryId = event.dataTransfer.getData("text/entry-id") || undefined
                                    if (!incomingRecipeId || !originDay) {
                                      return
                                    }
                                    void moveRecipe(
                                      incomingRecipeId,
                                      originDay as DayOfWeek | "bank",
                                      day,
                                      index,
                                      incomingEntryId
                                    )
                                    setDraggedRecipeId(null)
                                  },
                                })}
                              </div>
                            )
                          })}
                          {eventSuggestions.map((suggestion) => (
                            <div key={suggestion.key} className="w-full sm:min-w-[320px] sm:max-w-[360px]">
                              <div className="mb-2 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                                <PartyPopper className="h-3.5 w-3.5" />
                                <span>Suggested by calendar event</span>
                              </div>
                              {renderRecipeCard(suggestion.recipe)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-16 items-center justify-center rounded-xl bg-background/60 text-sm text-muted-foreground">
                          Drag a recipe card here
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

          <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Name</Label>
              <Input
                id="event-name"
                value={eventForm.name}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Birthday dinner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Short notes about the event"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={eventForm.icon}
                  onValueChange={(value) =>
                    setEventForm((current) => ({ ...current, icon: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventIconOptions.map((option) => {
                      const Icon = option.icon

                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventForm.date}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Associated Lists</Label>
                <span className="text-xs text-muted-foreground">Optional</span>
              </div>
              <ScrollArea className="max-h-48 rounded-xl border">
                <div className="space-y-2 p-3">
                  {allLists.length > 0 ? (
                    allLists.map((list) => (
                      <label
                        key={list.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{list.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <Checkbox
                          checked={eventForm.listIds.includes(list.id)}
                          onCheckedChange={(checked) => toggleEventList(list.id, checked === true)}
                        />
                      </label>
                    ))
                  ) : (
                    <div className="px-1 py-2 text-sm text-muted-foreground">
                      Create a list before associating it with an event.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Create and attach a list</p>
                </div>
                <Badge variant="secondary">Quick add</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <Input
                  value={eventInlineListForm.name}
                  onChange={(event) =>
                    setEventInlineListForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="List name"
                />
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-2">
                    {inlineListColorOptions.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() =>
                          setEventInlineListForm((current) => ({ ...current, color: color.name }))
                        }
                        className={`h-7 w-7 rounded-full transition-all ${color.className} ${
                          eventInlineListForm.color === color.name
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "hover:scale-110"
                        }`}
                        aria-label={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void handleCreateInlineListForEvent()}
                disabled={!eventInlineListForm.name.trim()}
              >
                Create
              </Button>
            </div>

            <Button
              onClick={() => void handleCreateEvent()}
              className="w-full"
              disabled={!eventForm.name.trim()}
            >
              Save Event
            </Button>
          </div>
          </DialogContent>
      </Dialog>

      <Dialog open={eventViewerOpen} onOpenChange={setEventViewerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Events"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event) => {
                const EventIcon = getEventIcon(event.icon)

                return (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openEventDetail(event)}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                        keyboardEvent.preventDefault()
                        openEventDetail(event)
                      }
                    }}
                    className="w-full rounded-xl border bg-muted/10 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="rounded-full bg-muted p-2 text-muted-foreground">
                          <EventIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          {event.description ? (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          ) : null}
                          <div className={`${event.description ? "mt-3" : ""} flex flex-wrap gap-2`}>
                            {event.listIds.length > 0 ? (
                              event.listIds
                                .map((listId) => allLists.find((list) => list.id === listId))
                                .filter((list): list is ShopList => list !== undefined)
                                .map((list) => (
                                  <button
                                    key={list.id}
                                    type="button"
                                    onClick={(clickEvent) => {
                                      clickEvent.stopPropagation()
                                      onOpenList(list)
                                    }}
                                    className="rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                  >
                                    {list.name}
                                  </button>
                                ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No lists attached</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation()
                          void onDeleteEvent(event.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                No events for this day.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>

          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/10 p-3">
                <div className="rounded-full bg-muted p-2 text-muted-foreground">
                  {(() => {
                    const EventIcon = getEventIcon(selectedEventForm.icon)
                    return <EventIcon className="h-5 w-5" />
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{selectedEventForm.name || "Untitled event"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedEventForm.date
                      ? format(new Date(selectedEventForm.date), "EEEE, MMM d, yyyy")
                      : "No date selected"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selected-event-name">Name</Label>
                <Input
                  id="selected-event-name"
                  value={selectedEventForm.name}
                  onChange={(event) =>
                    setSelectedEventForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selected-event-description">Description</Label>
                <Textarea
                  id="selected-event-description"
                  value={selectedEventForm.description}
                  onChange={(event) =>
                    setSelectedEventForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Short notes about the event"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select
                    value={selectedEventForm.icon}
                    onValueChange={(value) =>
                      setSelectedEventForm((current) => ({ ...current, icon: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventIconOptions.map((option) => {
                        const Icon = option.icon

                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selected-event-date">Date</Label>
                  <Input
                    id="selected-event-date"
                    type="date"
                    value={selectedEventForm.date}
                    onChange={(event) =>
                      setSelectedEventForm((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Linked Lists</Label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <ScrollArea className="max-h-48 rounded-xl border">
                  <div className="space-y-2 p-3">
                    {allLists.length > 0 ? (
                      allLists.map((list) => (
                        <label
                          key={list.id}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/30"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{list.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                            </p>
                          </div>
                          <Checkbox
                            checked={selectedEventForm.listIds.includes(list.id)}
                            onCheckedChange={(checked) =>
                              toggleSelectedEventList(list.id, checked === true)
                            }
                          />
                        </label>
                      ))
                    ) : (
                      <div className="px-1 py-2 text-sm text-muted-foreground">
                        No lists available.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    void onDeleteEvent(selectedEvent.id)
                    setSelectedEvent(null)
                    setEventViewerOpen(false)
                  }}
                >
                  Delete event
                </Button>
                <Button
                  className="hover:bg-green-700"
                  onClick={() => void handleUpdateSelectedEvent()}
                  disabled={!selectedEventForm.name.trim()}
                >
                  Save changes
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => {
        if (!open) {
          setPendingRemoval(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval
                ? `Removing "${pendingRemoval.recipeName}" will also remove it from linked lists. Please confirm to continue.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void confirmRemoval()
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export const ListsTab = memo(ListsTabComponent)
