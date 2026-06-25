"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Bookmark, Clock, NotebookPen, Plus, Search, Trash2, Users, X } from "lucide-react"
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
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { formatPrepTime, scaleRecipeIngredients } from "@/features/recipes/types"

interface RecipeDialogProps {
  recipe: Recipe | null
  open: boolean
  onOpenChange: (open: boolean) => void
  lists: ShopList[]
  servingsContext?: RecipeServingsContext | null
  onAddToList: (listId: string, recipe: Recipe, servings?: number | null) => Promise<void> | void
  onSaveRecipe: (recipe: Recipe, servings?: number | null, notes?: string | null) => Promise<void> | void
  onSaveNotes: (recipe: Recipe, notes: string | null) => Promise<void> | void
  onUpdateServings?: (
    recipe: Recipe,
    servings: number | null,
    context: RecipeServingsContext
  ) => Promise<void> | void
  onServingsPersisted?: (servings: number | null) => void
  onRateRecipe: (recipeId: string, rating: number) => void
  onRemoveRating: (recipeId: string) => void
}

export function RecipeDialog({
  recipe,
  open,
  onOpenChange,
  lists,
  servingsContext = null,
  onAddToList,
  onSaveRecipe,
  onSaveNotes,
  onUpdateServings,
  onServingsPersisted,
  onRateRecipe,
  onRemoveRating,
}: RecipeDialogProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [listSearch, setListSearch] = useState("")
  const [servingsInput, setServingsInput] = useState(recipe?.servings ? String(recipe.servings) : "")
  const [persistedServings, setPersistedServings] = useState<number | null>(recipe?.servings ?? null)
  const [isPersistingServings, setIsPersistingServings] = useState(false)
  const [notesInput, setNotesInput] = useState(recipe?.saved_notes ?? "")
  const [persistedNotes, setPersistedNotes] = useState(recipe?.saved_notes ?? "")
  const [isPersistingNotes, setIsPersistingNotes] = useState(false)

  const filteredLists = useMemo(() => {
    const query = listSearch.trim().toLowerCase()
    if (!query) return lists
    return lists.filter((list) => list.name.toLowerCase().includes(query))
  }, [listSearch, lists])

  if (!recipe) return null

  const currentRecipe = recipe

  const normalizedServings = Number.parseInt(servingsInput, 10)
  const selectedServings =
    Number.isFinite(normalizedServings) && normalizedServings > 0 ? normalizedServings : null
  const scaledIngredients = scaleRecipeIngredients(currentRecipe, selectedServings)
  const canPersistServingsInline = Boolean(servingsContext && onUpdateServings)
  const mealType = currentRecipe.tags.find((tag) => tag.category === "meal_type")?.name
  const cuisine = currentRecipe.tags.find((tag) => tag.category === "cuisine")?.name
  const averageRatingLabel =
    currentRecipe.average_rating !== null ? currentRecipe.average_rating.toFixed(1) : null

  async function handleSaveRecipe() {
    await onSaveRecipe(currentRecipe, selectedServings, notesInput.trim() || null)
    setSaveDialogOpen(false)
    setListSearch("")
  }

  async function handleAddRecipeToList(listId: string) {
    await onAddToList(listId, currentRecipe, selectedServings)
    setSaveDialogOpen(false)
    setListSearch("")
  }

  async function persistServingsIfNeeded(nextServings: number | null = selectedServings) {
    if (!canPersistServingsInline || !servingsContext || !onUpdateServings) {
      return
    }

    if (isPersistingServings || nextServings === persistedServings) {
      return
    }

    setIsPersistingServings(true)
    try {
      await onUpdateServings(currentRecipe, nextServings, servingsContext)
      setPersistedServings(nextServings)
      onServingsPersisted?.(nextServings)
    } finally {
      setIsPersistingServings(false)
    }
  }

  async function persistNotesIfNeeded(nextNotes: string = notesInput) {
    const normalizedNotes = nextNotes.trim()

    if (isPersistingNotes || normalizedNotes === persistedNotes.trim()) {
      return
    }

    setIsPersistingNotes(true)
    try {
      await onSaveNotes(currentRecipe, normalizedNotes || null)
      setPersistedNotes(normalizedNotes)
    } finally {
      setIsPersistingNotes(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            void persistServingsIfNeeded()
            void persistNotesIfNeeded()
            setSaveDialogOpen(false)
            setListSearch("")
            setNotesOpen(false)
            setServingsInput(recipe.servings ? String(recipe.servings) : "")
            setNotesInput(recipe.saved_notes ?? "")
          }
          onOpenChange(nextOpen)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="pointer-events-none max-h-[90vh] w-fit max-w-[calc(100%-2rem)] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-[46rem] lg:max-w-[94rem]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{recipe.name}</DialogTitle>
            <DialogDescription>{recipe.description}</DialogDescription>
          </DialogHeader>

          <div
            className={`pointer-events-auto mx-auto grid w-fit max-h-[90vh] gap-4 ${notesOpen ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,48rem)]"}`}
          >
            <div className="max-h-[90vh] overflow-x-hidden overflow-y-auto rounded-[28px] border border-border/70 bg-background shadow-2xl">
              <div className="relative aspect-video overflow-hidden rounded-t-[28px]">
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

              <div className="px-6 pb-6 lg:px-7">
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Personal notes</p>
                    <p className="text-xs text-muted-foreground">
                      Open a split notepad for your own annotations.
                    </p>
                  </div>
                  <Button variant={notesOpen ? "default" : "outline"} onClick={() => setNotesOpen((current) => !current)}>
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

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.9fr_0.9fr]">
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

                  <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Prep Time
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatPrepTime(recipe.prep_time_minutes)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Servings
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={servingsInput}
                        onChange={(event) => setServingsInput(event.target.value)}
                        onBlur={() => {
                          void persistServingsIfNeeded()
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur()
                          }
                        }}
                        className="h-9 w-24"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Leave blank to use the recipe default.
                    </p>
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
                  <div className="rounded-xl border border-border/70 bg-muted/25 px-5 py-4">
                    <ul className="space-y-2.5">
                      {scaledIngredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-3.5 text-sm">
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
                  <ol className="space-y-3.5">
                    {recipe.instructions.map((instruction, i) => (
                      <li
                        key={i}
                        className="flex gap-3.5 rounded-xl border border-border/70 bg-card p-4 text-sm"
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

            {notesOpen ? (
              <aside className="flex max-h-[90vh] flex-col overflow-hidden rounded-[28px] border border-amber-300/80 bg-[linear-gradient(180deg,rgba(255,244,184,0.98)_0%,rgba(255,234,140,0.95)_100%)] shadow-2xl">
                <div className="border-b border-amber-400/70 bg-amber-200/70 px-6 py-5">
                  <div className="flex items-start justify-between gap-4 text-amber-950">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/80">
                        <NotebookPen className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Recipe notes</h3>
                        <p className="text-sm text-amber-900/80">Your personal block for tweaks, reminders and ideas.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotesOpen(false)}
                      className="rounded-full p-2 text-black transition-colors hover:bg-black/10"
                      aria-label="Close notes"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden px-6 py-5">
                  <div
                    className="flex-1 rounded-[24px] border border-amber-400/60 p-4"
                    style={{
                      backgroundColor: "rgba(255, 251, 235, 0.72)",
                      backgroundImage:
                        "repeating-linear-gradient(180deg, transparent 0px, transparent 35px, rgba(180,120,0,0.13) 35px, rgba(180,120,0,0.13) 36px)",
                    }}
                  >
                    <textarea
                      value={notesInput}
                      onChange={(event) => setNotesInput(event.target.value)}
                      onBlur={() => {
                        void persistNotesIfNeeded()
                      }}
                      placeholder="Write anything about this recipe..."
                      className="h-full min-h-[74vh] w-full -translate-y-[5.5px] resize-none border-0 bg-transparent px-1 py-[1px] text-base leading-9 text-amber-950 outline-none placeholder:text-amber-900/55"
                    />
                  </div>
                </div>
              </aside>
            ) : null}
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
                  variant={recipe.is_saved ? "default" : "outline"}
                  onClick={() => void handleSaveRecipe()}
                >
                  <Bookmark className="h-4 w-4" />
                  {recipe.is_saved ? "Update saved recipe" : "Save recipe"}
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
                      onClick={() => void handleAddRecipeToList(list.id)}
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
