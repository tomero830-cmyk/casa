import { cn } from "@/lib/utils";

/**
 * Consistent page title row: soft icon badge, serif title, optional subtitle and actions.
 */
export default function PageHeader({ icon: Icon, title, subtitle, children, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-accent-foreground" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-2xl leading-tight truncate">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
