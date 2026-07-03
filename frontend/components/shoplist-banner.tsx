"use client"

import { MoreHorizontal, Trash2, Edit2, BookOpen, Calendar, Pin } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ListMemberUser } from "@/features/lists/types"

export interface ShopList {
  id: string
  name: string
  color: string
  itemCount: number
  owner: ListMemberUser
  collaborators: ListMemberUser[]
  linkedRecipeIds?: string[]
  listRecipes?: { recipeId: string; servings: number | null }[]
  date?: string // ISO date string, optional
}

const colorClasses: Record<string, string> = {
  green: "bg-emerald-100/90 border-emerald-300/70 dark:bg-emerald-950/55 dark:border-emerald-800/70",
  blue: "bg-sky-100/90 border-sky-300/70 dark:bg-sky-950/55 dark:border-sky-800/70",
  purple: "bg-violet-100/90 border-violet-300/70 dark:bg-violet-950/55 dark:border-violet-800/70",
  orange: "bg-orange-100/90 border-orange-300/70 dark:bg-orange-950/55 dark:border-orange-800/70",
  pink: "bg-pink-100/90 border-pink-300/70 dark:bg-pink-950/55 dark:border-pink-800/70",
  cyan: "bg-teal-100/90 border-teal-300/70 dark:bg-teal-950/55 dark:border-teal-800/70",
  amber: "bg-amber-100/90 border-amber-300/70 dark:bg-amber-950/55 dark:border-amber-800/70",
  rose: "bg-rose-100/90 border-rose-300/70 dark:bg-rose-950/55 dark:border-rose-800/70",
}

interface ShopListBannerProps {
  list: ShopList
  pinned?: boolean
  onClick?: () => void
  onTogglePin?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ShopListBanner({
  list,
  pinned = false,
  onClick,
  onTogglePin,
  onEdit,
  onDelete,
}: ShopListBannerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 rounded-lg border p-4 cursor-pointer",
        "hover:border-primary/50 transition-all duration-200",
        pinned && "ring-1 ring-primary/40",
        colorClasses[list.color] || colorClasses.green
      )}
      onClick={onClick}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-foreground">{list.name}</h3>
          {pinned && (
            <Badge variant="secondary" className="gap-1 bg-background/70">
              <Pin className="h-3 w-3" />
              Pinned
            </Badge>
          )}
          {list.collaborators.length > 0 && (
            <Badge variant="secondary" className="bg-background/70">
              Shared
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span>{list.itemCount} {list.itemCount === 1 ? "item" : "items"}</span>
          {list.collaborators.length > 0 && (
            <span className="truncate">Owner: @{list.owner.username}</span>
          )}
          {list.linkedRecipeIds && list.linkedRecipeIds.length > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {list.linkedRecipeIds.length} {list.linkedRecipeIds.length === 1 ? "recipe" : "recipes"}
            </span>
          )}
          {list.date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(list.date).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric",
                year: new Date(list.date).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
              })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", pinned && "text-primary")}
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin?.()
          }}
          aria-label={pinned ? "Unpin list" : "Pin list"}
        >
          <Pin className={cn("h-4 w-4", pinned && "fill-current")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
