"use client"

import { Bookmark, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ShopList } from "@/components/shoplist-banner"
import type { Recipe } from "@/features/recipes/types"

interface SaveRecipeDialogProps {
  filteredLists: ShopList[]
  listSearch: string
  open: boolean
  recipe: Recipe
  onAddToList: (listId: string) => void
  onListSearchChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSaveRecipe: () => void
}

export function SaveRecipeDialog({
  filteredLists,
  listSearch,
  open,
  recipe,
  onAddToList,
  onListSearchChange,
  onOpenChange,
  onSaveRecipe,
}: SaveRecipeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Button variant={recipe.is_saved ? "default" : "outline"} onClick={onSaveRecipe}>
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
                onChange={(event) => onListSearchChange(event.target.value)}
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
                    onClick={() => onAddToList(list.id)}
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
  )
}
