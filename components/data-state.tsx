import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DataStateProps = {
  title: string;
  description: string;
  variant?: "error" | "empty";
  actionLabel?: string;
  onAction?: () => void;
};

export function DataState({
  title,
  description,
  variant = "empty",
  actionLabel,
  onAction,
}: DataStateProps) {
  return (
    <Card className="border-dashed bg-[var(--card)]">
      <CardHeader>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
          {variant === "error" ? "Data issue" : "No data"}
        </p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        {actionLabel && onAction ? (
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-medium tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(17,17,17,0.18)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] border-[color:var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--soft-blue)] h-10 px-4 py-2"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
