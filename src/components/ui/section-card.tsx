import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared section shell used by every financial section (income, expenses, debts,
 * payments, savings, goals) so headers, spacing, loading and empty states match.
 */
const sectionAccent = cva("border-b", {
  variants: {
    accent: {
      income: "bg-income/10 border-income/20",
      expense: "bg-warning/10 border-warning/20",
      debt: "bg-debt/10 border-debt/20",
      payment: "bg-primary/10 border-primary/20",
      savings: "bg-primary/10 border-primary/20",
      neutral: "bg-muted/50 border-border",
    },
  },
  defaultVariants: { accent: "neutral" },
});

const sectionShell = cva("shadow-medium overflow-hidden", {
  variants: {
    accent: {
      income: "border-income/20",
      expense: "border-warning/20",
      debt: "border-debt/20",
      payment: "border-primary/20",
      savings: "border-primary/20",
      neutral: "border-border",
    },
  },
  defaultVariants: { accent: "neutral" },
});

const iconAccent: Record<string, string> = {
  income: "text-income",
  expense: "text-warning",
  debt: "text-debt",
  payment: "text-primary",
  savings: "text-primary",
  neutral: "text-muted-foreground",
};

export interface SectionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof sectionShell> {

  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Rendered on the right side of the header (buttons, selects, badges). */
  actions?: React.ReactNode;
  /** Extra content rendered under the title row, inside the header. */
  headerExtra?: React.ReactNode;
  contentClassName?: string;
}

export const SectionCard = ({
  icon: Icon,
  title,
  description,
  actions,
  headerExtra,
  accent = "neutral",
  className,
  contentClassName,
  children,
  ...props
}: SectionCardProps) => (
  <Card className={cn(sectionShell({ accent }), className)} {...props}>
    <CardHeader className={cn(sectionAccent({ accent }), "space-y-3")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            {Icon && <Icon className={cn("h-5 w-5 shrink-0", iconAccent[accent ?? "neutral"])} />}
            <span className="truncate">{title}</span>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {headerExtra}
    </CardHeader>
    <CardContent className={cn("pt-6 space-y-6", contentClassName)}>{children}</CardContent>
  </Card>
);

/** Standard list loading state for every section. */
export const SectionLoading = ({ rows = 3, className }: { rows?: number; className?: string }) => (
  <div className={cn("space-y-3", className)} aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/5" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

/** Standard empty state for every section. */
export const SectionEmpty = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center",
      className,
    )}
  >
    {Icon && <Icon className="h-10 w-10 text-muted-foreground/60" />}
    <p className="font-medium text-foreground">{title}</p>
    {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
    {action}
  </div>
);
