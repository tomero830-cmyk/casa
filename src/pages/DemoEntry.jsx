import { useEffect } from "react";
import { DEMO_FLAG } from "@/api/demoClient";

/** Public entry to the demo: marks this tab as demo and reloads into the app with sample data. */
export default function DemoEntry() {
  useEffect(() => {
    try { sessionStorage.setItem(DEMO_FLAG, "1"); } catch { /* storage blocked: demo can't start */ }
    window.location.replace("/");
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
      טוען את הדמו…
    </div>
  );
}
