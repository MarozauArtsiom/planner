import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { joinProject } from "@/app/actions/project";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const project = await prisma.project.findUnique({
    where: { inviteToken: token },
  });
  if (!project) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/invite/${token}`);

  const existing = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: user.id, projectId: project.id },
    },
  });
  if (existing) redirect(`/project/${project.id}`);

  async function handleJoin() {
    "use server";
    await joinProject(token);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Присоединиться к проекту
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Вас приглашают в проект{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {project.name}
            </span>
          </p>
        </div>

        <form action={handleJoin}>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Присоединиться
          </button>
        </form>
      </div>
    </div>
  );
}
