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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-muted-foreground hover:text-foreground">
                Clear all
              </Button>
            )}
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Time</h5>
            <div className="flex gap-2">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      timeFilter: filters.timeFilter === option.value ? null : option.value,
                    })
                  }
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md border transition-colors",
                    filters.timeFilter === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Filter */}
          <div>
            <h5 className="text-sm font-medium mb-2">Dietary Preferences</h5>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleDietary(option.id)}
                  className={cn(
                    "px-2.5 py-1 text-sm rounded-md border transition-colors",
                    filters.dietary.includes(option.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-sm font-medium">Tags</h5>
            {tagSections.map(({ category, label }) => (
              <div key={category}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags[category].map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.slug)}
                      className={cn(
                        "px-2.5 py-1 text-sm rounded-md border transition-colors",
                        filters.tags.includes(tag.slug)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {showHolidayFilters && availableTags.holidays.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Holidays</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.holidays.map((holiday) => (
                    <button
                      key={holiday.id}
                      onClick={() => toggleHoliday(holiday.slug)}
                      className={cn(
                        "px-2.5 py-1 text-sm rounded-md border transition-colors",
                        filters.holidays.includes(holiday.slug)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      )}
                    >
                      {holiday.name}
                    </button>
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
    <div className="flex flex-wrap gap-2">
      {filters.timeFilter && (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-secondary">
          {timeOptions.find((option) => option.value === filters.timeFilter)?.label}
          <button onClick={() => onFiltersChange({ ...filters, timeFilter: null })} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      {filters.dietary.map((option) => (
        <span
          key={option}
          className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-secondary"
        >
          {dietaryBadgeConfig[option].label}
          <button onClick={() => removeDietary(option)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {filters.tags.map((tagId) => {
        return (
          <span
            key={tagId}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-secondary"
          >
            {tagLookup.get(tagId) ?? tagId}
            <button onClick={() => removeTag(tagId)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        )
      })}
      {filters.holidays.map((holidayId) => (
        <span
          key={holidayId}
          className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-secondary"
        >
          {holidayLookup.get(holidayId) ?? holidayId}
          <button onClick={() => removeHoliday(holidayId)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )
}
