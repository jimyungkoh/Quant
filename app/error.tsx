"use client";

import { useEffect } from "react";

import { DataState } from "@/components/data-state";
import { PageShell } from "@/components/page-shell";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <PageShell>
      <DataState
        variant="error"
        title="데이터를 불러오는 중 문제가 발생했습니다"
        description="잠시 후 다시 시도해 주세요."
        actionLabel="다시 시도"
        onAction={reset}
      />
    </PageShell>
  );
}
