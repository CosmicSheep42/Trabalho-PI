"use client"

import type * as React from "react"
import { ChevronDown, Soup } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Recipe } from "@/features/recipes/types"
import type { SavedRecipeTab } from "./types"

interface SavedRecipesSectionProps {
  activeTabId: string
  draggedRecipeId: string | null
  savedRecipesExpanded: boolean
  savedRecipeTabs: SavedRecipeTab[]
  savedTabsScrollRef: React.RefObject<HTMLDivElement | null>
  onDropToBank: (event: React.DragEvent<HTMLDivElement>) => void
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void
  onRemoveSavedRecipe: (recipe: Recipe) => void
  onSavedTabChange: (value: string) => void
  onSavedRecipesExpandedChange: (value: boolean) => void
  renderRecipeCard: (recipe: Recipe, options?: {
    draggable?: boolean
    fromDay?: "bank"
    onRemove?: () => void
  }) => React.ReactNode
}

export function SavedRecipesSection({
  activeTabId,
  draggedRecipeId,
  savedRecipesExpanded,
  savedRecipeTabs,
  savedTabsScrollRef,
  onDropToBank,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRemoveSavedRecipe,
  onSavedTabChange,
  onSavedRecipesExpandedChange,
  renderRecipeCard,
}: SavedRecipesSectionProps) {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="min-h-16 border-b py-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Soup className="h-6 w-6 shrink-0 text-primary" />
          Your Recipes
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden p-6">
        <Tabs value={activeTabId} onValueChange={onSavedTabChange} className="gap-4">
          {savedRecipeTabs.length > 4 ? (
            <p className="text-xs text-muted-foreground">Drag and pull to see more tabs.</p>
          ) : null}
          <div
            ref={savedTabsScrollRef}
            className="cursor-grab overflow-x-auto pb-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            <TabsList className="inline-flex h-auto min-w-max justify-start rounded-2xl bg-muted/40 p-1">
              {savedRecipeTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="min-w-fit px-4 py-2">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {savedRecipeTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
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
                onDrop={onDropToBank}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{tab.label}</p>
                    <p className="text-sm text-muted-foreground">Drag any recipe into a day.</p>
                  </div>
                  {tab.recipes.length > 4 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSavedRecipesExpandedChange(!savedRecipesExpanded)}
                      className="shrink-0"
                    >
                      {savedRecipesExpanded ? "Retract" : "Expand"}
                      <ChevronDown
                        className={`ml-2 h-4 w-4 transition-transform ${
                          savedRecipesExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  ) : null}
                </div>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ${
                    savedRecipesExpanded ? "max-h-[80rem]" : "max-h-[20rem]"
                  }`}
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {(savedRecipesExpanded ? tab.recipes : tab.recipes.slice(0, 4)).map((recipe) => (
                      <div key={`saved-${recipe.id}`}>
                        {renderRecipeCard(recipe, {
                          draggable: true,
                          fromDay: "bank",
                          onRemove: () => onRemoveSavedRecipe(recipe),
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                {tab.recipes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    {tab.emptyMessage}
                  </div>
                ) : null}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
