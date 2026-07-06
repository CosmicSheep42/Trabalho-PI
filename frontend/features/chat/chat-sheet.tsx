"use client"

import { Bot, SendHorizontal, Sparkles, User2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ChatRecipeCards } from "@/features/chat/components/chat-recipe-cards"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/features/chat/types"

interface ChatSheetProps {
  open: boolean
  draft: string
  error: string | null
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
  isHydrated,
  isSending,
  messages,
  onOpenChange,
  onDraftChange,
  onSendMessage,
  onRecipeClick,
}: ChatSheetProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isSending])

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
                      <p className="whitespace-pre-wrap leading-6">{message.content}</p>
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
            <div className="rounded-3xl border border-border/70 bg-card/95 p-3 shadow-lg shadow-black/5 ring-1 ring-black/5">
              <Textarea
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder="Ask the assistant something..."
                className="min-h-24 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-0"
                onKeyDown={(event) => {
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
