import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { isScrumMaster } from "@/lib/permissions";
import { logout } from "@/app/actions/auth";
import { createProject } from "@/app/actions/project";
import { prisma } from "@/lib/db";
import { CopyInviteButton } from "@/components/copy-invite-button";

async function handleCreateProject(formData: FormData) {
  "use server";
  await createProject(formData);
}

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

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          owner: { select: { name: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const sm = isScrumMaster(user);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sprint Planner
          </h1>

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
                href="/settings"
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Настройки
              </Link>
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

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Привет, {user.name}
              </p>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Ваши проекты
              </h2>
            </div>
            {sm && (
              <form action={handleCreateProject} className="flex items-center">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Название проекта"
                  className="mr-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Создать
                </button>
              </form>
            )}
          </div>

          {memberships.length === 0 ? (
            sm ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                  </svg>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">
                  У вас пока нет проектов. Создайте первый проект выше.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto max-w-md text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
                    <svg className="h-7 w-7 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Нет активных проектов
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Scrum Master создаёт проект и отправляет вам invite-ссылку.
                    Перейдите по ней, чтобы присоединиться к команде.
                  </p>
                </div>

                <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      1
                    </div>
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      SM создаёт проект
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      2
                    </div>
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Вам приходит ссылка
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      3
                    </div>
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Вы в команде
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberships.map(({ project }) => (
                <div
                  key={project.id}
                  className="group relative rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800"
                >
                  <Link href={`/project/${project.id}`} className="absolute inset-0 rounded-xl" />
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Владелец: {project.owner.name}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        {project._count.members}{" "}
                        {project._count.members === 1
                          ? "участник"
                          : project._count.members < 5
                            ? "участника"
                            : "участников"}
                      </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-1">
                      <Link
                        href={`/project/${project.id}/estimation`}
                        className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                        title="Сессия оценки"
                      >
                        Оценка
                      </Link>
                      {sm && <CopyInviteButton inviteToken={project.inviteToken} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
