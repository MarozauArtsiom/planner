import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <PageShell variant="public">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <p className="select-none text-7xl font-bold tracking-tight text-zinc-200 dark:text-zinc-800">
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("notFoundTitle")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("notFoundDesc")}
          </p>
          <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t("backHome")}
            </Link>
            <Link
              href="/poker"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t("tryQuickPoker")}
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
