"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { parseTicketsCsv, type ParseResult } from "@/lib/csv-parser";
import { importTickets } from "@/app/actions/estimation";

type Tab = "file" | "text";

export function TicketImportModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<Tab>("text");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback((text: string) => {
    setError(null);
    const result = parseTicketsCsv(text);
    setParsed(result);
  }, []);

  const handleTextChange = (value: string) => {
    setRawText(value);
    if (value.trim()) {
      handleParse(value);
    } else {
      setParsed(null);
    }
  };

  const readFile = (file: File) => {
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawText(text);
      handleParse(text);
    };
    reader.onerror = () => setError("Ошибка чтения файла");
    reader.readAsText(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setTab("file");
        readFile(file);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleImport = () => {
    if (!parsed || parsed.validCount === 0) return;
    const valid = parsed.rows.filter((r) => !r._error);
    startTransition(async () => {
      const result = await importTickets(
        projectId,
        valid.map(({ _rowIndex, _error, ...t }) => t),
      );
      if (result && "error" in result) {
        setError(result.error ?? "Ошибка импорта");
      } else {
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Импорт тикетов
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {(["text", "file"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {t === "text" ? "Вставить текст" : "Загрузить файл"}
              </button>
            ))}
          </div>

          {/* Text tab */}
          {tab === "text" && (
            <textarea
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={"externalId,title,description\nPROJ-123,Login page,Implement login\nPROJ-124,Dashboard,Main dashboard"}
              rows={6}
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            />
          )}

          {/* File tab */}
          {tab === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 transition-colors ${
                dragOver
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
                  : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600"
              }`}
            >
              <svg className="mb-2 h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {fileName ? (
                  <>Файл: <span className="font-medium text-zinc-900 dark:text-zinc-50">{fileName}</span></>
                ) : (
                  <>Перетащите CSV файл или <span className="font-medium text-blue-600 dark:text-blue-400">выберите</span></>
                )}
              </p>
              <p className="mt-1 text-xs text-zinc-400">.csv, .tsv, .txt</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Format help */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showHelp ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              Формат данных
            </button>
            {showHelp && (
              <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-800/70">
                <p className="mb-2 text-zinc-600 dark:text-zinc-400">
                  CSV или TSV (разделитель определяется автоматически). Первая строка — заголовок (опционально).
                </p>
                <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Поддерживаемые колонки:</p>
                <ul className="mb-2 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                  <li><code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">externalId</code> — ID тикета (PROJ-123)</li>
                  <li><code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">title</code> — Название <span className="text-red-500">*обязательно</span></li>
                  <li><code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">externalUrl</code> — Ссылка на трекер</li>
                  <li><code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">description</code> — Описание</li>
                  <li><code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">acceptanceCriteria</code> — Acceptance Criteria</li>
                </ul>
                <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">Пример:</p>
                <pre className="overflow-x-auto rounded bg-zinc-200 p-2 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
{`externalId,title,description
PROJ-123,Login page,Implement login
PROJ-124,Dashboard,Main dashboard`}
                </pre>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  Без заголовка: порядок колонок — externalId, title, externalUrl, description, acceptanceCriteria.
                </p>
              </div>
            )}
          </div>

          {/* Preview table */}
          {parsed && parsed.rows.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Предпросмотр
                </span>
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {parsed.validCount} тикетов
                </span>
                {parsed.errorCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400">
                    {parsed.errorCount} ошибок
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/70">
                      <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">#</th>
                      <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">ID</th>
                      <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Название</th>
                      <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Описание</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {parsed.rows.slice(0, 50).map((row) => (
                      <tr
                        key={row._rowIndex}
                        className={row._error ? "bg-red-50 dark:bg-red-950/20" : ""}
                      >
                        <td className="whitespace-nowrap px-3 py-1.5 text-zinc-400">
                          {row._rowIndex}
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5 font-mono text-zinc-600 dark:text-zinc-400">
                          {row.externalId || "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-1.5 text-zinc-900 dark:text-zinc-100">
                          {row.title || (
                            <span className="italic text-red-500">пусто</span>
                          )}
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-1.5 text-zinc-500 dark:text-zinc-400">
                          {row.description || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > 50 && (
                  <div className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700">
                    ... и ещё {parsed.rows.length - 50} строк
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isPending || !parsed || parsed.validCount === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isPending
              ? "Импорт..."
              : parsed && parsed.validCount > 0
                ? `Импортировать ${parsed.validCount} тикетов`
                : "Импортировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
