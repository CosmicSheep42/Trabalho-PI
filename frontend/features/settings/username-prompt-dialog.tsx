"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeUsername, validateUsername } from "@/lib/username"

interface UsernamePromptDialogProps {
  open: boolean
  onSkip: () => void
  onSave: (username: string) => Promise<void>
  isSaving?: boolean
}

export function UsernamePromptDialog({
  open,
  onSkip,
  onSave,
  isSaving = false,
}: UsernamePromptDialogProps) {
  const [username, setUsername] = useState("")
  const [skipForNow, setSkipForNow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const normalized = normalizeUsername(username)
    const validationError = validateUsername(normalized)

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setError(null)
      await onSave(normalized)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save username.")
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Choose your username</DialogTitle>
          <DialogDescription>
            You can keep using Google login, but this app still needs a unique username for your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username-onboarding">Username</Label>
            <Input
              id="username-onboarding"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              placeholder="your_name"
              autoComplete="off"
              disabled={skipForNow || isSaving}
            />
            <p className="text-sm text-muted-foreground">
              Use 5 to 50 characters with letters, numbers, <code>-</code> or <code>_</code>.
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/20 p-3">
            <Checkbox
              checked={skipForNow}
              onCheckedChange={(checked) => setSkipForNow(Boolean(checked))}
              disabled={isSaving}
            />
            <span className="text-sm text-muted-foreground">
              I don&apos;t want to create a username now.
            </span>
          </label>
        </div>

        <DialogFooter>
          {skipForNow ? (
            <Button onClick={onSkip} disabled={isSaving} className="w-full sm:w-auto">
              Continue for now
            </Button>
          ) : (
            <Button onClick={() => void handleSubmit()} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? "Saving..." : "Save username"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
