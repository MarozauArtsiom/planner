"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createRetroBoard } from "@/app/actions/retro";
import {
  RETRO_TEMPLATES,
  TEMPLATE_COLUMNS,
  type RetroTemplate,
} from "@/lib/retro";
import { Button, Field, Input, Checkbox } from "@/components/ui";

export interface ProjectWithSprintsOption {
  id: string;
  name: string;
  activeSprintId: string | null;
  sprints: {
    id: string;
    name: string;
  }[];
}

interface Props {
  projects: ProjectWithSprintsOption[];
  fixedProjectId?: string;
  onCancel?: () => void;
}

const COLOR_DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  zinc: "bg-zinc-500",
};

export function RetroCreateForm({
  projects,
  fixedProjectId,
  onCancel,
}: Props) {
  const t = useTranslations("retro");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialProjId =
    fixedProjectId ?? (projects.length > 0 ? projects[0].id : "__NEW__");
  const [selectedProjectId, setSelectedProjectId] =
    useState<string>(initialProjId);
  const currentProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    currentProject?.activeSprintId ?? "__NONE__",
  );
  const [template, setTemplate] = useState<RetroTemplate>(
    "WENT_WELL_TO_IMPROVE",
  );
  const [title, setTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hideCardsUntilReveal, setHideCardsUntilReveal] = useState(true);
  const [maxVotesPerUser, setMaxVotesPerUser] = useState(5);

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const found = projects.find((p) => p.id === projId);
    setSelectedSprintId(found?.activeSprintId ?? "__NONE__");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", title.trim() || t("defaultBoardTitle"));
      fd.set("template", template);
      fd.set("projectId", fixedProjectId ?? selectedProjectId);
      if (selectedProjectId === "__NEW__" && newProjectName.trim()) {
        fd.set("newProjectName", newProjectName.trim());
      }
      fd.set("sprintId", selectedSprintId);
      fd.set("isAnonymous", String(isAnonymous));
      fd.set("hideCardsUntilReveal", String(hideCardsUntilReveal));
      fd.set("maxVotesPerUser", String(maxVotesPerUser));

      const res = await createRetroBoard(fd);
      if (res && "error" in res) {
        setError(res.error ?? t("createError"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("boardTitleLabel")}>
          <Input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("boardTitlePlaceholder")}
            maxLength={120}
          />
        </Field>

        {!fixedProjectId ? (
          <Field label={t("teamWorkspaceLabel")}>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="__NEW__">+ {t("createNewTeamOption")}</option>
            </select>
          </Field>
        ) : (
          <Field label={t("linkedSprintLabel")} hint={t("linkedSprintHint")}>
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              <option value="__NONE__">{t("noSprintOption")}</option>
              {(currentProject?.sprints ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.id === currentProject?.activeSprintId
                    ? ` (${t("activeSprintTag")})`
                    : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {!fixedProjectId && selectedProjectId === "__NEW__" && (
        <Field label={t("newTeamNameLabel")}>
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder={t("newTeamNamePlaceholder")}
            maxLength={80}
          />
        </Field>
      )}

      {!fixedProjectId &&
        selectedProjectId !== "__NEW__" &&
        currentProject &&
        currentProject.sprints.length > 0 && (
          <Field label={t("linkedSprintLabel")} hint={t("linkedSprintHint")}>
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              <option value="__NONE__">{t("noSprintOption")}</option>
              {currentProject.sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.id === currentProject.activeSprintId
                    ? ` (${t("activeSprintTag")})`
                    : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

      {/* Выбор шаблона колонок */}
      <div>
        <label className="mb-2 block text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          {t("templateLabel")}
        </label>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {RETRO_TEMPLATES.map((tpl) => {
            const selected = template === tpl;
            const cols = TEMPLATE_COLUMNS[tpl];
            return (
              <button
                key={tpl}
                type="button"
                onClick={() => setTemplate(tpl)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                  selected
                    ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                }`}
              >
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {t(`template_${tpl}` as "template_WENT_WELL_TO_IMPROVE")}
                </span>
                <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t(
                    `templateDesc_${tpl}` as "templateDesc_WENT_WELL_TO_IMPROVE",
                  )}
                </span>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {cols.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${COLOR_DOT[c.color] ?? "bg-zinc-400"}`}
                      />
                      {t(c.titleKey as "colWentWell")}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Настройки приватности и лимита голосов */}
      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <Checkbox
          checked={hideCardsUntilReveal}
          onChange={(e) => setHideCardsUntilReveal(e.target.checked)}
          label={
            <span className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t("privateWritingLabel")}
              </span>
              <span className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t("privateWritingDesc")}
              </span>
            </span>
          }
        />
        <Checkbox
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          label={
            <span className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t("anonymousModeLabel")}
              </span>
              <span className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t("anonymousModeDesc")}
              </span>
            </span>
          }
        />
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("votesPerUserLabel")}
          </label>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {t("votesPerUserDesc")}
          </p>
          <input
            type="number"
            min={1}
            max={20}
            value={maxVotesPerUser}
            onChange={(e) =>
              setMaxVotesPerUser(
                Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 5)),
              )
            }
            className="mt-2 w-24 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isPending}
          >
            {tc("cancel")}
          </Button>
        )}
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? t("creatingBoard") : t("createBoardButton")}
        </Button>
      </div>
    </form>
  );
}
