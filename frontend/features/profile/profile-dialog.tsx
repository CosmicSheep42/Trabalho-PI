"use client"

import { useState } from "react"
import { addDays, format } from "date-fns"
import { User, Mail, Lock, Camera, AtSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { dietaryOptions, DietaryBadge } from "@/components/dietary-badge"
import type { ProfileUser } from "@/features/profile/types"
import type { DietaryOption } from "@/lib/dietary-options"
import { normalizeUsername, validateUsername } from "@/lib/username"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ProfileUser
  onSave: (allergies: DietaryOption[]) => Promise<void> | void
  onSaveUsername: (username: string) => Promise<void> | void
  isSavingUser?: boolean
  isSavingUsername?: boolean
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onSave,
  onSaveUsername,
  isSavingUser = false,
  isSavingUsername = false,
}: ProfileDialogProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<DietaryOption[]>(user.allergies)
  const [username, setUsername] = useState(user.username ?? "")
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const toggleAllergy = (allergy: DietaryOption) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    )
  }

  const handleSave = async () => {
    await onSave(selectedAllergies)
    onOpenChange(false)
  }

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
  const usernameUpdatedAt = user.usernameUpdatedAt ? new Date(user.usernameUpdatedAt) : null
  const canChangeUsername =
    !user.haveUsername ||
    !usernameUpdatedAt ||
    Number.isNaN(usernameUpdatedAt.getTime()) ||
    new Date() >= addDays(usernameUpdatedAt, 30)
  const nextUsernameChangeDate =
    user.haveUsername && usernameUpdatedAt && !Number.isNaN(usernameUpdatedAt.getTime())
      ? addDays(usernameUpdatedAt, 30)
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </Label>
              <Input value={user.name} disabled className="bg-secondary/50" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={user.email} disabled className="bg-secondary/50" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AtSign className="h-4 w-4" />
                Username
              </Label>
              <Input
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (usernameError) {
                    setUsernameError(null)
                  }
                }}
                disabled={!canChangeUsername || isSavingUsername}
                autoComplete="off"
                placeholder="YourName"
              />
              <p className="text-sm text-muted-foreground">
                {!user.haveUsername
                  ? "Create your username here. The login prompt will keep appearing until you save one."
                  : canChangeUsername
                    ? "You can change your username once every 30 days."
                    : `You can change your username again on ${format(nextUsernameChangeDate!, "MMMM d, yyyy")}.`}
              </p>
              {usernameError ? <p className="text-sm text-destructive">{usernameError}</p> : null}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void handleSaveUsername()}
                disabled={isSavingUsername || isUsernameUnchanged || !canChangeUsername}
              >
                {isSavingUsername ? "Saving..." : user.haveUsername ? "Update Username" : "Create Username"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Dietary Restrictions / Allergies</Label>
            <div className="grid grid-cols-2 gap-2">
              {dietaryOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                >
                  <Checkbox
                    checked={selectedAllergies.includes(option)}
                    onCheckedChange={() => toggleAllergy(option)}
                  />
                  <DietaryBadge type={option} />
                </label>
              ))}
            </div>
          </div>

          <Button onClick={() => void handleSave()} className="w-full" disabled={isSavingUser}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
