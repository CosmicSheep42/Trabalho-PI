"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { RecipeCard, type Recipe } from "@/components/recipe-card"
import { ShopListBanner, type ShopList } from "@/components/shoplist-banner"
import { RecipeDialog } from "@/components/recipe-dialog"
import { ListDialog, type ListItem } from "@/components/list-dialog"
import { ProfileDialog } from "@/components/profile-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { CreateListDialog } from "@/components/create-list-dialog"
import { RecipeFilter, ActiveFilters } from "@/components/recipe-filter"
import { mockListItems, mockLists, mockRecipes, mockUser } from "@/data/mock"

export default function MainPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("lists")
  const [searchQuery, setSearchQuery] = useState("")
  const [lists, setLists] = useState<ShopList[]>(mockLists)
  const [listItems, setListItems] = useState<Record<string, ListItem[]>>(mockListItems)
  const [recipes] = useState<Recipe[]>(mockRecipes)
  const [favoriteRecipes, setFavoriteRecipes] = useState<Set<string>>(new Set())

  // Filter states
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)

  // Dialog states
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<ShopList | null>(null)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createListOpen, setCreateListOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShopList | null>(null)

  const user = mockUser

  // Filter recipes based on search, tags, and rating
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => recipe.tags.includes(tag))
    
    const matchesRating = !minRating || recipe.rating >= minRating

    return matchesSearch && matchesTags && matchesRating
  })

  // Filter lists based on search
  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handlers
  const handleCreateList = (name: string, color: string) => {
    if (editingList) {
      setLists((prev) =>
        prev.map((l) => (l.id === editingList.id ? { ...l, name, color } : l))
      )
      setEditingList(null)
    } else {
      const newList: ShopList = {
        id: Date.now().toString(),
        name,
        color,
        itemCount: 0,
        linkedRecipeIds: [],
      }
      setLists((prev) => [...prev, newList])
      setListItems((prev) => ({ ...prev, [newList.id]: [] }))
    }
  }

  const handleDeleteList = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId))
    setListItems((prev) => {
      const { [listId]: _, ...rest } = prev
      return rest
    })
  }

  const handleToggleItem = (itemId: string) => {
    if (!selectedList) return
    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }))
  }

  const handleAddItem = (name: string, amount: string) => {
    if (!selectedList) return
    const newItem: ListItem = {
      id: Date.now().toString(),
      name,
      amount,
      checked: false,
    }
    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: [...prev[selectedList.id], newItem],
    }))
    setLists((prev) =>
      prev.map((l) =>
        l.id === selectedList.id ? { ...l, itemCount: l.itemCount + 1 } : l
      )
    )
  }

  const handleDeleteItem = (itemId: string) => {
    if (!selectedList) return
    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].filter((item) => item.id !== itemId),
    }))
    setLists((prev) =>
      prev.map((l) =>
        l.id === selectedList.id ? { ...l, itemCount: l.itemCount - 1 } : l
      )
    )
  }

  const handleDeleteItems = (itemIds: string[]) => {
    if (!selectedList) return
    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].filter((item) => !itemIds.includes(item.id)),
    }))
    setLists((prev) =>
      prev.map((l) =>
        l.id === selectedList.id ? { ...l, itemCount: l.itemCount - itemIds.length } : l
      )
    )
  }

  const handleUpdateItem = (itemId: string, name: string, amount: string) => {
    if (!selectedList) return
    setListItems((prev) => ({
      ...prev,
      [selectedList.id]: prev[selectedList.id].map((item) =>
        item.id === itemId ? { ...item, name, amount } : item
      ),
    }))
  }

  const handleAddRecipeToList = (listId: string, recipe: Recipe) => {
    const newItems = recipe.ingredients.map((ing, i) => ({
      id: `${Date.now()}-${i}`,
      name: ing.name,
      amount: ing.amount,
      checked: false,
    }))
    setListItems((prev) => ({
      ...prev,
      [listId]: [...(prev[listId] || []), ...newItems],
    }))
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              itemCount: l.itemCount + newItems.length,
              linkedRecipeIds: l.linkedRecipeIds?.includes(recipe.id)
                ? l.linkedRecipeIds
                : [...(l.linkedRecipeIds || []), recipe.id],
            }
          : l
      )
    )
    setRecipeDialogOpen(false)
  }

  const handleRemoveRecipeFromList = (recipeId: string) => {
    if (!selectedList) return
    setLists((prev) =>
      prev.map((l) =>
        l.id === selectedList.id
          ? {
              ...l,
              linkedRecipeIds: l.linkedRecipeIds?.filter((id) => id !== recipeId) || [],
            }
          : l
      )
    )
    // Update selectedList state to reflect the change
    setSelectedList((prev) =>
      prev
        ? {
            ...prev,
            linkedRecipeIds: prev.linkedRecipeIds?.filter((id) => id !== recipeId) || [],
          }
        : null
    )
  }

  const handleViewRecipeFromList = (recipe: Recipe) => {
    setListDialogOpen(false)
    setSelectedRecipe(recipe)
    setRecipeDialogOpen(true)
  }

  const handleToggleFavorite = (recipeId: string) => {
    setFavoriteRecipes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId)
      } else {
        newSet.add(recipeId)
      }
      return newSet
    })
  }

  const getLinkedRecipes = (list: ShopList): Recipe[] => {
    if (!list.linkedRecipeIds) return []
    return recipes.filter((r) => list.linkedRecipeIds?.includes(r.id))
  }

  const handleChangeListColor = (color: string) => {
    if (!selectedList) return
    setLists((prev) =>
      prev.map((l) => (l.id === selectedList.id ? { ...l, color } : l))
    )
    setSelectedList((prev) => (prev ? { ...prev, color } : null))
  }

  const handleLogout = () => {
    router.push("/login")
  }

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
            {filteredLists.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No lists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first shopping list to get started
                </p>
                <Button onClick={() => setCreateListOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create List
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLists.map((list) => (
                  <ShopListBanner
                    key={list.id}
                    list={list}
                    onClick={() => {
                      setSelectedList(list)
                      setListDialogOpen(true)
                    }}
                    onEdit={() => {
                      setEditingList(list)
                      setCreateListOpen(true)
                    }}
                    onDelete={() => handleDeleteList(list.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipes" className="mt-0">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No recipes found</h3>
                <p className="text-muted-foreground">
                  Try a different search term or adjust your filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={favoriteRecipes.has(recipe.id)}
                    onFavoriteToggle={handleToggleFavorite}
                    onClick={() => {
                      setSelectedRecipe(recipe)
                      setRecipeDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
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
