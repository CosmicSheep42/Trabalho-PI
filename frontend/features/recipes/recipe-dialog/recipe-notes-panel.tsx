"use client"

import { NotebookPen, X } from "lucide-react"

interface RecipeNotesPanelProps {
  notesInput: string
  onChange: (value: string) => void
  onBlur: () => void
  onClose: () => void
}

export function RecipeNotesPanel({ notesInput, onChange, onBlur, onClose }: RecipeNotesPanelProps) {
  return (
    <aside className="flex max-h-[90vh] flex-col overflow-hidden rounded-[28px] border border-amber-300/80 bg-[linear-gradient(180deg,rgba(255,244,184,0.98)_0%,rgba(255,234,140,0.95)_100%)] shadow-2xl">
      <div className="border-b border-amber-400/70 bg-amber-200/70 px-6 py-5">
        <div className="flex items-start justify-between gap-4 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/80">
              <NotebookPen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Recipe notes</h3>
              <p className="text-sm text-amber-900/80">Your personal block for tweaks, reminders and ideas.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-black transition-colors hover:bg-black/10"
            aria-label="Close notes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-6 py-5">
        <div
          className="flex-1 rounded-[24px] border border-amber-400/60 p-4"
          style={{
            backgroundColor: "rgba(255, 251, 235, 0.72)",
            backgroundImage:
              "repeating-linear-gradient(180deg, transparent 0px, transparent 35px, rgba(180,120,0,0.13) 35px, rgba(180,120,0,0.13) 36px)",
          }}
        >
          <textarea
            value={notesInput}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            placeholder="Write anything about this recipe..."
            className="h-full min-h-[74vh] w-full -translate-y-[5.5px] resize-none border-0 bg-transparent px-1 py-[1px] text-base leading-9 text-amber-950 outline-none placeholder:text-amber-900/55"
          />
        </div>
      </div>
    </aside>
  )
}
