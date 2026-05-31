import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createQuickRoom } from "@/app/actions/quick-room";
import { logout } from "@/app/actions/auth";
import { PageShell, Card } from "@/components/ui";
import { PokerLandingForm } from "./poker-landing-form";

export default async function PokerLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string; error?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("quickRoom");
  const tc = await getTranslations("common");
  const tAuth = await getTranslations("auth");

  const userId = await getSession();
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, isGuest: true },
      })
    : null;

  // Если пришли с ?join=CODE — пересылаем на комнату
  if (params.join) {
    redirect(`/poker/${params.join.trim().toUpperCase()}`);
  }

  return (
    <PageShell variant="public">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-7">
          <header className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-zinc-900 transition-opacity hover:opacity-80 dark:text-zinc-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md dark:from-blue-400 dark:to-blue-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                  />
                </svg>
              </span>
              <span className="text-2xl font-bold tracking-tight">
                {t("landingTitle")}
              </span>
            </Link>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("landingSubtitle")}
            </p>
          </header>

          {params.error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {params.error}
            </p>
          )}

          <Card variant="default" className="p-6">
            <PokerLandingForm
              currentUser={user}
              createAction={createQuickRoom}
            />
          </Card>

          <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            {user ? (
              // Есть active session — кнопка выхода. После logout → /,
              // где landing будет показан (если нет session).
              <form action={logout} className="inline">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                    />
                  </svg>
                  {tAuth("logoutButton")}
                </button>
              </form>
            ) : (
              <Link
                href="/"
                className="hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                ← {tc("backToApp")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
