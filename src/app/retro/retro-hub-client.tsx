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
import {
  RetroCreateForm,
  type ProjectWithSprintsOption,
} from "@/components/retro/retro-create-modal";
import { UserMenu } from "@/components/user-menu";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  SectionHeader,
} from "@/components/ui";

interface HubBoard {
  id: string;
  title: string;
  inviteToken: string;
  template: string;
  phase: string;
  projectId: string;
  projectName: string;
  sprintName: string | null;
  createdByName: string;
  createdById: string;
  canDelete: boolean;
  createdAt: string;
  cardsCount: number;
  actionItemsCount: number;
}

interface HubActionItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  boardTitle: string;
  boardInviteToken: string;
  assigneeName: string | null;
  dueDate: string | null;
  convertedTicketId: string | null;
  convertedTicketSp: number | null;
}

interface Props {
  user: { id: string; name: string };
  projects: ProjectWithSprintsOption[];
  boards: HubBoard[];
  openActionItems: HubActionItem[];
}

export function RetroHubClient({
  user,
  projects,
  boards,
  openActionItems,
}: Props) {
  const t = useTranslations("retro");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(boards.length === 0);

  const act = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <PageShell
      variant="app"
      header={
        <PageHeader
          leading={
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2.5 text-zinc-900 transition-colors hover:text-emerald-600 dark:text-zinc-50 dark:hover:text-emerald-400"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm dark:bg-emerald-500">
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
                </span>
                <span className="text-base font-semibold tracking-tight">
                  {tc("appName")}
                </span>
              </Link>
              <Badge tone="success" size="xs">
                {t("moduleBadge")}
              </Badge>
            </div>
          }
          trailing={
            <>
              <Link
                href="/"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                {t("backToDashboard")}
              </Link>
              <Link
                href="/poker"
                className="hidden items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 sm:inline-flex dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
              >
                {tc("planningPokerNav")}
              </Link>
              <UserMenu userName={user.name} />
            </>
          }
        />
      }
    >
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
        {/* Hero section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              {t("hubEyebrow")}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("hubTitle")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              {t("hubSubtitle")}
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

        {/* Create Board Card */}
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
                projects={projects}
                onCancel={
                  boards.length > 0 ? () => setShowCreateForm(false) : undefined
                }
              />
            </div>
          </Card>
        )}

        {/* Open Action Items across all projects */}
        {openActionItems.length > 0 && (
          <Card variant="default">
            <SectionHeader marginBottom="mb-1">
              {`${t("openActionItemsHubTitle")} (${openActionItems.length})`}
            </SectionHeader>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("openActionItemsHubDesc")}
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
                          href={`/project/${item.projectId}/retro`}
                          className="font-semibold text-zinc-700 hover:underline dark:text-zinc-300"
                        >
                          {item.projectName}
                        </Link>
                        <span>·</span>
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
                        href={`/project/${item.projectId}/estimation`}
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
                        + {t("convertToTicketBtn")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Boards Grid */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t("recentBoardsHeading")}
          </h2>
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              tone={isCompleted ? "neutral" : "success"}
                              size="xs"
                            >
                              {t(`phase_${board.phase}` as "phase_COLLECT")}
                            </Badge>
                            <Badge tone="neutral" size="xs">
                              {board.projectName}
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

                        {board.canDelete && (
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
      </div>
    </PageShell>
  );
}
