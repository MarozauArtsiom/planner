import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createQuickRoom } from "@/app/actions/quick-room";
import { PokerLandingForm } from "./poker-landing-form";

export default async function PokerLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ join?: string; error?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("quickRoom");
  const tc = await getTranslations("common");

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("landingTitle")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("landingSubtitle")}
          </p>
        </div>

        {params.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {params.error}
          </p>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <PokerLandingForm
            currentUser={user}
            createAction={createQuickRoom}
          />
        </div>

        <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          <Link
            href="/"
            className="hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {tc("backToApp")}
          </Link>
        </div>
      </div>
    </div>
  );
}
