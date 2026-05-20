"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
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
import type { Recipe } from "@/features/recipes/types"

interface ListsTabProps {
  lists: ShopList[]
  recipes: Recipe[]
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onCreateList: () => void
  onOpenList: (list: ShopList) => void
  onOpenRecipe: (recipe: Recipe) => void
  onEditList: (list: ShopList) => void
  onDeleteList: (listId: string) => void
}

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

const calendarWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function ListsTab({
  lists,
  recipes,
  searchQuery,
  onSearchQueryChange,
  onCreateList,
  onOpenList,
  onOpenRecipe,
  onEditList,
  onDeleteList,
}: ListsTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [pinnedListIds, setPinnedListIds] = useState<string[]>([])
  const [draggedRecipeId, setDraggedRecipeId] = useState<string | null>(null)
  const [savedRecipesExpanded, setSavedRecipesExpanded] = useState(false)
  const autoScrollDirectionRef = useRef<1 | -1 | 0>(0)
  const autoScrollFrameRef = useRef<number | null>(null)

  const mealPlannerRecipes = useMemo(() => {
    const linkedRecipeIds = Array.from(
      new Set(lists.flatMap((list) => list.linkedRecipeIds ?? []))
    )

    const linkedRecipes = linkedRecipeIds
      .map((recipeId) => recipes.find((recipe) => recipe.id === recipeId))
      .filter((recipe): recipe is Recipe => Boolean(recipe))

    return linkedRecipes.length > 0 ? linkedRecipes : recipes
  }, [lists, recipes])

  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, string[]>>({})

  useEffect(() => {
    setWeeklyPlan((currentPlan) => {
      const availableIds = new Set(mealPlannerRecipes.map((recipe) => recipe.id))
      const nextPlan = { ...currentPlan } as Record<string, string[]>
      const usedRecipeIds = new Set<string>()

      weekDays.forEach((day) => {
        const existingDayPlan = (nextPlan[day] ?? []).filter((recipeId) => availableIds.has(recipeId))
        if (existingDayPlan.length > 0) {
          nextPlan[day] = existingDayPlan
          existingDayPlan.forEach((recipeId) => usedRecipeIds.add(recipeId))
          return
        }
        nextPlan[day] = []
      })

      const remainingRecipeIds = mealPlannerRecipes
        .map((recipe) => recipe.id)
        .filter((recipeId) => !usedRecipeIds.has(recipeId))

      remainingRecipeIds.forEach((recipeId, index) => {
        const targetDay = weekDays[index % weekDays.length]
        nextPlan[targetDay] = [...(nextPlan[targetDay] ?? []), recipeId]
      })

      return nextPlan
    })
  }, [mealPlannerRecipes])

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

  function moveRecipe(
    recipeId: string,
    fromDay: string,
    toDay: string,
    targetIndex?: number
  ) {
    setWeeklyPlan((currentPlan) => {
      const nextPlan = Object.fromEntries(
        weekDays.map((day) => [day, [...(currentPlan[day] ?? [])]])
      ) as Record<string, string[]>

      weekDays.forEach((day) => {
        nextPlan[day] = nextPlan[day].filter((id) => id !== recipeId)
      })

      const sourceRecipes = fromDay === "bank" ? [] : nextPlan[fromDay] ?? []
      const targetRecipes =
        fromDay === toDay ? sourceRecipes : [...(nextPlan[toDay] ?? [])]
      const insertionIndex =
        targetIndex === undefined ? targetRecipes.length : Math.max(0, Math.min(targetIndex, targetRecipes.length))

      targetRecipes.splice(insertionIndex, 0, recipeId)

      const result = {
        ...nextPlan,
        [fromDay]: fromDay === toDay ? targetRecipes : sourceRecipes,
        [toDay]: targetRecipes,
      }

      if (fromDay === "bank") {
        delete result.bank
      }

      return result
    })
  }

  function renderRecipeCard(
    recipe: Recipe,
    options?: {
      day?: string
      index?: number
      draggable?: boolean
      fromDay?: string
      onDropAtCard?: (event: React.DragEvent<HTMLDivElement>) => void
    }
  ) {
    const { day, draggable = false, fromDay = "bank", onDropAtCard } = options ?? {}

    return (
      <div
        key={`${day ?? "bank"}-${recipe.id}`}
        draggable={draggable}
        role="button"
        tabIndex={0}
        onClick={() => onOpenRecipe(recipe)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onOpenRecipe(recipe)
          }
        }}
        onDragStart={(event) => {
          if (!draggable) {
            return
          }
          event.dataTransfer.setData("text/recipe-id", recipe.id)
          event.dataTransfer.setData("text/from-day", fromDay)
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
            className="object-cover"
          />
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
              {recipe.servings ? (
                <Badge variant="secondary">{recipe.servings} servings</Badge>
              ) : null}
              {recipe.tags[0] ? (
                <Badge variant="outline">{recipe.tags[0].name}</Badge>
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

  if (lists.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No lists yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first shopping list to get started
        </p>
        <Button onClick={onCreateList}>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
        <CardContent className="p-6">
          <div className="rounded-2xl border bg-muted/10 p-4">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Saved Recipes From Lists</p>
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
                    })}
                  </div>
                ))}
              </div>
            </div>
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
        <CardContent className="p-6">
          <div className="space-y-3">
            {weekDays.map((day) => {
              const plannedRecipeIds = weeklyPlan[day] ?? []

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
                    if (!recipeId || !fromDay) {
                      return
                    }
                    moveRecipe(recipeId, fromDay, day)
                    setDraggedRecipeId(null)
                  }}
                >
                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
                    <div className="space-y-2">
                      <p className="text-base font-semibold">{day}</p>
                    </div>

                    <div className="min-h-24 rounded-2xl border border-dashed bg-muted/15 p-3">
                      {plannedRecipeIds.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {plannedRecipeIds.map((recipeId, index) => {
                            const recipe = mealPlannerRecipes.find((item) => item.id === recipeId)
                            if (!recipe) {
                              return null
                            }

                            return (
                              <div key={`${day}-${recipe.id}`} className="min-w-[290px] max-w-[340px]">
                                {renderRecipeCard(recipe, {
                                  day,
                                  index,
                                  draggable: true,
                                  fromDay: day,
                                  onDropAtCard: (event) => {
                                    event.preventDefault()
                                    const incomingRecipeId = event.dataTransfer.getData("text/recipe-id")
                                    const originDay = event.dataTransfer.getData("text/from-day")
                                    if (!incomingRecipeId || !originDay) {
                                      return
                                    }
                                    moveRecipe(incomingRecipeId, originDay, day, index)
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
    </div>
  )
}
