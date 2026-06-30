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
  { name: "green", className: "bg-green-600" },
  { name: "blue", className: "bg-blue-600" },
  { name: "purple", className: "bg-purple-600" },
  { name: "orange", className: "bg-orange-600" },
  { name: "pink", className: "bg-pink-600" },
  { name: "cyan", className: "bg-cyan-600" },
  { name: "amber", className: "bg-amber-600" },
  { name: "rose", className: "bg-rose-600" },
] as const

export function getEventIcon(icon: string) {
  return eventIconOptions.find((option) => option.value === icon)?.icon ?? CalendarDays
}
