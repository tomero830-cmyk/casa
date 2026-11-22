import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Wallet, Dumbbell, Apple, ShoppingCart, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOUSEHOLD_NAME } from "@/lib/household";
import { isDemoMode, DEMO_FLAG } from "@/api/demoClient";
import { usePrefs } from "@/lib/prefs";

const navItems = [
  { path: "/", icon: Home, label: "בית" },
  { path: "/workouts", icon: Dumbbell, label: "אימונים" },
  { path: "/nutrition", icon: Apple, label: "תזונה" },
  { path: "/shopping", icon: ShoppingCart, label: "קניות" },
  { path: "/income", icon: Wallet, label: "הכנסות" },
];

const navIndex = (path) => {
  const i = navItems.findIndex(n => n.path === path);
  return i === -1 ? navItems.length : i;
};

export default function AppLayout() {
  const location = useLocation();
  const prefs = usePrefs();
  const reduceMotion = useReducedMotion() || prefs.motion === "off";
  const [scrolled, setScrolled] = useState(false);

  // Slide direction follows the tab order. In RTL the next tab sits to the left,
  // so moving "forward" brings the new page in from the left (negative x).
  const prevIndex = useRef(navIndex(location.pathname));
  const index = navIndex(location.pathname);
  const direction = index === prevIndex.current ? 0 : index > prevIndex.current ? -1 : 1;
  useEffect(() => {
    prevIndex.current = index;
    window.scrollTo({ top: 0 });
  }, [index]);

  // Header is transparent at the top and turns walnut once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-clip">
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-40 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-[background-color,box-shadow,color] duration-300",
          scrolled
            ? "bg-background/85 backdrop-blur-xl text-foreground shadow-[0_8px_24px_-18px_rgba(70,50,30,0.35)]"
            : "bg-transparent text-foreground"
        )}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-7 h-7 rounded-full border flex items-center justify-center transition-colors", "border-foreground/20")}>
              <span className="text-sm font-playfair italic leading-none">c</span>
            </div>
            <h1 className="text-xl font-playfair italic tracking-wide">Casa</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-wide text-muted-foreground">{HOUSEHOLD_NAME}</span>
            <Link to="/settings" aria-label="הגדרות" className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <SettingsIcon className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      {isDemoMode() && (
        <div className="max-w-lg mx-auto w-full px-4">
          <div className="flex items-center justify-between rounded-full bg-[hsl(var(--tone-brown-bg))] text-[hsl(var(--tone-brown-fg))] px-4 py-1.5 text-[11px]">
            <span>מצב הדגמה · כל הנתונים לדוגמה</span>
            <button
              onClick={() => { try { sessionStorage.removeItem(DEMO_FLAG); } catch { /* ignore */ } window.location.href = "/login"; }}
              className="font-semibold underline underline-offset-2"
            >
              יציאה
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <motion.div
          key={location.pathname}
          className="max-w-lg mx-auto px-4 pt-2 pb-5"
          initial={reduceMotion || direction === 0 ? { opacity: 0 } : { opacity: 0, x: direction * 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Floating bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto rounded-full bg-card/90 backdrop-blur-xl text-foreground shadow-[0_14px_36px_-14px_rgba(70,50,30,0.35)] ring-1 ring-foreground/[0.04] px-2 py-1.5 flex items-center justify-between">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-full transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="relative w-[19px] h-[19px]" />
                <span className={cn("relative text-[10px] tracking-wide", isActive ? "font-semibold" : "font-normal")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
