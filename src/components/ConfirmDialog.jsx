import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Wraps a trigger element (e.g. a delete button) with a confirmation dialog.
 * Usage: <ConfirmDialog title="למחוק?" onConfirm={...}><button>…</button></ConfirmDialog>
 */
export default function ConfirmDialog({
  children,
  title = "למחוק?",
  description = "אי אפשר לבטל את הפעולה הזו.",
  confirmLabel = "מחק",
  cancelLabel = "ביטול",
  onConfirm,
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="text-right sm:text-right">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-start">
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel className="flex-1 mt-0">{cancelLabel}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
