"use client"

import { Moon, Sun, Bell, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
            <Button variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10">
              Delete Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
