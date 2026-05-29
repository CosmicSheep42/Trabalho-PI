"use client"

import * as React from "react"
import { AlertCircle, BookOpen, Heart, RotateCcw, Search, Sparkles, Star } from "lucide-react"
import { RecipeCard } from "@/components/recipe-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Recipe } from "@/features/recipes/types"

interface RecipesTabProps {
  recipes: Recipe[]
  isLoading?: boolean
  error?: string | null
  hasActiveQuery?: boolean
  onFavoriteToggle: (recipe: Recipe) => void
  onOpenRecipe: (recipe: Recipe) => void
}

interface RecipeSection {
  id: string
  title: string
  recipes: Recipe[]
  icon: React.ComponentType<{ className?: string }>
}

function RecipesLoadingState() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 4 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, cardIndex) => (
              <div key={cardIndex} className="w-[280px] shrink-0 overflow-hidden rounded-xl border border-border bg-card sm:w-[320px]">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-3 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function sortByTopRated(recipes: Recipe[]) {
  return [...recipes].sort((left, right) => {
    const leftRating = left.average_rating ?? -1
    const rightRating = right.average_rating ?? -1

    if (rightRating !== leftRating) {
      return rightRating - leftRating
    }

    if (right.ratings_count !== left.ratings_count) {
      return right.ratings_count - left.ratings_count
    }

    return left.name.localeCompare(right.name)
  })
}

function sortByRecentlyAdded(recipes: Recipe[]) {
  return [...recipes].sort((left, right) => Number(right.id) - Number(left.id))
}

function sortByMakeAgain(recipes: Recipe[]) {
  return [...recipes].sort((left, right) => {
    const leftRating = left.user_rating ?? 0
    const rightRating = right.user_rating ?? 0

    if (rightRating !== leftRating) {
      return rightRating - leftRating
    }

    if (left.is_favorite !== right.is_favorite) {
      return Number(right.is_favorite) - Number(left.is_favorite)
    }

    return (right.average_rating ?? 0) - (left.average_rating ?? 0)
  })
}

function buildRecipeSections(recipes: Recipe[]): RecipeSection[] {
  const favorites = sortByMakeAgain(recipes.filter((recipe) => recipe.is_favorite))
  const topRated = sortByTopRated(recipes.filter((recipe) => recipe.ratings_count > 0))
  const recentlyAdded = sortByRecentlyAdded(recipes)
  const makeAgain = sortByMakeAgain(
    recipes.filter((recipe) => recipe.user_rating !== null || recipe.is_favorite)
  )

  return [
    {
      id: "top-rated",
      title: "Top Rated",
      recipes: topRated,
      icon: Star,
    },
    {
      id: "recently-added",
      title: "Recently Added",
      recipes: recentlyAdded,
      icon: Sparkles,
    },
    {
      id: "make-again",
      title: "Make Again",
      recipes: makeAgain,
      icon: RotateCcw,
    },
    {
      id: "favorites",
      title: "Favorites",
      recipes: favorites,
      icon: Heart,
    },
  ]
}

function RecipesTabComponent({
  recipes,
  isLoading = false,
  error = null,
  hasActiveQuery = false,
  onFavoriteToggle,
  onOpenRecipe,
}: RecipesTabProps) {
  const sections = React.useMemo(() => buildRecipeSections(recipes), [recipes])
  const dragStateRef = React.useRef({
    pointerDown: false,
    startX: 0,
    startY: 0,
    didDrag: false,
  })

  if (isLoading) {
    return <RecipesLoadingState />
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive/60" />
        <h3 className="mb-2 text-lg font-medium">Could not load recipes</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-medium">No recipes found</h3>
        <p className="text-muted-foreground">
          Try a different search term or adjust your filters
        </p>
      </div>
    )
  }

  if (hasActiveQuery) {
    return (
      <Card className="overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b py-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            Matching Recipes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFavoriteToggle={onFavoriteToggle}
                onClick={() => onOpenRecipe(recipe)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const handlePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current.pointerDown = true
    dragStateRef.current.startX = event.clientX
    dragStateRef.current.startY = event.clientY
    dragStateRef.current.didDrag = false
  }

  const handlePointerMoveCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.pointerDown || dragStateRef.current.didDrag) {
      return
    }

    const deltaX = Math.abs(event.clientX - dragStateRef.current.startX)
    const deltaY = Math.abs(event.clientY - dragStateRef.current.startY)

    if (deltaX > 6 || deltaY > 6) {
      dragStateRef.current.didDrag = true
    }
  }

  const resetDragState = () => {
    dragStateRef.current.pointerDown = false
    window.setTimeout(() => {
      dragStateRef.current.didDrag = false
    }, 0)
  }

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.didDrag) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    resetDragState()
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card
          id={`recipes-section-${section.id}`}
          key={section.id}
          className="overflow-hidden py-0 shadow-sm"
        >
          <CardHeader className="border-b py-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <section.icon className="h-5 w-5 shrink-0 text-primary" />
              {section.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="px-10 sm:px-12"
            >
              <CarouselContent
                className="-ml-3 cursor-grab select-none active:cursor-grabbing"
                onPointerDownCapture={handlePointerDownCapture}
                onPointerMoveCapture={handlePointerMoveCapture}
                onPointerUpCapture={resetDragState}
                onPointerCancelCapture={resetDragState}
                onPointerOutCapture={resetDragState}
                onClickCapture={handleClickCapture}
              >
                {section.recipes.length > 0 ? (
                  section.recipes.map((recipe) => (
                    <CarouselItem
                      key={recipe.id}
                      className="basis-[88%] pl-3 sm:basis-[360px] lg:basis-[340px] xl:basis-[360px]"
                    >
                      <RecipeCard
                        recipe={recipe}
                        onFavoriteToggle={onFavoriteToggle}
                        onClick={() => onOpenRecipe(recipe)}
                      />
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem className="basis-full pl-3">
                    <div className="rounded-2xl border border-dashed border-border bg-muted/15 px-5 py-10 text-sm text-muted-foreground">
                      No recipes match this section yet.
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              <CarouselPrevious className="left-0 top-[calc(50%-0.75rem)] border-border bg-background" />
              <CarouselNext className="right-0 top-[calc(50%-0.75rem)] border-border bg-background" />
            </Carousel>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export const RecipesTab = React.memo(RecipesTabComponent)
