"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PendingRemoval } from "@/features/home/components/lists-tab/types"

interface RecipeRemovalAlertProps {
  pendingRemoval: PendingRemoval | null
  onConfirmRemoval: () => Promise<void>
  onPendingRemovalChange: (value: PendingRemoval | null) => void
}

export function RecipeRemovalAlert({
  pendingRemoval,
  onConfirmRemoval,
  onPendingRemovalChange,
}: RecipeRemovalAlertProps) {
  return (
    <AlertDialog
      open={pendingRemoval !== null}
      onOpenChange={(open) => {
        if (!open) {
          onPendingRemovalChange(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingRemoval
              ? `Removing "${pendingRemoval.recipeName}" will also remove it from linked lists. Please confirm to continue.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              void onConfirmRemoval()
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
