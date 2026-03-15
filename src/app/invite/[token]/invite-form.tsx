"use client";

import { useState, useActionState } from "react";
import { useTranslations } from "next-intl";
import { joinProject } from "@/app/actions/project";

type Role = "DEV" | "QA" | "BA";
type ActionState = { error?: string } | undefined;

export function InviteForm({
  token,
  grantsSm,
}: {
  token: string;
  grantsSm: boolean;
}) {
  const t = useTranslations("invite");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async () => {
      return await joinProject(token, selectedRole);
    },
    undefined,
  );

  const toggleRole = (role: Role) => {
    setSelectedRole((prev) => (prev === role ? null : role));
  };

  const roles = [
    {
      role: "DEV" as Role,
      label: t("developer"),
      desc: t("devDesc"),
      d: "M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5",
    },
    {
      role: "QA" as Role,
      label: t("qaEngineer"),
      desc: t("qaDesc"),
      d: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    },
    {
      role: "BA" as Role,
      label: t("businessAnalyst"),
      desc: t("baDesc"),
      d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
    },
  ];

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("yourRole")}
          <span className="ml-1 font-normal text-zinc-400">{t("optional")}</span>
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {roles.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => toggleRole(r.role)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-6 transition-all ${
                selectedRole === r.role
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={r.d}
                />
              </svg>
              <span className="text-sm font-semibold">{r.label}</span>
              <span className="text-xs opacity-70">{r.desc}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {grantsSm && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          {t("smRightsGranted")}
        </p>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending ? t("joinPending") : t("joinButton")}
      </button>
    </form>
  );
}
