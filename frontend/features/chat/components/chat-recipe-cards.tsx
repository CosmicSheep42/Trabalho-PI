"use client"

import Image from "next/image"
import { Clock3, Heart, Star, Users } from "lucide-react"
import type { ChatRecipeCardData, ExecutedChatToolCall } from "@/features/chat/types"
import { formatPrepTime } from "@/features/recipes/types"

interface ChatRecipeCardsProps {
  executedToolCalls: ExecutedChatToolCall[]
  onRecipeClick: (recipeId: string) => void
}

function isRecipeCardsToolCall(toolCall: ExecutedChatToolCall): boolean {
  if (!toolCall.success) {
    return false
  }

  if (toolCall.name !== "search_recipes") {
    return false
  }

  return toolCall.data.type === "recipe_cards" && Array.isArray(toolCall.data.recipes)
}

function getRecipeCards(toolCall: ExecutedChatToolCall): ChatRecipeCardData[] {
  if (!isRecipeCardsToolCall(toolCall)) {
    return []
  }

  return toolCall.data.recipes as ChatRecipeCardData[]
}

function buildBadgeText(recipe: ChatRecipeCardData) {
  const badges: string[] = []

  if (recipe.vegan) badges.push("Vegan")
  else if (recipe.vegetarian) badges.push("Vegetarian")
  if (recipe.gluten_free) badges.push("Gluten free")
  if (recipe.lactose_free) badges.push("Lactose free")

  const primaryTag = recipe.tags[0]?.name
  if (primaryTag) {
    badges.push(primaryTag)
  }

  return badges.slice(0, 3)
}

export function ChatRecipeCards({ executedToolCalls, onRecipeClick }: ChatRecipeCardsProps) {
  const recipeCards = executedToolCalls.flatMap(getRecipeCards)
  if (recipeCards.length === 0) {
    return null
  }

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {recipeCards.map((recipe) => {
        const badges = buildBadgeText(recipe)

        return (
          <button
            key={recipe.id}
            type="button"
            className="group overflow-hidden rounded-2xl border bg-background text-left transition-transform hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => onRecipeClick(String(recipe.id))}
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={recipe.image}
                alt={recipe.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, 280px"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="line-clamp-1 text-sm font-semibold text-white">{recipe.name}</p>
              </div>
            </div>

            <div className="space-y-3 p-3">
              <p className="line-clamp-2 text-xs text-muted-foreground">{recipe.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatPrepTime(recipe.prep_time_minutes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {recipe.servings ?? "?"} servings
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                  {recipe.average_rating?.toFixed(1) ?? "New"}
                </span>
              </div>

              {badges.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((badge) => (
                    <span key={badge} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{recipe.ratings_count} rating{recipe.ratings_count === 1 ? "" : "s"}</span>
                {recipe.is_favorite ? (
                  <span className="inline-flex items-center gap-1 text-rose-500">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    Favorite
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
