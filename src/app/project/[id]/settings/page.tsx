"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createInviteLink,
  deleteInviteLink,
  toggleMemberSm,
  updateMemberRole,
  updateProjectSettings,
  setActiveSprint,
  updateSpScale,
  resetSpScale,
} from "@/app/actions/project";
import { renderSprintName, DAY_NAMES } from "@/lib/date-utils";

const ROLE_LABELS: Record<string, string> = {
  DEV: "Developer",
  QA: "QA Engineer",
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

interface SpScaleItem {
  value: number;
  label: string;
  durationDays: number;
}

interface SprintItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface ProjectConfig {
  sprintDurationWeeks: number;
  sprintStartDay: number;
  sprintNameTemplate: string;
  taskCoefficient: number;
  activeSprintId: string | null;
  spScale: SpScaleItem[];
  sprints: SprintItem[];
}

const SECTION_CLASS = "rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900";
const SECTION_TITLE_CLASS = "mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400";
const SECTION_DESC_CLASS = "mb-4 text-sm text-zinc-500 dark:text-zinc-400";
const INPUT_CLASS = "block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const SELECT_CLASS = "block rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const BTN_PRIMARY_CLASS = "rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600";
const BTN_SECONDARY_CLASS = "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";
const LABEL_CLASS = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

export default function ProjectSettingsPage() {
  return <ProjectSettingsContent />;
}

function ProjectSettingsContent() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [links, setLinks] = useState<InviteLinkItem[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkSm, setNewLinkSm] = useState(false);

  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [draftDurationWeeks, setDraftDurationWeeks] = useState(1);
  const [draftStartDay, setDraftStartDay] = useState(3);
  const [draftNameTemplate, setDraftNameTemplate] = useState("Sprint {number}");
  const [draftCoefficient, setDraftCoefficient] = useState(1.0);
  const [draftActiveSprint, setDraftActiveSprint] = useState<string | null>(null);
  const [draftScale, setDraftScale] = useState<SpScaleItem[]>([]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2000);
  };

  const loadConfig = useCallback(async () => {
    const res = await fetch(`/api/project/${projectId}/settings`);
    if (res.ok) {
      const data: ProjectConfig = await res.json();
      setConfig(data);
      setDraftDurationWeeks(data.sprintDurationWeeks);
      setDraftStartDay(data.sprintStartDay);
      setDraftNameTemplate(data.sprintNameTemplate);
      setDraftCoefficient(data.taskCoefficient);
      setDraftActiveSprint(data.activeSprintId);
      setDraftScale(data.spScale);
    }
    setConfigLoading(false);
  }, [projectId]);

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
    loadConfig();
    loadLinks();
    loadMembers();
  }, [loadConfig, loadLinks, loadMembers]);

  const handleSaveSprintSettings = () => {
    startTransition(async () => {
      const result = await updateProjectSettings(projectId, {
        sprintDurationWeeks: draftDurationWeeks,
        sprintStartDay: draftStartDay,
        sprintNameTemplate: draftNameTemplate,
      });
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        showSuccess("Настройки спринта сохранены");
        loadConfig();
      }
    });
  };

  const handleSaveCoefficient = () => {
    startTransition(async () => {
      const result = await updateProjectSettings(projectId, {
        taskCoefficient: draftCoefficient,
      });
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        showSuccess("Коэффициент сохранён");
      }
    });
  };

  const handleSetActiveSprint = (sprintId: string | null) => {
    setDraftActiveSprint(sprintId);
    startTransition(async () => {
      const result = await setActiveSprint(projectId, sprintId);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        showSuccess("Активный спринт обновлён");
      }
    });
  };

  const handleSaveScale = () => {
    startTransition(async () => {
      const result = await updateSpScale(projectId, draftScale);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        showSuccess("Шкала SP сохранена");
        loadConfig();
      }
    });
  };

  const handleResetScale = () => {
    startTransition(async () => {
      const result = await resetSpScale(projectId);
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка");
      } else {
        showSuccess("Шкала сброшена к дефолту");
        loadConfig();
      }
    });
  };

  const handleAddScaleItem = () => {
    const existingValues = new Set(draftScale.map((s) => s.value));
    let newValue = 1;
    while (existingValues.has(newValue)) newValue++;
    setDraftScale([...draftScale, { value: newValue, label: "", durationDays: 1 }]);
  };

  const handleRemoveScaleItem = (index: number) => {
    setDraftScale(draftScale.filter((_, i) => i !== index));
  };

  const handleScaleChange = (index: number, field: keyof SpScaleItem, raw: string) => {
    setDraftScale(
      draftScale.map((item, i) => {
        if (i !== index) return item;
        if (field === "label") return { ...item, label: raw };
        const num = parseInt(raw) || 0;
        return { ...item, [field]: Math.max(field === "value" ? 1 : 1, num) };
      }),
    );
  };

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

  const nextSprintNumber = (config?.sprints.length ?? 0) + 1;
  const sprintNamePreview = renderSprintName(
    draftNameTemplate,
    nextSprintNumber,
    new Date(),
  );

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
        {success && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600 dark:bg-green-950/50 dark:text-green-400">
            {success}
          </p>
        )}

        {configLoading ? (
          <p className="text-sm text-zinc-400">Загрузка настроек...</p>
        ) : config ? (
          <>
            {/* Sprint Settings */}
            <div className={SECTION_CLASS}>
              <h2 className={SECTION_TITLE_CLASS}>Спринт</h2>
              <p className={SECTION_DESC_CLASS}>
                Длительность, день старта и шаблон именования спринтов.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className={LABEL_CLASS}>Длительность</label>
                    <select
                      value={draftDurationWeeks}
                      onChange={(e) => setDraftDurationWeeks(parseInt(e.target.value))}
                      className={`mt-1 ${SELECT_CLASS} w-full`}
                    >
                      {[1, 2, 3, 4].map((w) => (
                        <option key={w} value={w}>
                          {w} {w === 1 ? "неделя" : w < 5 ? "недели" : "недель"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={LABEL_CLASS}>День старта</label>
                    <select
                      value={draftStartDay}
                      onChange={(e) => setDraftStartDay(parseInt(e.target.value))}
                      className={`mt-1 ${SELECT_CLASS} w-full`}
                    >
                      {DAY_NAMES.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Шаблон имени спринта</label>
                  <input
                    type="text"
                    value={draftNameTemplate}
                    onChange={(e) => setDraftNameTemplate(e.target.value)}
                    className={`mt-1 ${INPUT_CLASS}`}
                    placeholder="Sprint {number}"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {["{number}", "{date}", "{quarter}", "{year}"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDraftNameTemplate((prev) => prev + v)}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">
                    Следующий спринт: <span className="font-medium text-zinc-600 dark:text-zinc-300">{sprintNamePreview}</span>
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSprintSettings}
                    disabled={isPending}
                    className={BTN_PRIMARY_CLASS}
                  >
                    {isPending ? "..." : "Сохранить"}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Sprint */}
            <div className={SECTION_CLASS}>
              <h2 className={SECTION_TITLE_CLASS}>Активный спринт</h2>
              <p className={SECTION_DESC_CLASS}>
                Борда автоматически скроллится к активному спринту при открытии.
              </p>

              {config.sprints.length === 0 ? (
                <p className="text-sm text-zinc-400">Нет спринтов</p>
              ) : (
                <select
                  value={draftActiveSprint ?? ""}
                  onChange={(e) => handleSetActiveSprint(e.target.value || null)}
                  className={`${SELECT_CLASS} w-full`}
                  disabled={isPending}
                >
                  <option value="">Не выбран</option>
                  {config.sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* SP Scale */}
            <div className={SECTION_CLASS}>
              <h2 className={SECTION_TITLE_CLASS}>Шкала Story Points</h2>
              <p className={SECTION_DESC_CLASS}>
                Определите значения SP, их описание (видно команде при голосовании) и длительность в рабочих днях на Ганте.
              </p>

              <div className="space-y-2">
                <div className="grid grid-cols-[60px_1fr_80px_32px] gap-2 text-[10px] font-semibold text-zinc-400 uppercase">
                  <span>SP</span>
                  <span>Описание</span>
                  <span>Дни</span>
                  <span />
                </div>
                {draftScale.map((item, i) => (
                  <div key={i} className="grid grid-cols-[60px_1fr_80px_32px] gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      value={item.value}
                      onChange={(e) => handleScaleChange(i, "value", e.target.value)}
                      className={`${INPUT_CLASS} text-center`}
                    />
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleScaleChange(i, "label", e.target.value)}
                      placeholder="Описание..."
                      className={INPUT_CLASS}
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.durationDays}
                      onChange={(e) => handleScaleChange(i, "durationDays", e.target.value)}
                      className={`${INPUT_CLASS} text-center`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveScaleItem(i)}
                      disabled={draftScale.length <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-red-500 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddScaleItem} className={BTN_SECONDARY_CLASS}>
                    + Добавить
                  </button>
                  <button type="button" onClick={handleResetScale} disabled={isPending} className={BTN_SECONDARY_CLASS}>
                    Сбросить
                  </button>
                </div>
                <button type="button" onClick={handleSaveScale} disabled={isPending} className={BTN_PRIMARY_CLASS}>
                  {isPending ? "..." : "Сохранить шкалу"}
                </button>
              </div>
            </div>

            {/* Task Coefficient */}
            <div className={SECTION_CLASS}>
              <h2 className={SECTION_TITLE_CLASS}>Коэффициент задач</h2>
              <p className={SECTION_DESC_CLASS}>
                Множитель длительности при назначении задач на Ганте. 1.0 = без изменений, 1.2 = +20%.
              </p>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className={LABEL_CLASS}>Коэффициент</label>
                  <input
                    type="number"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={draftCoefficient}
                    onChange={(e) => setDraftCoefficient(parseFloat(e.target.value) || 1.0)}
                    className={`mt-1 ${INPUT_CLASS}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveCoefficient}
                  disabled={isPending}
                  className={BTN_PRIMARY_CLASS}
                >
                  {isPending ? "..." : "Сохранить"}
                </button>
              </div>
              {draftCoefficient !== 1.0 && (
                <p className="mt-2 text-xs text-zinc-400">
                  Задача на 5 дней станет {Math.ceil(5 * draftCoefficient)} дней
                </p>
              )}
            </div>
          </>
        ) : null}

        {/* Invite Links */}
        <div className={SECTION_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>Invite-ссылки</h2>
          <p className={SECTION_DESC_CLASS}>
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
                      className={BTN_PRIMARY_CLASS}
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
              className={`ml-auto ${BTN_PRIMARY_CLASS}`}
            >
              {isPending ? "..." : "+ Создать ссылку"}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className={SECTION_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>Участники</h2>
          <p className={SECTION_DESC_CLASS}>
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
