import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <PageShell>
      <Card>
        <CardHeader className="space-y-4">
          <div className="h-3 w-40 animate-pulse rounded bg-[var(--soft-blue)]" />
          <div className="h-12 w-full max-w-2xl animate-pulse rounded bg-[var(--soft-surface)]" />
          <div className="h-5 w-full max-w-3xl animate-pulse rounded bg-[var(--soft-surface)]" />
        </CardHeader>
        <CardContent>
          <div className="h-[380px] animate-pulse rounded-xl border border-[color:var(--border)] bg-[var(--soft-surface)]" />
        </CardContent>
      </Card>
    </PageShell>
  );
}
