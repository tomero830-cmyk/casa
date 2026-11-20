import { toast } from "@/components/ui/use-toast";

/** Shows a Hebrew error toast. Use in catch blocks and mutation onError. */
export function notifyError(error, title = "משהו השתבש, נסו שוב") {
  console.error(error);
  toast({ variant: "destructive", title, description: error?.message || undefined });
}

/** Shows a short success/info toast, optionally with an undo-style action element. */
export function notify(title, options = {}) {
  return toast({ title, ...options });
}
