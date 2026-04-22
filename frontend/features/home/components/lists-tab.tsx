"use client"

import { Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShopListBanner, type ShopList } from "@/components/shoplist-banner"

interface ListsTabProps {
  lists: ShopList[]
  onCreateList: () => void
  onOpenList: (list: ShopList) => void
  onEditList: (list: ShopList) => void
  onDeleteList: (listId: string) => void
}

export function ListsTab({
  lists,
  onCreateList,
  onOpenList,
  onEditList,
  onDeleteList,
}: ListsTabProps) {
  if (lists.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No lists yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first shopping list to get started
        </p>
        <Button onClick={onCreateList}>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {lists.map((list) => (
        <ShopListBanner
          key={list.id}
          list={list}
          onClick={() => onOpenList(list)}
          onEdit={() => onEditList(list)}
          onDelete={() => onDeleteList(list.id)}
        />
      ))}
    </div>
  )
}
