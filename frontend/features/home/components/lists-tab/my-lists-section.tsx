"use client"

import { Pin, Plus, Search, ShoppingCart } from "lucide-react"
import { ShopListBanner, type ShopList } from "@/components/shoplist-banner"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MyListsSectionProps {
  lists: ShopList[]
  pinnedListIds: string[]
  searchQuery: string
  onCreateList: () => void
  onDeleteList: (listId: string) => void
  onEditList: (list: ShopList) => void
  onOpenList: (list: ShopList) => void
  onSearchQueryChange: (value: string) => void
  onTogglePin: (listId: string) => void
}

export function MyListsSection({
  lists,
  pinnedListIds,
  searchQuery,
  onCreateList,
  onDeleteList,
  onEditList,
  onOpenList,
  onSearchQueryChange,
  onTogglePin,
}: MyListsSectionProps) {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="min-h-16 border-b py-3">
        <CardTitle className="flex items-center gap-2 text-xl leading-none">
          <Pin className="h-6 w-6 shrink-0 text-primary" />
          Lists
        </CardTitle>
        <CardAction className="static col-auto row-auto self-center justify-self-stretch sm:justify-self-end">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search lists..."
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={onCreateList} className="shrink-0">
              <Plus className="mr-1 h-4" />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[32rem]">
          {lists.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {lists.map((list) => (
                <ShopListBanner
                  key={list.id}
                  list={list}
                  pinned={pinnedListIds.includes(list.id)}
                  onClick={() => onOpenList(list)}
                  onTogglePin={() => onTogglePin(list.id)}
                  onEdit={() => onEditList(list)}
                  onDelete={() => onDeleteList(list.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center px-6 text-center">
              <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No lists yet</h3>
              <p className="mb-4 text-muted-foreground">
                Create a shopping list or wait for a friend to share one with you.
              </p>
              <Button onClick={onCreateList}>
                <Plus className="mr-2 h-4 w-4" />
                Create List
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
