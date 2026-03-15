"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { BoardSprint, BacklogTicket } from "@/hooks/use-board-polling";
import type { ReportData, ReportOptions } from "@/lib/report/types";
import { generateSprintReport } from "@/lib/report/generate-sprint-report";
import {
  getReportTranslations,
  LOCALE_LABELS,
} from "@/lib/report/get-report-translations";

interface Props {
  projectId: string;
  sprints: BoardSprint[];
  activeSprintId: string | null;
  backlog: BacklogTicket[];
  onClose: () => void;
}

export function ExportDialog({
  projectId,
  sprints,
  activeSprintId,
  backlog,
  onClose,
}: Props) {
  const t = useTranslations("report");
  const currentLocale = useLocale();

  const [pdfLocale, setPdfLocale] = useState(currentLocale);
  const [selectedSprintIds, setSelectedSprintIds] = useState<Set<string>>(
    () => {
      const initial = new Set<string>();
      if (activeSprintId) initial.add(activeSprintId);
      return initial;
    },
  );

  const [includeBacklog, setIncludeBacklog] = useState(false);
  const [selectedBacklogIds, setSelectedBacklogIds] = useState<Set<string>>(
    new Set(),
  );
  const [backlogSearch, setBacklogSearch] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unassignedBacklog = useMemo(
    () =>
      backlog.filter(
        (ticket) => !(ticket.hasDevAssignment && ticket.hasQaAssignment),
      ),
    [backlog],
  );

  const filteredBacklog = useMemo(() => {
    if (!backlogSearch.trim()) return unassignedBacklog;
    const q = backlogSearch.toLowerCase();
    return unassignedBacklog.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(q) ||
        (ticket.externalId?.toLowerCase().includes(q) ?? false),
    );
  }, [unassignedBacklog, backlogSearch]);

  function toggleSprint(id: string) {
    setSelectedSprintIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleBacklogTicket(id: string) {
    setSelectedBacklogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDownload() {
    if (selectedSprintIds.size === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const sprintIds = [...selectedSprintIds].join(",");
      const res = await fetch(
        `/api/project/${projectId}/report?sprintIds=${encodeURIComponent(sprintIds)}`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      const data: ReportData = await res.json();

      const options: ReportOptions = {
        includeBacklog,
        backlogTicketIds: includeBacklog ? [...selectedBacklogIds] : [],
      };

      const translations = getReportTranslations(pdfLocale);

      const doc = generateSprintReport(data, options, translations);

      const sprintNames = data.sprints.map((s) => s.name).join("_");
      const fileName = `${data.projectName}_${sprintNames}_report.pdf`;
      doc.save(fileName.replace(/[^a-zA-Z0-9_\-.]/g, "_"));

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t("dialogTitle")}
          </h2>
          <button
            onClick={onClose}
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(85vh-130px)] overflow-y-auto px-6 py-4">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("selectSprints")}
            </h3>
            <div className="space-y-1">
              {sprints.map((sprint) => (
                <label
                  key={sprint.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedSprintIds.has(sprint.id)}
                    onChange={() => toggleSprint(sprint.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">
                      {sprint.name}
                    </span>
                    {sprint.id === activeSprintId && (
                      <span className="ml-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {t("active")}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("pdfLanguage")}
            </h3>
            <select
              value={pdfLocale}
              onChange={(e) => setPdfLocale(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {LOCALE_LABELS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={includeBacklog}
                onChange={(e) => {
                  setIncludeBacklog(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedBacklogIds(new Set());
                    setBacklogSearch("");
                  }
                }}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
              />
              <div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("includeBacklog")}
                </span>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {t("includeBacklogHint")}
                </p>
              </div>
            </label>

            {includeBacklog && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={backlogSearch}
                    onChange={(e) => setBacklogSearch(e.target.value)}
                    placeholder={t("searchBacklog")}
                    className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  {selectedBacklogIds.size > 0 && (
                    <span className="whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                      {t("selectedCount", { count: selectedBacklogIds.size })}
                    </span>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {filteredBacklog.length === 0 ? (
                    <p className="py-3 text-center text-xs text-zinc-400">
                      {t("noBacklogTickets")}
                    </p>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredBacklog.map((ticket) => (
                        <label
                          key={ticket.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-white dark:hover:bg-zinc-800"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBacklogIds.has(ticket.id)}
                            onChange={() => toggleBacklogTicket(ticket.id)}
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                          />
                          <span className="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
                            {ticket.externalId && (
                              <span className="mr-1 font-medium text-zinc-500 dark:text-zinc-400">
                                {ticket.externalId}
                              </span>
                            )}
                            {ticket.title}
                          </span>
                          <span className="shrink-0 text-xs text-zinc-400">
                            {ticket.storyPoints} SP
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleDownload}
            disabled={selectedSprintIds.size === 0 || isGenerating}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? t("generating") : t("download")}
          </button>
        </div>
      </div>
    </div>
  );
}

