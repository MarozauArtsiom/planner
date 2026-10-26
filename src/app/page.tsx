import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/current-user";
import { createProject } from "@/app/actions/project";
import { prisma } from "@/lib/db";
import { UserMenu } from "@/components/user-menu";
import { LandingPage } from "@/components/landing-page";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Input,
  Badge,
  IconButton,
} from "@/components/ui";

async function handleCreateProject(formData: FormData) {
  "use server";
  await createProject(formData);
}

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingPage />;
  }

  // Guest-юзеры (созданные для Quick Poker или Retro по ссылке) не имеют доступа к dashboard
  if (user.isGuest) {
    const latestRetro = await prisma.retroParticipant.findFirst({
      where: { userId: user.id },
      include: { board: { select: { inviteToken: true } } },
      orderBy: { lastSeenAt: "desc" },
    });
    if (latestRetro) {
      redirect(`/retro/${latestRetro.board.inviteToken}`);
    }
    redirect("/poker");
  }

  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id, project: { isQuick: false } },
    include: {
      project: {
        include: {
          owner: { select: { name: true } },
          _count: { select: { members: true, retroBoards: true } },
          retroActionItems: {
            where: { status: "OPEN" },
            select: {
              id: true,
              title: true,
              dueDate: true,
              assignee: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const allOpenActions = memberships.flatMap(({ project }) =>
    project.retroActionItems.map((item) => ({
      ...item,
      projectId: project.id,
      projectName: project.name,
    })),
  );

  const memberCountLabel = (n: number) =>
    n === 1
      ? t("memberCount1")
      : n < 5
        ? t("memberCount234")
        : t("memberCount5plus");

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
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500">
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
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                  />
                </svg>
              </span>
              <span className="text-base font-semibold tracking-tight">
                {tc("appName")}
              </span>
            </Link>
          }
          trailing={
            <>
              <Link
                href="/poker"
                className="hidden items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 sm:inline-flex dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
              >
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
                    d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                  />
                </svg>
                {tc("planningPokerNav")}
              </Link>
              <Link
                href="/retro"
                className="hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 sm:inline-flex dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
              >
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                {tc("sprintRetroNav")}
              </Link>
              <UserMenu userName={user.name} />
            </>
          }
        />
      }
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        {/* Greeting + page title */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("greeting", { name: user.name })}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("yourProjects")}
            </h2>
          </div>

          {/* Quick launch pills on mobile & desktop */}
          <div className="flex flex-wrap items-center gap-2 sm:hidden">
            <Link
              href="/poker"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            >
              {tc("planningPokerNav")}
            </Link>
            <Link
              href="/retro"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {tc("sprintRetroNav")}
            </Link>
          </div>
        </div>

        {/* Create project — inline form, primary action */}
        <Card variant="default" className="mb-8">
          <form
            action={handleCreateProject}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Input
              name="name"
              type="text"
              required
              placeholder={t("projectNamePlaceholder")}
              size="md"
              className="flex-1"
            />
            <Button type="submit" variant="primary" size="md">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              {t("createProject")}
            </Button>
          </form>
        </Card>

        {/* Open Retro Action Items summary widget */}
        {allOpenActions.length > 0 && (
          <Card
            variant="default"
            className="mb-8 border-amber-200/80 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/15"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("openRetroActionsTitle", {
                      count: allOpenActions.length,
                    })}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("openRetroActionsSubtitle")}
                  </p>
                </div>
              </div>
              <Link
                href="/retro"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {t("openRetroHubLink")} →
              </Link>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {allOpenActions.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/project/${item.projectId}/retro`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-amber-200/70 bg-white px-3 py-2 text-xs transition-colors hover:border-amber-300 dark:border-amber-900/40 dark:bg-zinc-900 dark:hover:border-amber-800"
                >
                  <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                    {item.title}
                  </span>
                  <Badge tone="neutral" size="xs">
                    {item.projectName}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Projects grid OR empty state */}
        {memberships.length === 0 ? (
          <EmptyDashboard />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ project, isScrumMaster: memberSm }) => {
              const isOwner = project.ownerId === user.id;
              const canManage = memberSm || isOwner;
              const openActionsCount = project.retroActionItems.length;
              return (
                <Card
                  key={project.id}
                  variant="flush"
                  className="group relative overflow-hidden transition-all hover:border-blue-300 hover:shadow-md dark:hover:border-blue-800"
                >
                  {/* Card-wide click area to project */}
                  <Link
                    href={`/project/${project.id}`}
                    className="absolute inset-0 z-0 rounded-xl"
                    aria-label={project.name}
                  />

                  <div className="relative z-10 flex flex-col gap-3 p-5">
                    {/* Header — title + settings cog */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 truncate text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                        {project.name}
                      </h3>
                      {canManage && (
                        <Link
                          href={`/project/${project.id}/settings`}
                          className="relative z-20 -mr-1 -mt-1"
                          aria-label={t("projectSettings")}
                        >
                          <IconButton
                            label={t("projectSettings")}
                            variant="ghost"
                            size="sm"
                          >
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
                                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                            </svg>
                          </IconButton>
                        </Link>
                      )}
                    </div>

                    {/* Meta — owner + member count + role badges */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{t("owner", { name: project.owner.name })}</span>
                      <span aria-hidden="true" className="opacity-40">
                        ·
                      </span>
                      <span>
                        {project._count.members}{" "}
                        {memberCountLabel(project._count.members)}
                      </span>
                      {isOwner && (
                        <Badge tone="info" size="xs">
                          {t("ownerBadgeShort")}
                        </Badge>
                      )}
                    </div>

                    {/* Module quick-actions — Gantt Plan, Estimation, Retro */}
                    <div className="relative z-20 mt-1 flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/project/${project.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
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
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                          />
                        </svg>
                        {t("ganttPlanBtn")}
                      </Link>
                      <Link
                        href={`/project/${project.id}/estimation`}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
                      >
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
                            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
                          />
                        </svg>
                        {t("estimation")}
                      </Link>
                      <Link
                        href={`/project/${project.id}/retro`}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                      >
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
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                          />
                        </svg>
                        {t("retroBtn")}
                        {openActionsCount > 0 && (
                          <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                            {openActionsCount}
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

async function EmptyDashboard() {
  const t = await getTranslations("home");
  return (
    <Card variant="default" className="py-16">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md dark:from-blue-500 dark:to-blue-700">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("noProjectsTitleNew")}
        </h3>
        <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
          {t("noProjectsSm")}
        </p>
      </div>
    </Card>
  );
}
