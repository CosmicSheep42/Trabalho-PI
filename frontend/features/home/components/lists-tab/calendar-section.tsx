"use client"

import { addMonths, format, isSameDay, isSameMonth, subMonths } from "date-fns"
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CalendarEvent } from "@/features/events/types"
import { calendarWeekdays, getEventIcon } from "./constants"

interface CalendarSectionProps {
  calendarDays: Date[]
  calendarMonth: Date
  eventsByDate: Record<string, CalendarEvent[]>
  selectedDate?: Date
  onCalendarMonthChange: (nextMonth: Date) => void
  onCalendarDayClick: (day: Date, dayEvents: CalendarEvent[]) => void
  onCreateEvent: () => void
}

export function CalendarSection({
  calendarDays,
  calendarMonth,
  eventsByDate,
  selectedDate,
  onCalendarMonthChange,
  onCalendarDayClick,
  onCreateEvent,
}: CalendarSectionProps) {
  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="min-h-16 border-b py-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="h-6 w-6 shrink-0 text-primary" />
          Calendar
        </CardTitle>
        <CardAction className="static col-auto row-auto self-center justify-self-end">
          <Button variant="outline" size="sm" className="gap-2" onClick={onCreateEvent}>
            <CalendarPlus className="h-4 w-4" />
            New Event
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="h-[32rem] p-4">
        <div className="flex h-full min-h-0 flex-col rounded-xl border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCalendarMonthChange(subMonths(calendarMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold">{format(calendarMonth, "MMMM yyyy")}</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCalendarMonthChange(addMonths(calendarMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2 px-4 pt-4 text-center text-xs font-medium text-muted-foreground">
            {calendarWeekdays.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7 gap-2 p-4">
            {calendarDays.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const inCurrentMonth = isSameMonth(day, calendarMonth)
              const dayKey = format(day, "yyyy-MM-dd")
              const dayEvents = eventsByDate[dayKey] ?? []
              const visibleDayEvents = dayEvents.slice(0, 2)

              return (
                <div
                  key={day.toISOString()}
                  role="button"
                  tabIndex={0}
                  onClick={() => onCalendarDayClick(day, dayEvents)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault()
                      onCalendarDayClick(day, dayEvents)
                    }
                  }}
                  className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : inCurrentMonth
                        ? "border-border bg-card hover:bg-muted/60"
                        : "border-border/60 bg-muted/20 text-muted-foreground"
                  }`}
                >
                  <div className="flex w-full items-start justify-end px-2 pt-2 text-right">
                    <span className="font-medium">{format(day, "d")}</span>
                  </div>
                  <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-2">
                    <div className="flex h-6 items-center justify-center gap-1 overflow-hidden">
                      {visibleDayEvents.map((event) => {
                        const EventIcon = getEventIcon(event.icon)

                        return (
                          <span
                            key={event.id}
                            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors ${
                              isSelected
                                ? "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground"
                                : "border-border bg-muted text-foreground hover:bg-muted/80"
                            }`}
                            aria-hidden="true"
                          >
                            <EventIcon className="h-3.5 w-3.5" />
                          </span>
                        )
                      })}
                      {dayEvents.length > visibleDayEvents.length ? (
                        <span
                          className={`inline-flex h-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-medium ${
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          +{dayEvents.length - visibleDayEvents.length}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
