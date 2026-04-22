"use client"

import { Leaf, Plus, User, Settings, Search, ShoppingCart, BookOpen, LogOut } from "lucide-react"
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

export default function MainPage() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    lists,
    listItems,
    favoriteRecipes,
    selectedTags,
    minRating,
    setSelectedTags,
    setMinRating,
    selectedRecipe,
    setSelectedRecipe,
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
    user,
    filteredRecipes,
    filteredLists,
    handleCreateList,
    handleDeleteList,
    handleToggleItem,
    handleAddItem,
    handleDeleteItem,
    handleDeleteItems,
    handleUpdateItem,
    handleAddRecipeToList,
    handleRemoveRecipeFromList,
    handleViewRecipeFromList,
    handleToggleFavorite,
    getLinkedRecipes,
    handleChangeListColor,
    handleLogout,
  } = useMainPage()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Placeholder</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name.charAt(0)}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "lists" ? "Search lists..." : "Search recipes..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {activeTab === "lists" && (
                <Button onClick={() => setCreateListOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              )}
              {activeTab === "recipes" && (
                <RecipeFilter
                  selectedTags={selectedTags}
                  minRating={minRating}
                  onTagsChange={setSelectedTags}
                  onRatingChange={setMinRating}
                />
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeTab === "recipes" && (
            <ActiveFilters
              selectedTags={selectedTags}
              minRating={minRating}
              onTagsChange={setSelectedTags}
              onRatingChange={setMinRating}
            />
          )}

          <TabsContent value="lists" className="mt-0">
            <ListsTab
              lists={filteredLists}
              onCreateList={() => setCreateListOpen(true)}
              onOpenList={(list) => {
                setSelectedList(list)
                setListDialogOpen(true)
              }}
              onEditList={(list) => {
                setEditingList(list)
                setCreateListOpen(true)
              }}
              onDeleteList={handleDeleteList}
            />
          </TabsContent>

          <TabsContent value="recipes" className="mt-0">
            <RecipesTab
              recipes={filteredRecipes}
              favoriteRecipes={favoriteRecipes}
              onFavoriteToggle={handleToggleFavorite}
              onOpenRecipe={(recipe) => {
                setSelectedRecipe(recipe)
                setRecipeDialogOpen(true)
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <RecipeDialog
        recipe={selectedRecipe}
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
        lists={lists}
        onAddToList={handleAddRecipeToList}
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
      />

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onSave={(data) => console.log("Save profile:", data)}
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
