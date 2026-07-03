"use client"

import { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ShopList } from "@/components/shoplist-banner"
import type { Recipe, RecipeServingsContext } from "@/features/recipes/types"
import { scaleRecipeIngredients } from "@/features/recipes/types"
import { RecipeDetailsPanel } from "@/features/recipes/recipe-dialog/recipe-details-panel"
import { RecipeNotesPanel } from "@/features/recipes/recipe-dialog/recipe-notes-panel"
import { SaveRecipeDialog } from "@/features/recipes/recipe-dialog/save-recipe-dialog"
import { useRecipeDialogState } from "@/features/recipes/recipe-dialog/use-recipe-dialog-state"

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
  const state = useRecipeDialogState(lists, recipe?.servings ?? null, recipe?.saved_notes ?? "")

  if (!recipe) return null

  const currentRecipe = recipe

  const normalizedServings = Number.parseInt(state.servingsInput, 10)
  const selectedServings =
    Number.isFinite(normalizedServings) && normalizedServings > 0 ? normalizedServings : null
  const scaledIngredients = scaleRecipeIngredients(currentRecipe, selectedServings)
  const canPersistServingsInline = Boolean(servingsContext && onUpdateServings)
  const mealType = currentRecipe.tags.find((tag) => tag.category === "meal_type")?.name
  const cuisine = currentRecipe.tags.find((tag) => tag.category === "cuisine")?.name
  const averageRatingLabel =
    currentRecipe.average_rating !== null ? currentRecipe.average_rating.toFixed(1) : null

  async function handleSaveRecipe() {
    await onSaveRecipe(currentRecipe, selectedServings, state.notesInput.trim() || null)
    state.setSaveDialogOpen(false)
    state.setListSearch("")
  }

  async function handleAddRecipeToList(listId: string) {
    await onAddToList(listId, currentRecipe, selectedServings)
    state.setSaveDialogOpen(false)
    state.setListSearch("")
  }

  async function persistServingsIfNeeded(nextServings: number | null = selectedServings) {
    if (!canPersistServingsInline || !servingsContext || !onUpdateServings) {
      return
    }

    if (state.isPersistingServings || nextServings === state.persistedServings) {
      return
    }

    state.setIsPersistingServings(true)
    try {
      await onUpdateServings(currentRecipe, nextServings, servingsContext)
      state.setPersistedServings(nextServings)
      onServingsPersisted?.(nextServings)
    } finally {
      state.setIsPersistingServings(false)
    }
  }

  async function persistNotesIfNeeded(nextNotes: string = state.notesInput) {
    const normalizedNotes = nextNotes.trim()

    if (state.isPersistingNotes || normalizedNotes === state.persistedNotes.trim()) {
      return
    }

    state.setIsPersistingNotes(true)
    try {
      await onSaveNotes(currentRecipe, normalizedNotes || null)
      state.setPersistedNotes(normalizedNotes)
    } finally {
      state.setIsPersistingNotes(false)
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
            state.setSaveDialogOpen(false)
            state.setListSearch("")
            state.setNotesOpen(false)
            state.setServingsInput(recipe.servings ? String(recipe.servings) : "")
            state.setNotesInput(recipe.saved_notes ?? "")
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
            className={`pointer-events-auto mx-auto grid w-fit max-h-[90vh] gap-4 ${state.notesOpen ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,48rem)]"}`}
          >
            <RecipeDetailsPanel
              averageRatingLabel={averageRatingLabel}
              canPersistServingsInline={canPersistServingsInline}
              currentRecipe={currentRecipe}
              cuisine={cuisine}
              isPersistingServings={state.isPersistingServings}
              mealType={mealType}
              notesOpen={state.notesOpen}
              scaledIngredients={scaledIngredients}
              servingsInput={state.servingsInput}
              onOpenSaveDialog={() => state.setSaveDialogOpen(true)}
              onNotesToggle={() => state.setNotesOpen((current) => !current)}
              onRateRecipe={onRateRecipe}
              onRemoveRating={onRemoveRating}
              onServingsBlur={() => {
                void persistServingsIfNeeded()
              }}
              onServingsChange={state.setServingsInput}
            />

            {state.notesOpen ? (
              <RecipeNotesPanel
                notesInput={state.notesInput}
                onChange={state.setNotesInput}
                onBlur={() => {
                  void persistNotesIfNeeded()
                }}
                onClose={() => state.setNotesOpen(false)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <SaveRecipeDialog
        filteredLists={state.filteredLists}
        listSearch={state.listSearch}
        open={state.saveDialogOpen}
        recipe={recipe}
        onAddToList={(listId) => {
          void handleAddRecipeToList(listId)
        }}
        onListSearchChange={state.setListSearch}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            state.setListSearch("")
          }
          state.setSaveDialogOpen(nextOpen)
        }}
        onSaveRecipe={() => {
          void handleSaveRecipe()
        }}
      />
    </>
  )
}
