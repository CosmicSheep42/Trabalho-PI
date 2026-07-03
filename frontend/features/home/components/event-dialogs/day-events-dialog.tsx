"use client"

import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ShopList } from "@/components/shoplist-banner"
import type { CalendarEvent } from "@/features/events/types"
import { getEventIcon } from "@/features/home/components/lists-tab/constants"

interface DayEventsDialogProps {
  allLists: ShopList[]
  eventViewerOpen: boolean
  selectedDate?: Date
  selectedDayEvents: CalendarEvent[]
  onDeleteEvent: (eventId: string) => Promise<void>
  onEventViewerOpenChange: (open: boolean) => void
  onOpenEventDetail: (event: CalendarEvent) => void
  onOpenList: (list: ShopList) => void
}

export function DayEventsDialog({
  allLists,
  eventViewerOpen,
  selectedDate,
  selectedDayEvents,
  onDeleteEvent,
  onEventViewerOpenChange,
  onOpenEventDetail,
  onOpenList,
}: DayEventsDialogProps) {
  return (
    <Dialog open={eventViewerOpen} onOpenChange={onEventViewerOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{selectedDate ? format(selectedDate, "EEEE, MMM d") : "Events"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event) => {
              const EventIcon = getEventIcon(event.icon)

              return (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenEventDetail(event)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault()
                      onOpenEventDetail(event)
                    }
                  }}
                  className="w-full rounded-xl border bg-muted/10 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="rounded-full bg-muted p-2 text-muted-foreground">
                        <EventIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        {event.description ? <p className="text-sm text-muted-foreground">{event.description}</p> : null}
                        <div className={`${event.description ? "mt-3" : ""} flex flex-wrap gap-2`}>
                          {event.listIds.length > 0 ? (
                            event.listIds
                              .map((listId) => allLists.find((list) => list.id === listId))
                              .filter((list): list is ShopList => list !== undefined)
                              .map((list) => (
                                <button
                                  key={list.id}
                                  type="button"
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation()
                                    onOpenList(list)
                                  }}
                                  className="rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                  {list.name}
                                </button>
                              ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No lists attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        void onDeleteEvent(event.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              No events for this day.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
