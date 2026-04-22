"use client"

import { MoreHorizontal, Trash2, Edit2, BookOpen, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ShopList {
  id: string
  name: string
  color: string
  itemCount: number
  linkedRecipeIds?: string[]
  date?: string // ISO date string, optional
}

const colorClasses: Record<string, string> = {
  green: "bg-green-800/30 border-green-700/50",
  blue: "bg-blue-800/30 border-blue-700/50",
  purple: "bg-purple-800/30 border-purple-700/50",
  orange: "bg-orange-800/30 border-orange-700/50",
  pink: "bg-pink-800/30 border-pink-700/50",
  cyan: "bg-cyan-800/30 border-cyan-700/50",
  amber: "bg-amber-800/30 border-amber-700/50",
  rose: "bg-rose-800/30 border-rose-700/50",
}

interface ShopListBannerProps {
  list: ShopList
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ShopListBanner({ list, onClick, onEdit, onDelete }: ShopListBannerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between p-4 rounded-lg border cursor-pointer",
        "hover:border-primary/50 transition-all duration-200",
        colorClasses[list.color] || colorClasses.green
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-medium text-foreground">{list.name}</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span>{list.itemCount} {list.itemCount === 1 ? "item" : "items"}</span>
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
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
  )
}
