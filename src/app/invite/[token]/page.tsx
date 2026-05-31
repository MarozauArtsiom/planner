import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { InviteForm } from "./invite-form";
import { UserMenu } from "@/components/user-menu";
import { PageShell, PageHeader, Card } from "@/components/ui";

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
    <PageShell
      variant="app"
      header={
        <PageHeader
          leading={
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
          }
          trailing={<UserMenu userName={user.name} />}
        />
      }
    >
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <header className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg dark:from-blue-400 dark:to-blue-600">
              <svg
                className="h-8 w-8"
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

            <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("joinProject")}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {t("invitedToProject")}{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {link.project.name}
              </span>
            </p>
          </header>

          <Card variant="default">
            <InviteForm token={token} grantsSm={link.grantsSm} />
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
