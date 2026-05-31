"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MIN_AGE } from "@/lib/legal";

type MethodOption = "FIBONACCI_SP" | "HOURS" | "DAYS" | "COMPOSITE_SP";

interface Props {
  currentUser: { id: string; name: string; isGuest: boolean } | null;
  createAction: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function PokerLandingForm({ currentUser, createAction }: Props) {
  const t = useTranslations("quickRoom");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [hostNickname, setHostNickname] = useState(
    currentUser?.isGuest ? currentUser.name : "",
  );
  const [method, setMethod] = useState<MethodOption>("FIBONACCI_SP");
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = () => {
    setError(null);
    if (!currentUser && !hostNickname.trim()) {
      setError(t("nicknameRequired"));
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("method", method);
      if (!currentUser) formData.set("hostNickname", hostNickname);
      const result = await createAction(formData);
      if (result && "error" in result) setError(result.error ?? tc("error"));
      // в случае успеха action делает redirect сам
    });
  };

  const handleJoin = () => {
    setError(null);
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/poker/${trimmed}`);
  };

  return (
    <div className="space-y-5">
      {/* Шаг 1: ник хоста, если не залогинен */}
      {!currentUser && (
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("yourNickname")}
          </label>
          <input
            type="text"
            value={hostNickname}
            onChange={(e) => setHostNickname(e.target.value)}
            placeholder={t("nicknamePlaceholder")}
            maxLength={32}
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            {t("nicknameHint")}
          </p>
        </div>
      )}

      {currentUser && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          {t("loggedInAs", { name: currentUser.name })}
        </div>
      )}

      {/* Шаг 2: метод */}
      <div>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("votingMethod")}
        </label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(["FIBONACCI_SP", "HOURS", "DAYS", "COMPOSITE_SP"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                method === m
                  ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {t(`methodShort_${m}`)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isPending ? t("creating") : t("createRoomButton")}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        {t("agreementInline", { age: MIN_AGE })}{" "}
        <Link href="/terms" target="_blank" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" target="_blank" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
          Privacy
        </Link>
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-[11px] text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
            {t("or")}
          </span>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("joinByCode")}
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            placeholder="XKZ-294"
            maxLength={7}
            className="block flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-mono uppercase tracking-wider text-zinc-900 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {t("join")}
          </button>
        </div>
      </div>
    </div>
  );
}
