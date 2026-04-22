"use client"

import Image from "next/image"
import { Clock, Users, Plus } from "lucide-react"
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
import { DietaryBadge } from "./dietary-badge"
import { StarRating } from "./star-rating"
import type { Recipe } from "./recipe-card"
import type { ShopList } from "./shoplist-banner"

interface RecipeDialogProps {
  recipe: Recipe | null
  open: boolean
  onOpenChange: (open: boolean) => void
  lists: ShopList[]
  onAddToList: (listId: string, recipe: Recipe) => void
}

export function RecipeDialog({
  recipe,
  open,
  onOpenChange,
  lists,
  onAddToList,
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
            <div className="flex items-center gap-4">
              <StarRating rating={recipe.rating} size="md" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {recipe.prepTime}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {recipe.servings} servings
              </div>
            </div>
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

          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <DietaryBadge key={tag} type={tag as any} />
            ))}
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
