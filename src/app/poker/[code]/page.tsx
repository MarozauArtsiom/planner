import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isQuickRoomExpired } from "@/lib/quick-room";
import { QuickRoomJoinForm } from "./quick-room-join-form";
import { QuickRoomBoard } from "./quick-room-board";
import { joinQuickRoomAsGuest } from "@/app/actions/quick-room";

export default async function QuickRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const accessCode = code.toUpperCase();
  const t = await getTranslations("quickRoom");

  const room = await prisma.project.findUnique({
    where: { accessCode },
    select: {
      id: true,
      ownerId: true,
      isQuick: true,
      expiresAt: true,
      estimationMethod: true,
      members: { select: { userId: true } },
    },
  });

  if (!room || !room.isQuick) notFound();
  if (isQuickRoomExpired(room.expiresAt)) {
    redirect(`/poker?error=${encodeURIComponent(t("roomExpired"))}`);
  }

  const userId = await getSession();
  const isMember = !!userId && room.members.some((m) => m.userId === userId);

  // Не member — показываем форму ника
  if (!isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("joinTitle")}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {t("joinSubtitle", { code: accessCode })}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <QuickRoomJoinForm
              accessCode={accessCode}
              joinAction={joinQuickRoomAsGuest.bind(null, accessCode)}
            />
          </div>
        </div>
      </div>
    );
  }

  return <QuickRoomBoard projectId={room.id} accessCode={accessCode} />;
}
