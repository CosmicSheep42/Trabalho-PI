"use client"

import Image from "next/image"
import { Bookmark, Clock, NotebookPen, Trash2, Users } from "lucide-react"
import { DietaryBadge } from "@/components/dietary-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StarRating } from "@/components/star-rating"
import type { Recipe } from "@/features/recipes/types"
import { formatPrepTime } from "@/features/recipes/types"

interface RecipeDetailsPanelProps {
  averageRatingLabel: string | null
  canPersistServingsInline: boolean
  currentRecipe: Recipe
  isPersistingServings: boolean
  mealType?: string
  notesOpen: boolean
  cuisine?: string
  scaledIngredients: Array<{ name: string; amount?: string | null }>
  servingsInput: string
  onOpenSaveDialog: () => void
  onNotesToggle: () => void
  onRateRecipe: (recipeId: string, rating: number) => void
  onRemoveRating: (recipeId: string) => void
  onServingsBlur: () => void
  onServingsChange: (value: string) => void
}

export function RecipeDetailsPanel({
  averageRatingLabel,
  canPersistServingsInline,
  currentRecipe,
  isPersistingServings,
  mealType,
  notesOpen,
  cuisine,
  scaledIngredients,
  servingsInput,
  onOpenSaveDialog,
  onNotesToggle,
  onRateRecipe,
  onRemoveRating,
  onServingsBlur,
  onServingsChange,
}: RecipeDetailsPanelProps) {
  return (
    <div className="max-h-[90vh] overflow-x-hidden overflow-y-auto rounded-[28px] border border-border/70 bg-background shadow-2xl">
      <div className="relative aspect-video overflow-hidden rounded-t-[28px]">
        <Image src={currentRecipe.image} alt={currentRecipe.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="mb-2 flex flex-wrap gap-2">
            {mealType ? (
              <span className="rounded-full bg-background/92 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
                {mealType}
              </span>
            ) : null}
            {cuisine ? (
              <span className="rounded-full border border-white/20 bg-black/28 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {cuisine}
              </span>
            ) : null}
          </div>
          <h2 className="text-[1.75rem] font-semibold leading-tight text-white">{currentRecipe.name}</h2>
        </div>
      </div>

      <div className="px-6 pb-6 lg:px-7">
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Personal notes</p>
            <p className="text-xs text-muted-foreground">Open a split notepad for your own annotations.</p>
          </div>
          <Button variant={notesOpen ? "default" : "outline"} onClick={onNotesToggle}>
            <NotebookPen className="h-4 w-4" />
            Notes
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary/70" />
            <h4 className="text-base font-semibold">Description</h4>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <p className="text-[15px] leading-7 text-foreground/88">{currentRecipe.description}</p>
          </div>
        </div>

        {currentRecipe.dietaryOptions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {currentRecipe.dietaryOptions.map((option) => (
              <DietaryBadge key={option} type={option} />
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.9fr_0.9fr]">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Community Rating</p>
            <div className="mt-2 flex items-end gap-3">
              {averageRatingLabel ? <span className="text-2xl font-semibold leading-none text-foreground">{averageRatingLabel}</span> : null}
              <div className="pb-0.5">
                <StarRating rating={currentRecipe.average_rating ?? 0} size="md" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {currentRecipe.ratings_count > 0
                ? `${currentRecipe.ratings_count} ${currentRecipe.ratings_count === 1 ? "rating" : "ratings"}`
                : "No ratings yet"}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Prep Time</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {formatPrepTime(currentRecipe.prep_time_minutes)}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Servings</p>
            <div className="mt-2 flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                inputMode="numeric"
                value={servingsInput}
                onChange={(event) => onServingsChange(event.target.value)}
                onBlur={onServingsBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur()
                  }
                }}
                className="h-9 w-24"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Leave blank to use the recipe default.</p>
            {canPersistServingsInline ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {isPersistingServings ? "Saving servings..." : "Changes save automatically here."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Your rating</p>
            <div className="mt-3">
              <StarRating
                rating={currentRecipe.user_rating ?? 0}
                size="md"
                interactive
                onChange={(rating) => onRateRecipe(currentRecipe.id, rating)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentRecipe.user_rating ? (
              <Button variant="ghost" size="sm" onClick={() => onRemoveRating(currentRecipe.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            ) : null}
            <Button variant="outline" onClick={onOpenSaveDialog}>
              <Bookmark className="h-4 w-4" />
              Save recipe
            </Button>
          </div>
        </div>

        <section className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary/70" />
            <h4 className="text-base font-semibold">Ingredients</h4>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/25 px-5 py-4">
            <ul className="space-y-2.5">
              {scaledIngredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">
                      {ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}
                    </span>
                    {ingredient.amount ? <span className="text-muted-foreground"> - {ingredient.amount}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary/70" />
            <h4 className="text-base font-semibold">Instructions</h4>
          </div>
          <ol className="space-y-3.5">
            {currentRecipe.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3.5 rounded-xl border border-border/70 bg-card p-4 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <span className="pt-0.5 leading-6 text-muted-foreground">{instruction}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
