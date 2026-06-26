"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { ArrowUpAZ, Leaf, ListOrdered, Search, Settings, ShoppingCart, Star, User, BookOpen, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RecipeDialog } from "@/features/recipes/recipe-dialog"
import { ListDialog } from "@/features/lists/list-dialog"
import { ProfileDialog } from "@/features/profile/profile-dialog"
import { SettingsDialog } from "@/features/settings/settings-dialog"
import { CreateListDialog } from "@/features/lists/create-list-dialog"
import { RecipeFilter, ActiveFilters } from "@/components/recipe-filter"
import { ListsTab } from "@/features/home/components/lists-tab"
import { RecipesTab } from "@/features/home/components/recipes-tab"
import { useMainPage } from "@/hooks/use-main-page"
import type { RecipeSortOrder } from "@/hooks/use-main-page-state"

const recipeSortLabels: Record<RecipeSortOrder, string> = {
  default: "Default",
  alphabetical: "Alphabetical",
  ratings: "Ratings",
}

export default function MainPage() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const {
    activeTab,
    setActiveTab,
    listSearchQuery,
    setListSearchQuery,
    recipeSearchQuery,
    setRecipeSearchQuery,
    recipeSortOrder,
    setRecipeSortOrder,
    lists,
    listItems,
    savedRecipes,
    events,
    mealPlanEntries,
    createMealPlanEntry,
    tagGroups,
    recipeFilters,
    setRecipeFilters,
    selectedRecipe,
    selectedRecipeContext,
    openRecipe,
    updateSelectedRecipeServings,
    recipeDialogOpen,
    setRecipeDialogOpen,
    selectedList,
    setSelectedList,
    listDialogOpen,
    setListDialogOpen,
    profileOpen,
    setProfileOpen,
    settingsOpen,
    setSettingsOpen,
    createListOpen,
    setCreateListOpen,
    editingList,
    setEditingList,
    isSavingUser,
    saveUserAllergies,
    user,
    allRecipes,
    recipes,
    filteredRecipes,
    filteredLists,
    hasActiveRecipeQuery,
    isLoadingRecipes,
    recipesError,
    createList,
    handleCreateList,
    handleDeleteList,
    handleToggleItem,
    handleAddItem,
    handleDeleteItem,
    handleDeleteItems,
    handleUpdateItem,
    handleAddRecipeToList,
    handleSaveRecipe,
    handleSaveRecipeNotes,
    handleRemoveSavedRecipeCompletely,
    handleRemoveRecipeFromList,
    handleRemoveMealPlanRecipeCompletely,
    handleViewRecipeFromList,
    handleToggleFavorite,
    handleRateRecipe,
    handleRemoveRating,
    handlePersistRecipeServings,
    getLinkedRecipes,
    updateMealPlanEntry,
    deleteMealPlanEntry,
    handleChangeListColor,
    handleChangeListDate,
    createEvent,
    updateEvent,
    deleteEvent,
    handleLogout,
  } = useMainPage()

  useEffect(() => {
    if (isAuthLoaded && !isSignedIn) {
      router.replace("/login")
    }
  }, [isAuthLoaded, isSignedIn, router])

  if (!isAuthLoaded || !isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Cookwise</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

            <div className="flex gap-2 w-full sm:w-auto">
              {activeTab === "recipes" && (
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes..."
                    value={recipeSearchQuery}
                    onChange={(e) => setRecipeSearchQuery(e.target.value)}
                    className="h-10 rounded-xl border-border/70 bg-card pl-9 shadow-none placeholder:text-muted-foreground/80"
                  />
                </div>
              )}
              {activeTab === "recipes" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl border-border/70 bg-background px-3 text-sm shadow-none hover:bg-accent/50"
                    >
                      <ListOrdered className="h-4 w-4" />
                      Order
                      <span className="hidden sm:inline text-muted-foreground">
                        {recipeSortLabels[recipeSortOrder]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setRecipeSortOrder("default")}>
                      <ListOrdered className="h-4 w-4 mr-2" />
                      Default
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRecipeSortOrder("alphabetical")}>
                      <ArrowUpAZ className="h-4 w-4 mr-2" />
                      Alphabetical
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRecipeSortOrder("ratings")}>
                      <Star className="h-4 w-4 mr-2" />
                      Ratings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {activeTab === "recipes" && (
                <RecipeFilter
                  filters={recipeFilters}
                  availableTags={tagGroups}
                  onFiltersChange={setRecipeFilters}
                />
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeTab === "recipes" && (
            <ActiveFilters
              filters={recipeFilters}
              availableTags={tagGroups}
              onFiltersChange={setRecipeFilters}
            />
          )}

          <TabsContent value="lists" className="mt-0">
            <ListsTab
              lists={filteredLists}
              allLists={lists}
              recipes={allRecipes}
              savedRecipes={savedRecipes}
              events={events}
              mealPlanEntries={mealPlanEntries}
              searchQuery={listSearchQuery}
              onSearchQueryChange={setListSearchQuery}
              onCreateList={() => setCreateListOpen(true)}
              onOpenList={(list) => {
                setSelectedList(list)
                setListDialogOpen(true)
              }}
              onOpenRecipe={(recipe, context) => {
                openRecipe(recipe, context)
              }}
              onEditList={(list) => {
                setEditingList(list)
                setCreateListOpen(true)
              }}
              onDeleteList={handleDeleteList}
              onCreateMealPlanEntry={createMealPlanEntry}
              onUpdateMealPlanEntry={updateMealPlanEntry}
              onUnplanMealPlanEntry={deleteMealPlanEntry}
              onDeleteMealPlanEntry={handleRemoveMealPlanRecipeCompletely}
              onDeleteSavedRecipe={handleRemoveSavedRecipeCompletely}
              onCreateEvent={createEvent}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
              onCreateListForEvent={createList}
            />
          </TabsContent>

          <TabsContent value="recipes" className="mt-0">
            <RecipesTab
              recipes={filteredRecipes}
              isLoading={isLoadingRecipes}
              error={recipesError}
              hasActiveQuery={hasActiveRecipeQuery}
              onFavoriteToggle={handleToggleFavorite}
              onOpenRecipe={(recipe) => {
                openRecipe(recipe)
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <RecipeDialog
        key={`${selectedRecipe?.id ?? "recipe-dialog"}:${selectedRecipe?.servings ?? "default"}:${recipeDialogOpen ? "open" : "closed"}`}
        recipe={selectedRecipe}
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
        lists={lists}
        servingsContext={selectedRecipeContext}
        onAddToList={handleAddRecipeToList}
        onSaveRecipe={handleSaveRecipe}
        onSaveNotes={handleSaveRecipeNotes}
        onUpdateServings={handlePersistRecipeServings}
        onServingsPersisted={updateSelectedRecipeServings}
        onRateRecipe={handleRateRecipe}
        onRemoveRating={handleRemoveRating}
      />

      <ListDialog
        list={selectedList}
        items={selectedList ? listItems[selectedList.id] || [] : []}
        linkedRecipes={selectedList ? getLinkedRecipes(selectedList) : []}
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onToggleItem={handleToggleItem}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onDeleteItems={handleDeleteItems}
        onUpdateItem={handleUpdateItem}
        onViewRecipe={handleViewRecipeFromList}
        onRemoveRecipe={handleRemoveRecipeFromList}
        onChangeColor={handleChangeListColor}
        onChangeDate={handleChangeListDate}
      />

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onSave={saveUserAllergies}
        isSavingUser={isSavingUser}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <CreateListDialog
        open={createListOpen}
        onOpenChange={(open) => {
          setCreateListOpen(open)
          if (!open) setEditingList(null)
        }}
        onCreate={handleCreateList}
        editingList={editingList}
      />
    </div>
  )
}
