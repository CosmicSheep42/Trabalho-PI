"use client"

import {
  CalendarDays,
  CakeSlice,
  Gift,
  Heart,
  PartyPopper,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"

export const calendarWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const eventIconOptions = [
  { value: "party", label: "Party", icon: PartyPopper },
  { value: "dinner", label: "Dinner", icon: UtensilsCrossed },
  { value: "cake", label: "Cake", icon: CakeSlice },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
] as const

export const inlineListColorOptions = [
  { name: "green", className: "bg-emerald-500" },
  { name: "blue", className: "bg-sky-500" },
  { name: "purple", className: "bg-violet-500" },
  { name: "orange", className: "bg-orange-500" },
  { name: "pink", className: "bg-pink-400" },
  { name: "cyan", className: "bg-teal-500" },
  { name: "amber", className: "bg-amber-500" },
  { name: "rose", className: "bg-rose-400" },
] as const

export function getEventIcon(icon: string) {
  return eventIconOptions.find((option) => option.value === icon)?.icon ?? CalendarDays
}
