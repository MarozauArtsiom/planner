import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { RetroBoardView } from "@/components/retro/retro-board-view";
import { RetroGuestJoinForm } from "./retro-guest-join-form";

export default async function RetroBoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const board = await prisma.retroBoard.findUnique({
    where: { inviteToken: token },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!board) notFound();

  const user = await getCurrentUser();

  if (!user) {
    return (
      <RetroGuestJoinForm
        inviteToken={board.inviteToken}
        boardTitle={board.title}
        projectName={board.project.name}
      />
    );
  }

  // Если залогиненный пользователь (или гость с сессией) зашёл по ссылке доски —
  // регистрируем его как участника этой ретро-доски
  await prisma.retroParticipant
    .upsert({
      where: { boardId_userId: { boardId: board.id, userId: user.id } },
      create: { boardId: board.id, userId: user.id },
      update: { lastSeenAt: new Date() },
    })
    .catch(() => undefined);

  return <RetroBoardView inviteToken={board.inviteToken} />;
}
