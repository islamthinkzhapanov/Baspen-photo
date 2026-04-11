"use client";

import { useEffect } from "react";
import { Button } from "@tremor/react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-text">
        Произошла ошибка
      </h2>
      <p className="text-sm text-text-secondary">
        Что-то пошло не так. Попробуйте обновить страницу.
      </p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
