import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/current-user";
import { updateUserProfile } from "@/app/actions/user";
import { setLocale } from "@/app/actions/locale";
import { UserMenu } from "@/components/user-menu";

const AVAILABLE_LOCALES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
  { code: "es", label: "Español" },
  { code: "be", label: "Беларуская" },
  { code: "uk", label: "Українська" },
  { code: "hi", label: "हिन्दी" },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const saved = params.saved === "1";
  const locale = await getLocale();

  const t = await getTranslations("settings");
  const ta = await getTranslations("auth");
  const tc = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {tc("appName")}
            </h1>
          </div>

          <UserMenu userName={user.name} isScrumMaster={user.isScrumMaster} />
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto w-full max-w-md space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h2>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("name")}</p>
              <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {user.name}
              </p>
            </div>

            <form action={updateUserProfile} className="space-y-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 transition-colors select-none hover:border-amber-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-amber-700">
                <input
                  type="checkbox"
                  name="isScrumMaster"
                  defaultChecked={user.isScrumMaster}
                  className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-600"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{ta("scrumMaster")}</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{ta("scrumMasterDesc")}</p>
                </div>
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {tc("save")}
              </button>
            </form>

            {saved && (
              <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-400">
                {t("saved")}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("language")}</p>
            <form action={setLocale}>
              <select
                name="locale"
                defaultValue={locale}
                className="block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                {AVAILABLE_LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {tc("save")}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
