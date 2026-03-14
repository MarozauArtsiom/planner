"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { regenerateInviteToken, toggleMemberSm } from "@/app/actions/project";

const ROLE_LABELS: Record<string, string> = {
  DEV: "Developer",
  QA: "QA Engineer",
};

const ROLE_STYLES: Record<string, string> = {
  DEV: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

interface ProjectMemberItem {
  userId: string;
  name: string;
  role: string;
  isScrumMaster: boolean;
  userIsScrumMaster: boolean;
}

export default function ProjectSettingsPage() {
  return <ProjectSettingsContent />;
}

function ProjectSettingsContent() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const loadInviteUrl = async () => {
    const res = await fetch(`/api/project/${projectId}/invite`);
    if (res.ok) {
      const data = await res.json();
      setInviteUrl(data.inviteUrl);
    }
  };

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/project/${projectId}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
    }
    setMembersLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadInviteUrl();
    loadMembers();
  }, [loadMembers]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    startTransition(async () => {
      const result = await regenerateInviteToken(projectId);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        setInviteUrl(null);
        setCopied(false);
        loadInviteUrl();
      }
    });
  };

  const handleToggleSm = (targetUserId: string) => {
    startTransition(async () => {
      const result = await toggleMemberSm(projectId, targetUserId);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === targetUserId
              ? { ...m, isScrumMaster: !m.isScrumMaster }
              : m,
          ),
        );
      }
    });
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Назад к проекту
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Настройки проекта
          </h1>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Invite-ссылка
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Отправьте эту ссылку команде. Любой, кто перейдёт по ней, сможет присоединиться к проекту.
          </p>

          {inviteUrl ? (
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="block flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Загрузка...</p>
          )}

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isPending}
            className="mt-4 text-sm text-zinc-500 transition-colors hover:text-red-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-red-400"
          >
            {isPending ? "Обновление..." : "Перегенерировать ссылку"}
          </button>

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Участники
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Управляйте правами Скрам Мастера для участников проекта.
          </p>

          {membersLoading ? (
            <p className="text-sm text-zinc-400">Загрузка...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-zinc-400">Нет участников</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {member.name}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_STYLES[member.role] ?? ""}`}
                        >
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        {member.userIsScrumMaster && (
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            SM
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          SM в проекте
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={member.isScrumMaster}
                          onClick={() => handleToggleSm(member.userId)}
                          disabled={isPending}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
                            member.isScrumMaster
                              ? "bg-amber-500"
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                              member.isScrumMaster
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
