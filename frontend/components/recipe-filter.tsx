"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { dietaryBadgeConfig, type DietaryOption } from "@/lib/dietary-options"
import type { BackendTagGroups, RecipeTagCategory, TimeFilter } from "@/features/recipes/types"
import { cn } from "@/lib/utils"

const dietaryOptions = Object.entries(dietaryBadgeConfig).map(([id, config]) => ({
  id: id as DietaryOption,
  label: config.label,
}))

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "under_15m", label: "Under 15 min" },
  { value: "under_30m", label: "Under 30 min" },
  { value: "under_60m", label: "Under 60 min" },
  { value: "above_60m", label: "Above 60 min" },
]

export interface ActiveRecipeFilters {
  dietary: DietaryOption[]
  tags: string[]
  holidays: string[]
  timeFilter: TimeFilter | null
}

const tagSections: { category: RecipeTagCategory; label: string }[] = [
  { category: "meal_type", label: "Meal Type" },
  { category: "cuisine", label: "Cuisine" },
  { category: "occasion", label: "Occasion" },
  { category: "weather", label: "Weather" },
  { category: "difficulty", label: "Difficulty" },
  { category: "cooking_method", label: "Cooking Method" },
  { category: "main_protein", label: "Main Protein" },
]

interface RecipeFilterProps {
  filters: ActiveRecipeFilters
  availableTags: BackendTagGroups
  onFiltersChange: (filters: ActiveRecipeFilters) => void
}

export function RecipeFilter({
  filters,
  availableTags,
  onFiltersChange,
}: RecipeFilterProps) {
  const [open, setOpen] = useState(false)

  const toggleDietary = (option: DietaryOption) => {
    const dietary = filters.dietary.includes(option)
      ? filters.dietary.filter((item) => item !== option)
      : [...filters.dietary, option]
    onFiltersChange({ ...filters, dietary })
  }

  const toggleTag = (tagId: string) => {
    const isRemoving = filters.tags.includes(tagId)
    const tags = isRemoving
      ? filters.tags.filter((item) => item !== tagId)
      : [...filters.tags, tagId]

    onFiltersChange({
      ...filters,
      tags,
      holidays: tagId === "holidays" && isRemoving ? [] : filters.holidays,
    })
  }

  const toggleHoliday = (holidayId: string) => {
    const holidays = filters.holidays.includes(holidayId)
      ? filters.holidays.filter((item) => item !== holidayId)
      : [...filters.holidays, holidayId]
    onFiltersChange({ ...filters, holidays })
  }

  const clearFilters = () => {
    onFiltersChange({ dietary: [], tags: [], holidays: [], timeFilter: null })
  }

  const activeFilterCount =
    filters.dietary.length +
    filters.tags.length +
    filters.holidays.length +
    (filters.timeFilter ? 1 : 0)
  const showHolidayFilters = filters.tags.includes("holidays")

  const renderChipButton = (label: string, selected: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-all",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-foreground hover:border-border/80 hover:bg-accent"
      )}
    >
      {label}
    </button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 rounded-xl border-border/70 bg-background px-3 text-sm shadow-none hover:bg-accent/50",
            activeFilterCount > 0 && "border-primary/30 bg-primary/5 text-foreground"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(25rem,calc(100vw-2rem))] rounded-2xl border-border/70 p-0 shadow-lg"
        align="end"
      >
        <div className="border-b border-border/70 bg-primary/5 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Recipe filters</h4>
              <p className="text-xs text-muted-foreground">
                Refine results without leaving this view.
              </p>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto rounded-full px-2.5 py-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto p-4">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-primary">Time</h5>
              {filters.timeFilter && (
                <span className="text-[11px] text-primary/80">1 selected</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {timeOptions.map((option) => (
                <div key={option.value}>
                  {renderChipButton(
                    option.label,
                    filters.timeFilter === option.value,
                    () =>
                      onFiltersChange({
                        ...filters,
                        timeFilter: filters.timeFilter === option.value ? null : option.value,
                      })
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-primary">Dietary</h5>
              {filters.dietary.length > 0 && (
                <span className="text-[11px] text-primary/80">
                  {filters.dietary.length} selected
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <div key={option.id}>
                  {renderChipButton(
                    option.label,
                    filters.dietary.includes(option.id),
                    () => toggleDietary(option.id)
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              {filters.tags.length > 0 && (
                <span className="text-[11px] text-primary/80">
                  {filters.tags.length} selected
                </span>
              )}
            </div>
            {tagSections.map(({ category, label }) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-medium text-foreground/80">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags[category].map((tag) => (
                    <div key={tag.id}>
                      {renderChipButton(
                        tag.name,
                        filters.tags.includes(tag.slug),
                        () => toggleTag(tag.slug)
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {showHolidayFilters && availableTags.holidays.length > 0 && (
              <div className="space-y-2 border-t border-dashed border-border/70 pt-3">
                <p className="text-xs font-medium text-foreground/80">Holidays</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.holidays.map((holiday) => (
                    <div key={holiday.id}>
                      {renderChipButton(
                        holiday.name,
                        filters.holidays.includes(holiday.slug),
                        () => toggleHoliday(holiday.slug)
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ActiveFilters({
  filters,
  availableTags,
  onFiltersChange,
}: RecipeFilterProps) {
  if (
    filters.dietary.length === 0 &&
    filters.tags.length === 0 &&
    filters.holidays.length === 0 &&
    !filters.timeFilter
  ) {
    return null
  }

  const tagLookup = new Map(
    [
      ...availableTags.meal_type,
      ...availableTags.cuisine,
      ...availableTags.occasion,
      ...availableTags.weather,
      ...availableTags.difficulty,
      ...availableTags.cooking_method,
      ...availableTags.main_protein,
    ].map((tag) => [tag.slug, tag.name])
  )
  const holidayLookup = new Map(availableTags.holidays.map((holiday) => [holiday.slug, holiday.name]))

  const removeDietary = (option: DietaryOption) =>
    onFiltersChange({ ...filters, dietary: filters.dietary.filter((item) => item !== option) })

  const removeTag = (tagId: string) =>
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter((item) => item !== tagId),
      holidays: tagId === "holidays" ? [] : filters.holidays,
    })

  const removeHoliday = (holidayId: string) =>
    onFiltersChange({ ...filters, holidays: filters.holidays.filter((item) => item !== holidayId) })

  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Active filters
        </span>
      {filters.timeFilter && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-sm">
          {timeOptions.find((option) => option.value === filters.timeFilter)?.label}
          <button onClick={() => onFiltersChange({ ...filters, timeFilter: null })} className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      {filters.dietary.map((option) => (
        <span
          key={option}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-sm"
        >
          {dietaryBadgeConfig[option].label}
          <button onClick={() => removeDietary(option)} className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {filters.tags.map((tagId) => {
        return (
          <span
            key={tagId}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-sm"
          >
            {tagLookup.get(tagId) ?? tagId}
            <button onClick={() => removeTag(tagId)} className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        )
      })}
      {filters.holidays.map((holidayId) => (
        <span
          key={holidayId}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-sm"
        >
          {holidayLookup.get(holidayId) ?? holidayId}
          <button onClick={() => removeHoliday(holidayId)} className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      </div>
    </div>
  )
}
