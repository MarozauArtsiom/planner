"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { regenerateInviteToken } from "@/app/actions/project";

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

  const loadInviteUrl = async () => {
    const res = await fetch(`/api/project/${projectId}/invite`);
    if (res.ok) {
      const data = await res.json();
      setInviteUrl(data.inviteUrl);
    }
  };

  if (!inviteUrl) {
    loadInviteUrl();
  }

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
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
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
      </div>
    </div>
  );
}
