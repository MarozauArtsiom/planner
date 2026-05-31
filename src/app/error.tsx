"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/footer";

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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <p className="text-7xl font-bold text-zinc-200 dark:text-zinc-800">
            500
          </p>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("serverErrorTitle")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("serverErrorDesc")}
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
              ref: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t("tryAgain")}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t("backHome")}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
