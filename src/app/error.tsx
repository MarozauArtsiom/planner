"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageShell, Button } from "@/components/ui";

/**
 * Global error boundary для всего приложения. Срабатывает на runtime-ошибках
 * в server components / route handlers, недоступных через notFound().
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <PageShell variant="public">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <p className="select-none text-7xl font-bold tracking-tight text-zinc-200 dark:text-zinc-800">
            500
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("serverErrorTitle")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("serverErrorDesc")}
          </p>
          {error.digest && (
            <p
              className="mt-3 font-mono text-[10px] text-zinc-400 dark:text-zinc-600"
              aria-label={`Error reference: ${error.digest}`}
            >
              ref: {error.digest}
            </p>
          )}
          <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Button type="button" onClick={reset} variant="primary" size="md">
              {t("tryAgain")}
            </Button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t("backHome")}
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
