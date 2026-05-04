"use client"

import { useEffect, useState } from "react"
import { User, Mail, Lock, Camera } from "lucide-react"
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

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ProfileUser
  onSave: (allergies: DietaryOption[]) => Promise<void> | void
  isSavingUser?: boolean
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onSave,
  isSavingUser = false,
}: ProfileDialogProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<DietaryOption[]>(user.allergies)

  useEffect(() => {
    if (open) {
      setSelectedAllergies(user.allergies)
    }
  }, [open, user.allergies])

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
