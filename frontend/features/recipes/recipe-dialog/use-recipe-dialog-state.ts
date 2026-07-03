"use client"

import { useMemo, useState } from "react"
import type { ShopList } from "@/components/shoplist-banner"

export function useRecipeDialogState(lists: ShopList[], initialServings: number | null, initialNotes: string) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [listSearch, setListSearch] = useState("")
  const [servingsInput, setServingsInput] = useState(initialServings ? String(initialServings) : "")
  const [persistedServings, setPersistedServings] = useState<number | null>(initialServings)
  const [isPersistingServings, setIsPersistingServings] = useState(false)
  const [notesInput, setNotesInput] = useState(initialNotes)
  const [persistedNotes, setPersistedNotes] = useState(initialNotes)
  const [isPersistingNotes, setIsPersistingNotes] = useState(false)

  const filteredLists = useMemo(() => {
    const query = listSearch.trim().toLowerCase()
    if (!query) return lists
    return lists.filter((list) => list.name.toLowerCase().includes(query))
  }, [listSearch, lists])

  return {
    filteredLists,
    isPersistingNotes,
    isPersistingServings,
    listSearch,
    notesInput,
    notesOpen,
    persistedNotes,
    persistedServings,
    saveDialogOpen,
    servingsInput,
    setIsPersistingNotes,
    setIsPersistingServings,
    setListSearch,
    setNotesInput,
    setNotesOpen,
    setPersistedNotes,
    setPersistedServings,
    setSaveDialogOpen,
    setServingsInput,
  }
}
