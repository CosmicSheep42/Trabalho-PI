"use client"

import Image from "next/image"
import { Clock, Heart, Trash2, Users, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { DietaryBadge } from "@/components/dietary-badge"
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
  if (!recipe) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{recipe.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={recipe.image}
              alt={recipe.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <StarRating rating={recipe.average_rating ?? 0} size="md" />
                <span className="text-sm text-muted-foreground">
                  {recipe.average_rating?.toFixed(1) ?? "No ratings"} · {recipe.ratings_count} ratings
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatPrepTime(recipe.prep_time_minutes)}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {recipe.servings ?? "?"} servings
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={recipe.is_favorite ? "default" : "outline"}
                size="icon"
                onClick={() => onToggleFavorite(recipe)}
              >
                <Heart className={cn("h-4 w-4", recipe.is_favorite && "fill-current")} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to List
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {lists.length === 0 ? (
                    <DropdownMenuItem disabled>No lists available</DropdownMenuItem>
                  ) : (
                    lists.map((list) => (
                      <DropdownMenuItem
                        key={list.id}
                        onClick={() => onAddToList(list.id, recipe)}
                      >
                        {list.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Your rating</span>
              <StarRating
                rating={recipe.user_rating ?? 0}
                size="md"
                interactive
                onChange={(rating) => onRateRecipe(recipe.id, rating)}
              />
              {recipe.user_rating && (
                <Button variant="ghost" size="sm" onClick={() => onRemoveRating(recipe.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {recipe.dietaryOptions.map((option) => (
                <DietaryBadge key={option} type={option} />
              ))}
              {recipe.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          <p className="text-muted-foreground">{recipe.description}</p>

          <div>
            <h4 className="font-medium mb-2">Ingredients</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ingredient, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{ingredient.amount}</span>
                  <span>{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Instructions</h4>
            <ol className="space-y-2">
              {recipe.instructions.map((instruction, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
