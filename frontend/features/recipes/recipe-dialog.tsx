"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Bookmark, Clock, Heart, Plus, Search, Trash2, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DietaryBadge } from "@/components/dietary-badge"
import { Input } from "@/components/ui/input"
import { StarRating } from "@/components/star-rating"
import type { ShopList } from "@/components/shoplist-banner"
import type { Recipe } from "@/features/recipes/types"
import { formatPrepTime } from "@/features/recipes/types"
import { cn } from "@/lib/utils"

interface RecipeDialogProps {
  recipe: Recipe | null
  open: boolean
  onOpenChange: (open: boolean) => void
  lists: ShopList[]
  onAddToList: (listId: string, recipe: Recipe) => void
  onToggleFavorite: (recipe: Recipe) => void
  onRateRecipe: (recipeId: string, rating: number) => void
  onRemoveRating: (recipeId: string) => void
}

export function RecipeDialog({
  recipe,
  open,
  onOpenChange,
  lists,
  onAddToList,
  onToggleFavorite,
  onRateRecipe,
  onRemoveRating,
}: RecipeDialogProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [listSearch, setListSearch] = useState("")

  const filteredLists = useMemo(() => {
    const query = listSearch.trim().toLowerCase()
    if (!query) return lists
    return lists.filter((list) => list.name.toLowerCase().includes(query))
  }, [listSearch, lists])

  if (!recipe) return null

  const mealType = recipe.tags.find((tag) => tag.category === "meal_type")?.name
  const cuisine = recipe.tags.find((tag) => tag.category === "cuisine")?.name
  const averageRatingLabel =
    recipe.average_rating !== null ? recipe.average_rating.toFixed(1) : null

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSaveDialogOpen(false)
            setListSearch("")
          }
          onOpenChange(nextOpen)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{recipe.name}</DialogTitle>
            <DialogDescription>{recipe.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-t-lg">
              <Image src={recipe.image} alt={recipe.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-black/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 flex flex-wrap gap-2">
                  {mealType && (
                    <span className="rounded-full bg-background/92 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
                      {mealType}
                    </span>
                  )}
                  {cuisine && (
                    <span className="rounded-full border border-white/20 bg-black/28 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      {cuisine}
                    </span>
                  )}
                </div>
                <h2 className="text-[1.75rem] font-semibold leading-tight text-white">{recipe.name}</h2>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded-full bg-primary/70" />
                  <h4 className="text-base font-semibold">Description</h4>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-[15px] leading-7 text-foreground/88">{recipe.description}</p>
                </div>
              </div>

              {recipe.dietaryOptions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recipe.dietaryOptions.map((option) => (
                    <DietaryBadge key={option} type={option} />
                  ))}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div className="rounded-xl border border-border/70 bg-card p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Community Rating
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    {averageRatingLabel && (
                      <span className="text-2xl font-semibold leading-none text-foreground">
                        {averageRatingLabel}
                      </span>
                    )}
                    <div className="pb-0.5">
                      <StarRating rating={recipe.average_rating ?? 0} size="md" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {recipe.ratings_count > 0
                      ? `${recipe.ratings_count} ${recipe.ratings_count === 1 ? "rating" : "ratings"}`
                      : "No ratings yet"}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Prep Time
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatPrepTime(recipe.prep_time_minutes)}
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Servings
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {recipe.servings ?? "?"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Your rating</p>
                  <div className="mt-3">
                    <StarRating
                      rating={recipe.user_rating ?? 0}
                      size="md"
                      interactive
                      onChange={(rating) => onRateRecipe(recipe.id, rating)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {recipe.user_rating && (
                    <Button variant="ghost" size="sm" onClick={() => onRemoveRating(recipe.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSaveDialogOpen(true)}>
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
                <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
                  <ul className="space-y-2.5">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0">
                          <span className="font-medium text-foreground">
                            {ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}
                          </span>
                          {ingredient.amount && (
                            <span className="text-muted-foreground"> - {ingredient.amount}</span>
                          )}
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
                <ol className="space-y-3">
                  {recipe.instructions.map((instruction, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-xl border border-border/70 bg-card p-3 text-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 leading-6 text-muted-foreground">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={saveDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setListSearch("")
          }
          setSaveDialogOpen(nextOpen)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Save Recipe</DialogTitle>
            <DialogDescription>
              Save this recipe to your profile or add it to one of your lists.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Save to my profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep this recipe in your personal saved collection.
                  </p>
                </div>
                <Button
                  variant={recipe.is_favorite ? "default" : "outline"}
                  onClick={() => onToggleFavorite(recipe)}
                >
                  <Heart className={cn("h-4 w-4", recipe.is_favorite && "fill-current")} />
                  {recipe.is_favorite ? "Saved" : "Save"}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4">
              <h4 className="text-sm font-medium text-foreground">Add to a list</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Search your lists and add this recipe directly.
              </p>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search lists..."
                  className="pl-9"
                />
              </div>

              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {filteredLists.length > 0 ? (
                  filteredLists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => onAddToList(list.id, recipe)}
                      className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{list.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    No lists match your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
