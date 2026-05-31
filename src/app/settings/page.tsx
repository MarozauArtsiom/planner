import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/current-user";
import { setLocale } from "@/app/actions/locale";
import { UserMenu } from "@/components/user-menu";
import {
  PageShell,
  PageHeader,
  Card,
  SectionHeader,
  Button,
  IconButton,
} from "@/components/ui";

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
  const tc = await getTranslations("common");

  return (
    <PageShell
      variant="app"
      header={
        <PageHeader
          leading={
            <>
              <Link href="/" aria-label={tc("back")}>
                <IconButton label={tc("back")} variant="ghost" size="sm">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </IconButton>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2.5 text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm dark:from-blue-400 dark:to-blue-600">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09Z"
                    />
                  </svg>
                </span>
                <span className="text-base font-semibold tracking-tight">
                  {tc("appName")}
                </span>
              </Link>
            </>
          }
          trailing={<UserMenu userName={user.name} />}
        />
      }
    >
      <div className="mx-auto w-full max-w-md space-y-6 px-4 py-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h2>

        {saved && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            ✓ {t("saved")}
          </p>
        )}

        {/* Profile */}
        <Card>
          <SectionHeader>{t("name")}</SectionHeader>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {user.name}
          </p>
        </Card>

        {/* Language */}
        <Card>
          <SectionHeader>{t("language")}</SectionHeader>
          <form action={setLocale} className="space-y-3">
            <select
              name="locale"
              defaultValue={locale}
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-blue-400"
            >
              {AVAILABLE_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="primary" size="md" block>
              {tc("save")}
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
