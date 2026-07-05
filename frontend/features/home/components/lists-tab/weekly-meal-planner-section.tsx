"use client"

import type * as React from "react"
import { format } from "date-fns"
import { PartyPopper, Soup } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DayOfWeek, MealPlanEntry } from "@/features/meal-planner/types"
import type { Recipe } from "@/features/recipes/types"
import { weekDays } from "@/features/meal-planner/types"
import type { PlannerEventSuggestion } from "./types"

interface WeeklyMealPlannerSectionProps {
  currentPlannerWeekDates: Record<DayOfWeek, Date>
  plannerEntriesByDay: Record<DayOfWeek, MealPlanEntry[]>
  plannerEventSuggestionsByDay: Record<DayOfWeek, PlannerEventSuggestion[]>
  recipeMap: Map<string, Recipe>
  onDayDrop: (day: DayOfWeek, event: React.DragEvent<HTMLDivElement>, targetIndex?: number) => void
  renderRecipeCard: (
    recipe: Recipe,
    options?: {
      day?: DayOfWeek
      entry?: MealPlanEntry
      index?: number
      draggable?: boolean
      fromDay?: DayOfWeek | "bank"
      onDropAtCard?: (event: React.DragEvent<HTMLDivElement>) => void
    }
  ) => React.ReactNode
}

export function WeeklyMealPlannerSection({
  currentPlannerWeekDates,
  plannerEntriesByDay,
  plannerEventSuggestionsByDay,
  recipeMap,
  onDayDrop,
  renderRecipeCard,
}: WeeklyMealPlannerSectionProps) {
  return (
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
                onDrop={(event) => onDayDrop(day, event)}
              >
                <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
                  <div className="space-y-2">
                    <p className="text-base font-semibold">{day}</p>
                    <p className="text-sm text-muted-foreground">{format(plannerDate, "MMM d")}</p>
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
                                onDropAtCard: (event) => onDayDrop(day, event, index),
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
                      <div className="flex min-h-16 items-center justify-center rounded-xl text-sm text-muted-foreground">
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
  )
}
