"use client";

import { useState, useActionState } from "react";
import { useTranslations } from "next-intl";
import { joinProject } from "@/app/actions/project";
import { Button, Badge } from "@/components/ui";

type Role = "DEV" | "QA" | "BA";
type ActionState = { error?: string } | undefined;

const ROLE_ICONS: Record<Role, string> = {
  DEV: "M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5",
  QA: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  BA: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
};

/** Active-state classes per role — match project role colour convention. */
const ROLE_ACTIVE: Record<Role, string> = {
  DEV: "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300",
  QA: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300",
  BA: "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-300",
};

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

  const roles: { role: Role; label: string; desc: string }[] = [
    { role: "DEV", label: t("developer"), desc: t("devDesc") },
    { role: "QA", label: t("qaEngineer"), desc: t("qaDesc") },
    { role: "BA", label: t("businessAnalyst"), desc: t("baDesc") },
  ];

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("yourRole")}
          <span className="ml-1 font-normal text-zinc-400">{t("optional")}</span>
        </legend>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {roles.map((r) => {
            const active = selectedRole === r.role;
            return (
              <button
                key={r.role}
                type="button"
                onClick={() => toggleRole(r.role)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-5 transition-all ${
                  active
                    ? ROLE_ACTIVE[r.role] + " shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
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
                    d={ROLE_ICONS[r.role]}
                  />
                </svg>
                <span className="text-sm font-semibold leading-tight">
                  {r.label}
                </span>
                <span className="text-[11px] leading-tight opacity-75">
                  {r.desc}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {grantsSm && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 dark:bg-amber-950/30">
          <Badge tone="warning" size="xs" className="mt-0.5 flex-shrink-0">
            SM
          </Badge>
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            {t("smRightsGranted")}
          </p>
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        variant="primary"
        size="lg"
        block
      >
        {isPending ? t("joinPending") : t("joinButton")}
      </Button>
    </form>
  );
}
