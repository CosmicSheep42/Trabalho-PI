"use client"

import Image from "next/image"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import {
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
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Pin,
  Plus,
  Search,
  ShoppingCart,
  Soup,
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ShopListBanner, type ShopList } from "@/components/shoplist-banner"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import { weekDays } from "@/features/meal-planner/types"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { withRecipeServingsOverride } from "@/features/recipes/types"

interface ListsTabProps {
  lists: ShopList[]
  recipes: Recipe[]
  savedRecipes: Recipe[]
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
}

interface PendingRemoval {
  source: "saved" | "planner"
  recipeId: string
  recipeName: string
  entryId?: string
}

const calendarWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function ListsTabComponent({
  lists,
  recipes,
  savedRecipes,
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
}: ListsTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [pinnedListIds, setPinnedListIds] = useState<string[]>([])
  const [draggedRecipeId, setDraggedRecipeId] = useState<string | null>(null)
  const [savedRecipesExpanded, setSavedRecipesExpanded] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)
  const autoScrollDirectionRef = useRef<1 | -1 | 0>(0)
  const autoScrollFrameRef = useRef<number | null>(null)
  const mealPlannerRecipeIds = useMemo(
    () => new Set(mealPlanEntries.map((entry) => entry.recipeId)),
    [mealPlanEntries]
  )
  const mealPlannerRecipes = useMemo(
    () => savedRecipes.filter((recipe) => !mealPlannerRecipeIds.has(recipe.id)),
    [mealPlannerRecipeIds, savedRecipes]
  )
  const recipeMap = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes]
  )

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

  const sortedLists = useMemo(() => {
    const pinned = lists.filter((list) => pinnedListIds.includes(list.id))
    const unpinned = lists.filter((list) => !pinnedListIds.includes(list.id))
    return [...pinned, ...unpinned]
  }, [lists, pinnedListIds])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = endOfWeek(monthEnd)

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

  const visibleSavedRecipes = savedRecipesExpanded
    ? mealPlannerRecipes
    : mealPlannerRecipes.slice(0, 4)

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
                  <Plus className="mr-2 h-4 w-4" />
                  New List
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[32rem]">
              {sortedLists.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                  {sortedLists.map((list) => (
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
          </CardHeader>
          <CardContent className="h-[32rem] p-4">
            <div className="flex h-full flex-col rounded-xl border bg-background shadow-sm">
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

              <div className="grid flex-1 grid-cols-7 gap-2 p-4">
                {calendarDays.map((day) => {
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                  const inCurrentMonth = isSameMonth(day, calendarMonth)

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-0 rounded-xl border text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : inCurrentMonth
                            ? "border-border bg-card hover:bg-muted/60"
                            : "border-border/60 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="flex h-full min-h-[3.25rem] items-start justify-end p-2">
                        <span className="font-medium">{format(day, "d")}</span>
                      </div>
                    </button>
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
            Saved Recipes
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-hidden p-6">
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
                  <p className="text-sm font-semibold">Saved Recipes</p>
                  <p className="text-sm text-muted-foreground">Drag any recipe into a day.</p>
                </div>
              {mealPlannerRecipes.length > 4 && (
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
                {visibleSavedRecipes.map((recipe) => (
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
            {mealPlannerRecipes.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Save recipes from the recipe dialog to build your planner bank.
              </div>
            )}
          </div>
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
                    </div>

                    <div className="min-h-24 rounded-2xl border border-dashed bg-muted/15 p-3">
                      {plannedEntries.length > 0 ? (
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
