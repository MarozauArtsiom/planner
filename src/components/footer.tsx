import Link from "next/link";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/legal";

/**
 * Глобальный footer с обязательными legal-ссылками.
 * Показывается на всех публичных страницах (landing, /poker, /poker/[code],
 * login, register, terms, privacy, cookies).
 *
 * Для приложения внутри проекта (Гант, эстимация) можно не использовать —
 * footer там перегружает интерфейс.
 */
export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-4 py-6 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
          <span>{APP_NAME}</span>
          <span aria-hidden="true">•</span>
          <span>Free forever</span>
          <span aria-hidden="true">•</span>
          <span>No tracking</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-200">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-200">
            Privacy
          </Link>
          <Link href="/cookies" className="hover:text-zinc-700 dark:hover:text-zinc-200">
            Cookies
          </Link>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
