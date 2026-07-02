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

interface DeleteItemsDialogProps {
  open: boolean
  selectedItemsCount: number
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function DeleteItemsDialog({
  open,
  selectedItemsCount,
  onConfirm,
  onOpenChange,
}: DeleteItemsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {selectedItemsCount} items?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The selected items will be permanently removed from this list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
