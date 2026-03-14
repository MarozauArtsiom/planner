"use client";

import { useActionState } from "react";
import { createTicket } from "@/app/actions/estimation";

type ActionState = { error?: string; success?: boolean } | undefined;

export function TicketForm({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await createTicket(projectId, formData);
      if (result && "success" in result) {
        onSuccess();
      }
      return result;
    },
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <input name="externalId" type="text" placeholder="ID (PROJ-123)" className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500" />
      </div>
      <div>
        <input name="title" type="text" required placeholder="Название тикета *" className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500" />
      </div>
      <div>
        <input name="externalUrl" type="url" placeholder="Ссылка на трекер" className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500" />
      </div>
      <div>
        <textarea name="description" rows={2} placeholder="Описание" className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500" />
      </div>
      <div>
        <textarea name="acceptanceCriteria" rows={2} placeholder="Acceptance Criteria" className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500" />
      </div>
      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <button type="submit" disabled={isPending} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600">
        {isPending ? "Добавление..." : "Добавить тикет"}
      </button>
    </form>
  );
}
