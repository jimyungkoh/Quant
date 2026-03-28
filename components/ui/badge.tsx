import * as React from "react";

import { cn } from "@/lib/utils";

const BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]";

const VARIANT_CLASSES = {
  green: "border-transparent bg-[var(--soft-green)] text-[var(--soft-green-foreground)]",
  yellow: "border-transparent bg-[var(--soft-yellow)] text-[var(--soft-yellow-foreground)]",
  blue: "border-transparent bg-[var(--soft-blue)] text-[var(--soft-blue-foreground)]",
  outline: "border-[color:var(--border)] text-[var(--muted)]",
} as const;

type BadgeVariant = keyof typeof VARIANT_CLASSES;

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "outline", ...props }: BadgeProps) {
  return <div className={cn(BASE, VARIANT_CLASSES[variant], className)} {...props} />;
}
