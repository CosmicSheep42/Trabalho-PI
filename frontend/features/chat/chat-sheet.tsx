"use client"

import { Bot, SendHorizontal, Sparkles, User2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ChatRecipeCards } from "@/features/chat/components/chat-recipe-cards"
import type { FriendGroup, FriendUser } from "@/features/friends/types"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/features/chat/types"

type MentionSuggestion =
  | { id: string; kind: "friend"; label: string; value: string; detail: string }
  | { id: string; kind: "group"; label: string; value: string; detail: string }

interface ChatSheetProps {
  open: boolean
  draft: string
  error: string | null
  friendGroups: FriendGroup[]
  friends: FriendUser[]
  isHydrated: boolean
  isSending: boolean
  messages: ChatMessage[]
  onOpenChange: (open: boolean) => void
  onDraftChange: (value: string) => void
  onSendMessage: (message: string) => Promise<void>
  onRecipeClick: (recipeId: string) => void
}

export function ChatSheet({
  open,
  draft,
  error,
  friendGroups,
  friends,
  isHydrated,
  isSending,
  messages,
  onOpenChange,
  onDraftChange,
  onSendMessage,
  onRecipeClick,
}: ChatSheetProps) {
  const endRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [mentionState, setMentionState] = useState<{
    active: boolean
    query: string
    start: number
    end: number
  }>({
    active: false,
    query: "",
    start: -1,
    end: -1,
  })
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isSending])

  const mentionSuggestions = useMemo(() => {
    if (!mentionState.active) {
      return []
    }

    const normalizedQuery = mentionState.query.trim().toLowerCase()
    const friendSuggestions: MentionSuggestion[] = friends
      .filter((friend) => {
        if (!normalizedQuery) {
          return true
        }
        return friend.username.toLowerCase().includes(normalizedQuery)
      })
      .map((friend) => ({
        id: `friend:${friend.id}`,
        kind: "friend",
        label: `@${friend.username}`,
        value: `@[friend:${friend.username}]`,
        detail: "Friend",
      }))

    const groupSuggestions: MentionSuggestion[] = friendGroups
      .filter((group) => {
        if (!normalizedQuery) {
          return true
        }
        return group.name.toLowerCase().includes(normalizedQuery)
      })
      .map((group) => ({
        id: `group:${group.id}`,
        kind: "group",
        label: `@${group.name}`,
        value: `@[group:${group.name}]`,
        detail: "Group",
      }))

    return [...friendSuggestions, ...groupSuggestions].slice(0, 8)
  }, [friendGroups, friends, mentionState.active, mentionState.query])

  useEffect(() => {
    if (activeMentionIndex >= mentionSuggestions.length) {
      setActiveMentionIndex(0)
    }
  }, [activeMentionIndex, mentionSuggestions.length])

  function formatMessageContentForDisplay(content: string) {
    return content
      .replace(/@\[friend:([^\]]+)\]/g, "@$1")
      .replace(/@\[group:([^\]]+)\]/g, "@$1")
  }

  function updateMentionState(nextValue: string, caretPosition: number) {
    const textBeforeCaret = nextValue.slice(0, caretPosition)
    const mentionMatch = textBeforeCaret.match(/(?:^|\s)@([^\s@]*)$/)
    if (!mentionMatch) {
      setMentionState((current) => (current.active ? { active: false, query: "", start: -1, end: -1 } : current))
      return
    }

    const query = mentionMatch[1] ?? ""
    const start = caretPosition - query.length - 1
    setMentionState({
      active: true,
      query,
      start,
      end: caretPosition,
    })
    setActiveMentionIndex(0)
  }

  function insertMention(suggestion: MentionSuggestion) {
    if (!textareaRef.current || !mentionState.active) {
      return
    }

    const nextDraft = `${draft.slice(0, mentionState.start)}${suggestion.value} ${draft.slice(mentionState.end)}`
    onDraftChange(nextDraft)
    setMentionState({ active: false, query: "", start: -1, end: -1 })
    setActiveMentionIndex(0)

    const nextCaretPosition = mentionState.start + suggestion.value.length + 1
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(nextCaretPosition, nextCaretPosition)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b bg-muted/30 px-6 py-5">
          <div className="pr-10">
            <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              Chat Assistant
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/10">
            <div className="space-y-4 p-4">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-5">
                  <p className="text-sm font-medium">Ask anything inside Cookwise</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border bg-card text-card-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-6">{formatMessageContentForDisplay(message.content)}</p>
                      {message.executedToolCalls && message.executedToolCalls.length > 0 ? (
                        <ChatRecipeCards executedToolCalls={message.executedToolCalls} onRecipeClick={onRecipeClick} />
                      ) : null}
                      {message.toolCalls && message.toolCalls.length > 0 ? (
                        <p className="mt-2 text-xs opacity-80">
                          Tool calls: {message.toolCalls.map((toolCall) => toolCall.name).join(", ")}
                        </p>
                      ) : null}
                    </div>

                    {message.role === "user" ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <User2 className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                ))
              )}

              {isSending ? (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>
          </div>

          <div className="border-t bg-background/95 p-4 backdrop-blur">
            {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
            <div className="relative rounded-3xl border border-border/70 bg-card/95 p-3 shadow-lg shadow-black/5 ring-1 ring-black/5">
              {mentionState.active && mentionSuggestions.length > 0 ? (
                <div className="absolute inset-x-3 bottom-[calc(100%+0.75rem)] z-20 rounded-2xl border bg-popover p-2 shadow-xl">
                  <p className="px-2 pb-2 text-xs text-muted-foreground">Mention a friend or group</p>
                  <div className="space-y-1">
                    {mentionSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
                          index === activeMentionIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          insertMention(suggestion)
                        }}
                      >
                        <span className="truncate font-medium">{suggestion.label}</span>
                        <span className="ml-3 shrink-0 text-xs text-muted-foreground">{suggestion.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  onDraftChange(nextValue)
                  updateMentionState(nextValue, event.target.selectionStart ?? nextValue.length)
                }}
                placeholder="Ask the assistant something..."
                className="min-h-24 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 placeholder:text-muted-foreground/80 focus-visible:ring-0"
                onClick={(event) => {
                  const target = event.currentTarget
                  updateMentionState(target.value, target.selectionStart ?? target.value.length)
                }}
                onKeyUp={(event) => {
                  const target = event.currentTarget
                  updateMentionState(target.value, target.selectionStart ?? target.value.length)
                }}
                onKeyDown={(event) => {
                  if (mentionState.active && mentionSuggestions.length > 0) {
                    if (event.key === "ArrowDown") {
                      event.preventDefault()
                      setActiveMentionIndex((current) => (current + 1) % mentionSuggestions.length)
                      return
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault()
                      setActiveMentionIndex((current) => (current - 1 + mentionSuggestions.length) % mentionSuggestions.length)
                      return
                    }
                    if (event.key === "Escape") {
                      event.preventDefault()
                      setMentionState({ active: false, query: "", start: -1, end: -1 })
                      return
                    }
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      insertMention(mentionSuggestions[activeMentionIndex] ?? mentionSuggestions[0])
                      return
                    }
                  }
                  if (event.key === "Enter" && !event.shiftKey && isHydrated) {
                    event.preventDefault()
                    void onSendMessage(draft)
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">
                  Enter sends. Shift + Enter adds a new line.
                </p>
                <Button
                  className="rounded-full px-5 shadow-sm"
                  onClick={() => void onSendMessage(draft)}
                  disabled={!isHydrated || isSending || !draft.trim()}
                >
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
