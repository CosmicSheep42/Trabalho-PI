"use client"

import { ArrowUpAZ, BookOpen, ListOrdered, Search, ShoppingCart, Star } from "lucide-react"
import { ActiveFilters, RecipeFilter } from "@/components/recipe-filter"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListsTab } from "@/features/home/components/lists-tab"
import { RecipesTab } from "@/features/home/components/recipes-tab"
import type { HomeScreenModel } from "@/features/home/model/types"
import type { RecipeSortOrder } from "@/hooks/use-main-page-state"

const recipeSortLabels: Record<RecipeSortOrder, string> = {
  default: "Default",
  alphabetical: "Alphabetical",
  ratings: "Ratings",
}

interface MainPageContentProps {
  screen: HomeScreenModel
}

export function MainPageContent({ screen }: MainPageContentProps) {
  const { lists, profile, recipes, shell, social } = screen
  return (
    <main className="container mx-auto px-4 py-6">
      <Tabs value={shell.activeTab} onValueChange={shell.setActiveTab} className="gap-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <TabsList className="bg-secondary">
            <TabsTrigger value="lists" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Lists
            </TabsTrigger>
            <TabsTrigger value="recipes" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Recipes
            </TabsTrigger>
          </TabsList>

          <div className="flex w-full gap-2 sm:w-auto">
            {shell.activeTab === "recipes" ? (
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={recipes.recipeSearchQuery}
                  onChange={(event) => recipes.setRecipeSearchQuery(event.target.value)}
                  className="h-10 rounded-xl border-border/70 bg-card pl-9 shadow-none placeholder:text-muted-foreground/80"
                />
              </div>
            ) : null}
            {shell.activeTab === "recipes" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-border/70 bg-background px-3 text-sm shadow-none hover:bg-accent/50"
                  >
                      <ListOrdered className="h-4 w-4" />
                      Order
                      <span className="hidden text-muted-foreground sm:inline">
                      {recipeSortLabels[recipes.recipeSortOrder]}
                      </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => recipes.setRecipeSortOrder("default")}>
                    <ListOrdered className="mr-2 h-4 w-4" />
                    Default
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => recipes.setRecipeSortOrder("alphabetical")}>
                    <ArrowUpAZ className="mr-2 h-4 w-4" />
                    Alphabetical
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => recipes.setRecipeSortOrder("ratings")}>
                    <Star className="mr-2 h-4 w-4" />
                    Ratings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {shell.activeTab === "recipes" ? (
              <RecipeFilter
                filters={recipes.recipeFilters}
                availableTags={recipes.tagGroups}
                onFiltersChange={recipes.setRecipeFilters}
              />
            ) : null}
          </div>
        </div>

        {shell.activeTab === "recipes" ? (
          <ActiveFilters
            filters={recipes.recipeFilters}
            availableTags={recipes.tagGroups}
            onFiltersChange={recipes.setRecipeFilters}
          />
        ) : null}

        <TabsContent value="lists" className="mt-0">
            <ListsTab
            lists={lists.filteredLists}
            allLists={lists.lists}
            recipes={recipes.allRecipes}
            savedRecipes={lists.savedRecipes}
            events={lists.events}
            currentUserId={profile.user.id}
            availableFriends={social.friends}
            availableGroups={social.friendGroups}
            mealPlanEntries={lists.mealPlanEntries}
            searchQuery={lists.searchQuery}
            onSearchQueryChange={lists.setSearchQuery}
            onCreateList={lists.createListDialog}
            onOpenList={lists.openList}
            onOpenRecipe={(recipe, context) => {
              recipes.openRecipe(recipe, context)
            }}
            onEditList={lists.editList}
            onDeleteList={lists.actions.deleteList}
            onCreateMealPlanEntry={lists.createMealPlanEntry}
            onUpdateMealPlanEntry={lists.updateMealPlanEntry}
            onUnplanMealPlanEntry={lists.deleteMealPlanEntry}
            onDeleteMealPlanEntry={lists.actions.removeMealPlanRecipeCompletely}
            onDeleteSavedRecipe={lists.actions.removeSavedRecipeCompletely}
            onCreateEvent={lists.createEvent}
            onUpdateEvent={lists.updateEvent}
            onDeleteEvent={lists.deleteEvent}
            onShareEventWithFriend={lists.shareEventWithFriend}
            onShareEventWithGroup={lists.shareEventWithGroup}
            onRemoveEventCollaborator={lists.removeEventCollaborator}
            onCreateListForEvent={lists.createList}
          />
        </TabsContent>

        <TabsContent value="recipes" className="mt-0">
          <RecipesTab
            recipes={recipes.filteredRecipes}
            isLoading={recipes.isLoadingRecipes}
            error={recipes.recipesError}
            hasActiveQuery={recipes.hasActiveRecipeQuery}
            onFavoriteToggle={recipes.actions.toggleFavorite}
            onOpenRecipe={(recipe) => {
              recipes.openRecipe(recipe)
            }}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
