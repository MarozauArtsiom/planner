"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  deleteRetroBoard,
  toggleRetroActionItem,
  convertActionItemToTicket,
} from "@/app/actions/retro";
import { RetroCreateForm } from "@/components/retro/retro-create-modal";
import { UserMenu } from "@/components/user-menu";
import { EstimationToast } from "@/components/estimation-toast";
import {
  PageShell,
  Card,
  Button,
  Badge,
  SectionHeader,
} from "@/components/ui";

interface RetroBoardSummary {
  id: string;
  title: string;
  inviteToken: string;
  template: string;
  phase: string;
  sprintName: string | null;
  createdByName: string;
  createdById: string;
  createdAt: string;
  cardsCount: number;
  actionItemsCount: number;
  participantsCount: number;
}

interface ActionItemSummary {
  id: string;
  title: string;
  status: string;
  assigneeName: string | null;
  dueDate: string | null;
  boardTitle: string;
  boardInviteToken: string;
  convertedTicketId: string | null;
  convertedTicketTitle: string | null;
  convertedTicketSp: number | null;
}

interface Props {
  project: {
    id: string;
    name: string;
    activeSprintId: string | null;
    sprints: { id: string; name: string }[];
  };
  boards: RetroBoardSummary[];
  actionItems: ActionItemSummary[];
  user: {
    id: string;
    name: string;
    role: string | null;
    hasSmRights: boolean;
    isScrumMaster: boolean;
  };
}

const ROLE_STYLES: Record<string, string> = {
  DEV: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  BA: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

export function ProjectRetroClient({
  project,
  boards,
  actionItems,
  user,
}: Props) {
  const t = useTranslations("retro");
  const tp = useTranslations("project");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(boards.length === 0);

  const openActionItems = actionItems.filter((a) => a.status === "OPEN");
  const doneActionItems = actionItems.filter((a) => a.status === "DONE");

  const roleBadge = user.role ? (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[user.role] ?? ""}`}
    >
      {user.role === "DEV"
        ? tp("roleDev")
        : user.role === "QA"
          ? tp("roleQa")
          : user.role === "BA"
            ? tp("roleBa")
            : user.role}
    </span>
  ) : undefined;

  const act = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <PageShell variant="app">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 md:px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/project/${project.id}`}
              className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
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
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {project.name}
                </h1>
                <Badge tone="success" size="xs">
                  {t("moduleBadge")}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("projectHubSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 border-r border-zinc-200 pr-4 sm:flex dark:border-zinc-700">
              <Link
                href={`/project/${project.id}`}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                {t("ganttPlanLink")}
              </Link>
              <Link
                href={`/project/${project.id}/estimation`}
                className="text-sm text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {tp("estimation")}
              </Link>
              {user.hasSmRights && (
                <Link
                  href={`/project/${project.id}/settings`}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  {tp("settings")}
                </Link>
              )}
            </div>
            <UserMenu
              userName={user.name}
              isScrumMaster={user.isScrumMaster || user.hasSmRights}
              roleBadge={roleBadge}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
        {/* Top Banner + Create Toggle */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("projectBoardsHeading")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("projectBoardsDesc")}
            </p>
          </div>
          <Button
            variant={showCreateForm ? "secondary" : "primary"}
            size="md"
            onClick={() => setShowCreateForm((v) => !v)}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              {showCreateForm ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              )}
            </svg>
            {showCreateForm ? t("hideCreateForm") : t("newRetroBoard")}
          </Button>
        </div>

        {showCreateForm && (
          <Card variant="default">
            <SectionHeader marginBottom="mb-1">
              {t("createBoardHeading")}
            </SectionHeader>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("createBoardDesc")}
            </p>
            <div className="mt-4">
              <RetroCreateForm
                projects={[project]}
                fixedProjectId={project.id}
                onCancel={
                  boards.length > 0 ? () => setShowCreateForm(false) : undefined
                }
              />
            </div>
          </Card>
        )}

        {/* Action Items Carry-over Tracker */}
        {actionItems.length > 0 && (
          <Card variant="default">
            <SectionHeader marginBottom="mb-1">
              {`${t("teamActionItemsTitle")} (${openActionItems.length} ${t("openCountLabel")})`}
            </SectionHeader>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("teamActionItemsDesc")}
            </p>
            <div className="mt-4 space-y-2">
              {openActionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 px-3.5 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => act(() => toggleRetroActionItem(item.id))}
                      disabled={isPending}
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-amber-400 bg-white hover:border-emerald-500 dark:border-amber-700 dark:bg-zinc-900"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Link
                          href={`/retro/${item.boardInviteToken}`}
                          className="hover:underline"
                        >
                          {item.boardTitle}
                        </Link>
                        {item.assigneeName && (
                          <span>· {item.assigneeName}</span>
                        )}
                        {item.dueDate && <span>· {item.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.convertedTicketId ? (
                      <Link
                        href={`/project/${project.id}/estimation`}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
                      >
                        {t("inBacklogBadge")}
                        {item.convertedTicketSp != null
                          ? ` (${item.convertedTicketSp} SP)`
                          : ""}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          act(() => convertActionItemToTicket(item.id))
                        }
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-400 dark:hover:bg-blue-950/40"
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
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                        {t("convertToTicketBtn")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {doneActionItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/50 px-3.5 py-2 opacity-70 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => act(() => toggleRetroActionItem(item.id))}
                      disabled={isPending}
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-emerald-500 bg-emerald-500 text-white"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </button>
                    <span className="truncate text-sm text-zinc-500 line-through dark:text-zinc-400">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {item.boardTitle}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <Card variant="default" className="py-12 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("noBoardsYet")}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => {
              const isCompleted = board.phase === "COMPLETED";
              const canDelete =
                user.hasSmRights || board.createdById === user.id;
              return (
                <Card
                  key={board.id}
                  variant="flush"
                  className="group relative overflow-hidden transition-all hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800"
                >
                  <Link
                    href={`/retro/${board.inviteToken}`}
                    className="absolute inset-0 z-0 rounded-xl"
                    aria-label={board.title}
                  />
                  <div className="relative z-10 flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            tone={isCompleted ? "neutral" : "success"}
                            size="xs"
                          >
                            {t(`phase_${board.phase}` as "phase_COLLECT")}
                          </Badge>
                          {board.sprintName && (
                            <Badge tone="info" size="xs">
                              {board.sprintName}
                            </Badge>
                          )}
                        </div>
                        <h3 className="mt-1.5 truncate text-base font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-50 dark:group-hover:text-emerald-400">
                          {board.title}
                        </h3>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            act(() => deleteRetroBoard(board.id));
                          }}
                          disabled={isPending}
                          className="relative z-20 rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          title={t("deleteBoardBtn")}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.75}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        {t(
                          `template_${board.template}` as "template_WENT_WELL_TO_IMPROVE",
                        )}
                      </span>
                      <span>·</span>
                      <span>
                        {board.cardsCount} {t("cardsCountLabel")}
                      </span>
                      <span>·</span>
                      <span>
                        {board.actionItemsCount} {t("actionsCountLabel")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[11px] text-zinc-400 dark:border-zinc-800/80 dark:text-zinc-500">
                      <span>
                        {new Date(board.createdAt).toLocaleDateString()} ·{" "}
                        {board.createdByName}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {t("openBoardLink")} →
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EstimationToast projectId={project.id} />
    </PageShell>
  );
}
