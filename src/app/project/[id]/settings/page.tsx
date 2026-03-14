"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createInviteLink,
  deleteInviteLink,
  toggleMemberSm,
  updateMemberRole,
} from "@/app/actions/project";

const ROLE_LABELS: Record<string, string> = {
  DEV: "Developer",
  QA: "QA Engineer",
};

const ROLE_STYLES: Record<string, string> = {
  DEV: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const ROLE_ACTIVE: Record<string, string> = {
  DEV: "border-indigo-400 bg-indigo-100 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
  QA: "border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
};

interface ProjectMemberItem {
  userId: string;
  name: string;
  role: string | null;
  isScrumMaster: boolean;
  userIsScrumMaster: boolean;
}

interface InviteLinkItem {
  id: string;
  token: string;
  url: string;
  grantsSm: boolean;
  label: string | null;
  createdAt: string;
}

export default function ProjectSettingsPage() {
  return <ProjectSettingsContent />;
}

function ProjectSettingsContent() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [links, setLinks] = useState<InviteLinkItem[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkSm, setNewLinkSm] = useState(false);

  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const loadLinks = useCallback(async () => {
    const res = await fetch(`/api/project/${projectId}/invite`);
    if (res.ok) {
      const data = await res.json();
      setLinks(data.links);
    }
    setLinksLoading(false);
  }, [projectId]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/project/${projectId}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
    }
    setMembersLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadLinks();
    loadMembers();
  }, [loadLinks, loadMembers]);

  const handleCopy = async (url: string, linkId: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = () => {
    startTransition(async () => {
      const result = await createInviteLink(projectId, newLinkSm);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        setNewLinkSm(false);
        loadLinks();
      }
    });
  };

  const handleDeleteLink = (linkId: string) => {
    startTransition(async () => {
      const result = await deleteInviteLink(linkId, projectId);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
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

  const handleRoleChange = (targetUserId: string, newRole: string | null) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === targetUserId ? { ...m, role: newRole } : m,
      ),
    );

    startTransition(async () => {
      const result = await updateMemberRole(projectId, targetUserId, newRole);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
        loadMembers();
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

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Invite Links */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Invite-ссылки
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Создавайте ссылки для приглашения участников. Каждая ссылка может давать права SM.
          </p>

          {linksLoading ? (
            <p className="text-sm text-zinc-400">Загрузка...</p>
          ) : links.length === 0 ? (
            <p className="mb-4 text-sm text-zinc-400">Нет ссылок</p>
          ) : (
            <div className="mb-4 space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="rounded-lg border border-zinc-100 px-4 py-3 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={link.url}
                      className="block flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(link.url, link.id)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      {copiedId === link.id ? "Скопировано" : "Копировать"}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      link.grantsSm
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {link.grantsSm ? "Scrum Master" : "Участник"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={isPending}
                      className="text-xs text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={newLinkSm}
                onChange={(e) => setNewLinkSm(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-600"
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Давать права SM</span>
            </label>
            <button
              type="button"
              onClick={handleCreateLink}
              disabled={isPending}
              className="ml-auto rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isPending ? "..." : "+ Создать ссылку"}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Участники
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Управляйте ролями и правами участников проекта.
          </p>

          {membersLoading ? (
            <p className="text-sm text-zinc-400">Загрузка...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-zinc-400">Нет участников</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="rounded-xl border border-zinc-100 px-5 py-4 dark:border-zinc-800"
                >
                  {/* Name + global SM badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {member.name}
                      </p>
                    </div>
                    {member.userIsScrumMaster && (
                      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        SM (глобальный)
                      </span>
                    )}
                  </div>

                  {/* Role selector */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Роль в проекте</p>
                    <div className="flex gap-2">
                      {(["DEV", "QA"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRoleChange(member.userId, member.role === r ? null : r)}
                          disabled={isPending}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                            member.role === r
                              ? ROLE_ACTIVE[r]
                              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                          }`}
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleRoleChange(member.userId, null)}
                        disabled={isPending || member.role === null}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                          member.role === null
                            ? "border-zinc-400 bg-zinc-200 text-zinc-700 dark:border-zinc-500 dark:bg-zinc-700 dark:text-zinc-300"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                        }`}
                      >
                        —
                      </button>
                    </div>
                  </div>

                  {/* SM toggle */}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">SM в проекте</p>
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
