import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-[var(--page-max-width)] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className={cn("flex flex-col gap-6", className)}>{children}</div>
      </div>
    </div>
  );
}
