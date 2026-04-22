"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const filterOptions = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "gluten-free", label: "Gluten Free" },
  { id: "lactose-free", label: "Lactose Free" },
  { id: "no-eggs", label: "No Eggs" },
  { id: "nut-free", label: "Nut Free" },
  { id: "low-carb", label: "Low Carb" },
  { id: "high-protein", label: "High Protein" },
]

const ratingOptions = [
  { value: 5, label: "5 Stars" },
  { value: 4, label: "4+ Stars" },
  { value: 3, label: "3+ Stars" },
]

interface RecipeFilterProps {
  selectedTags: string[]
  minRating: number | null
  onTagsChange: (tags: string[]) => void
  onRatingChange: (rating: number | null) => void
}

export function RecipeFilter({
  selectedTags,
  minRating,
  onTagsChange,
  onRatingChange,
}: RecipeFilterProps) {
  const [open, setOpen] = useState(false)

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  const clearFilters = () => {
    onTagsChange([])
    onRatingChange(null)
  }

  const activeFilterCount = selectedTags.length + (minRating ? 1 : 0)

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

          {/* Rating Filter */}
          <div>
            <h5 className="text-sm font-medium mb-2">Minimum Rating</h5>
            <div className="flex gap-2">
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onRatingChange(minRating === option.value ? null : option.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md border transition-colors",
                    minRating === option.value
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
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleTag(option.id)}
                  className={cn(
                    "px-2.5 py-1 text-sm rounded-md border transition-colors",
                    selectedTags.includes(option.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ActiveFilters({
  selectedTags,
  minRating,
  onTagsChange,
  onRatingChange,
}: RecipeFilterProps) {
  if (selectedTags.length === 0 && !minRating) return null

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagId))
  }

  return (
    <div className="flex flex-wrap gap-2">
      {minRating && (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-secondary">
          {minRating}+ Stars
          <button onClick={() => onRatingChange(null)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      {selectedTags.map((tagId) => {
        const option = filterOptions.find((o) => o.id === tagId)
        return (
          <span
            key={tagId}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-secondary"
          >
            {option?.label}
            <button onClick={() => removeTag(tagId)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        )
      })}
    </div>
  )
}
