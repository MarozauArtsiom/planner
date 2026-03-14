import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { isScrumMaster } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { logout } from "@/app/actions/auth";

const ROLE_LABELS: Record<string, string> = {
  DEV: "Developer",
  QA: "QA Engineer",
  SCRUM_MASTER: "Scrum Master",
};

const ROLE_STYLES: Record<string, string> = {
  DEV: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  SCRUM_MASTER:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: id } },
    include: { project: true },
  });
  if (!membership) notFound();

  const project = membership.project;
  const sm = isScrumMaster(user);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
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
              {project.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {user.name}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[user.role] ?? ""}`}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 dark:border-zinc-700">
              <Link
                href={`/project/${id}/estimation`}
                className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Оценка
              </Link>
              {sm && (
                <Link
                  href={`/project/${id}/settings`}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Настройки
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                >
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-6 text-center">
          <div className="rounded-xl border border-zinc-200 bg-white p-12 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">
              {sm
                ? "Диаграмма Ганта — вы можете создавать спринты, назначать и перетаскивать задачи"
                : "Диаграмма Ганта — режим просмотра. Изменения Scrum Master отображаются в реальном времени"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
