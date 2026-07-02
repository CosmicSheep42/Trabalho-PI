"use client"

import { useState } from "react"
import { Moon, Sun, Bell, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { ProfileUser } from "@/features/profile/types"
import { normalizeUsername, validateUsername } from "@/lib/username"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ProfileUser
  onSaveUsername: (username: string) => Promise<void>
  isSavingUsername?: boolean
}

export function SettingsDialog({
  open,
  onOpenChange,
  user,
  onSaveUsername,
  isSavingUsername = false,
}: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const [username, setUsername] = useState(user.username ?? "")
  const [usernameError, setUsernameError] = useState<string | null>(null)

  async function handleSaveUsername() {
    const normalized = normalizeUsername(username)
    const validationError = validateUsername(normalized)

    if (validationError) {
      setUsernameError(validationError)
      return
    }

    try {
      setUsernameError(null)
      await onSaveUsername(normalized)
    } catch (error) {
      setUsernameError(error instanceof Error ? error.message : "Unable to save username.")
    }
  }

  const normalizedCurrentUsername = normalizeUsername(user.username ?? "")
  const normalizedDraftUsername = normalizeUsername(username)
  const isUsernameUnchanged =
    user.haveUsername && normalizedCurrentUsername.toLowerCase() === normalizedDraftUsername.toLowerCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="settings-username">Username</Label>
              <Input
                id="settings-username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (usernameError) {
                    setUsernameError(null)
                  }
                }}
                placeholder="your_name"
                autoComplete="off"
                disabled={isSavingUsername}
              />
              <p className="text-sm text-muted-foreground">
                {user.haveUsername
                  ? "Change your public username here."
                  : "You still need to create a username. The login prompt will keep appearing until you save one."}
              </p>
              {usernameError ? <p className="text-sm text-destructive">{usernameError}</p> : null}
            </div>

            <Button
              onClick={() => void handleSaveUsername()}
              disabled={isSavingUsername || isUsernameUnchanged}
              className="w-full"
            >
              {isSavingUsername ? "Saving..." : user.haveUsername ? "Update username" : "Create username"}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {isDark ? "Currently using dark theme" : "Currently using light theme"}
                </p>
              </div>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">Recipe suggestions</p>
              </div>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </Label>
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
