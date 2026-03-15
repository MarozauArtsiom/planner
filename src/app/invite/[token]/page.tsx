import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { InviteForm } from "./invite-form";
import { UserMenu } from "@/components/user-menu";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const link = await prisma.inviteLink.findUnique({
    where: { token },
    include: { project: true },
  });
  if (!link) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/invite/${token}`);

  const existing = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: user.id, projectId: link.projectId },
    },
  });
  if (existing) redirect(`/project/${link.projectId}`);

  const t = await getTranslations("invite");
  const tc = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {tc("appName")}
          </h1>

          <UserMenu userName={user.name} isScrumMaster={user.isScrumMaster} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
            <svg
              className="h-8 w-8 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("joinProject")}
            </h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {t("invitedToProject")}{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {link.project.name}
              </span>
            </p>
          </div>

          <InviteForm token={token} grantsSm={link.grantsSm} />
        </div>
      </main>
    </div>
  );
}
