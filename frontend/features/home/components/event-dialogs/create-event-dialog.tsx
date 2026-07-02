"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ShopList } from "@/components/shoplist-banner"
import { eventIconOptions, inlineListColorOptions } from "@/features/home/components/lists-tab/constants"
import type { EventFormState, EventInlineListFormState } from "@/features/home/components/lists-tab/types"

interface CreateEventDialogProps {
  allLists: ShopList[]
  eventDialogOpen: boolean
  eventForm: EventFormState
  eventInlineListForm: EventInlineListFormState
  onCreateEvent: () => Promise<void>
  onCreateInlineListForEvent: () => Promise<void>
  onEventDialogOpenChange: (open: boolean) => void
  onEventFormChange: (updater: (current: EventFormState) => EventFormState) => void
  onEventInlineListFormChange: (updater: (current: EventInlineListFormState) => EventInlineListFormState) => void
  onToggleEventList: (listId: string, checked: boolean) => void
}

export function CreateEventDialog({
  allLists,
  eventDialogOpen,
  eventForm,
  eventInlineListForm,
  onCreateEvent,
  onCreateInlineListForEvent,
  onEventDialogOpenChange,
  onEventFormChange,
  onEventInlineListFormChange,
  onToggleEventList,
}: CreateEventDialogProps) {
  return (
    <Dialog open={eventDialogOpen} onOpenChange={onEventDialogOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Name</Label>
            <Input
              id="event-name"
              value={eventForm.name}
              onChange={(event) => onEventFormChange((current) => ({ ...current, name: event.target.value }))}
              placeholder="Birthday dinner"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={eventForm.description}
              onChange={(event) =>
                onEventFormChange((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Short notes about the event"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={eventForm.icon}
                onValueChange={(value) => onEventFormChange((current) => ({ ...current, icon: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an icon" />
                </SelectTrigger>
                <SelectContent>
                  {eventIconOptions.map((option) => {
                    const Icon = option.icon

                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={eventForm.date}
                onChange={(event) => onEventFormChange((current) => ({ ...current, date: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Associated Lists</Label>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <ScrollArea className="max-h-48 rounded-xl border">
              <div className="space-y-2 p-3">
                {allLists.length > 0 ? (
                  allLists.map((list) => (
                    <label
                      key={list.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/30"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{list.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <Checkbox
                        checked={eventForm.listIds.includes(list.id)}
                        onCheckedChange={(checked) => onToggleEventList(list.id, checked === true)}
                      />
                    </label>
                  ))
                ) : (
                  <div className="px-1 py-2 text-sm text-muted-foreground">
                    Create a list before associating it with an event.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Create and attach a list</p>
              </div>
              <Badge variant="secondary">Quick add</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <Input
                value={eventInlineListForm.name}
                onChange={(event) =>
                  onEventInlineListFormChange((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="List name"
              />
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  {inlineListColorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => onEventInlineListFormChange((current) => ({ ...current, color: color.name }))}
                      className={`h-7 w-7 rounded-full transition-all ${color.className} ${
                        eventInlineListForm.color === color.name
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "hover:scale-110"
                      }`}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void onCreateInlineListForEvent()}
              disabled={!eventInlineListForm.name.trim()}
            >
              Create
            </Button>
          </div>

          <Button onClick={() => void onCreateEvent()} className="w-full" disabled={!eventForm.name.trim()}>
            Save Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
