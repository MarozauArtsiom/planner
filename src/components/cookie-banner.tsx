"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "cookieBannerDismissed_v1";

/**
 * Информационный cookie-banner (не gating).
 * Поскольку мы используем только strictly necessary cookies,
 * по EU-праву consent не требуется — банер показывается для прозрачности.
 *
 * Dismiss сохраняется в localStorage. Гость может пользоваться сервисом
 * без клика по баннеру.
 */
export function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const [dismissed, setDismissed] = useState<boolean | null>(null); // null = не определено (SSR)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore — приватный режим браузера может блокировать localStorage
    }
    setDismissed(true);
  };

  // SSR / не загрузились — ничего не рендерим
  if (dismissed === null || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {t("message")}{" "}
          <Link
            href="/cookies"
            className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t("learnMore")}
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  );
}
