"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MIN_AGE } from "@/lib/legal";
import { Field, Input, Button, Badge } from "@/components/ui";

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
      {/* Шаг 1: ник хоста (или индикатор существующего входа) */}
      {!currentUser ? (
        <Field
          label={t("yourNickname")}
          hint={t("nicknameHint")}
          htmlFor="host-nickname"
        >
          <Input
            id="host-nickname"
            type="text"
            value={hostNickname}
            onChange={(e) => setHostNickname(e.target.value)}
            placeholder={t("nicknamePlaceholder")}
            maxLength={32}
            size="md"
          />
        </Field>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/40">
          <svg
            className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
          <span className="text-xs text-blue-700 dark:text-blue-300">
            {t("loggedInAs", { name: currentUser.name })}
          </span>
        </div>
      )}

      {/* Шаг 2: метод */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("votingMethod")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            ["FIBONACCI_SP", "HOURS", "DAYS", "COMPOSITE_SP"] as const
          ).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                method === m
                  ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
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

      <Button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        variant="primary"
        size="md"
        block
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
          />
        </svg>
        {isPending ? t("creating") : t("createRoomButton")}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        {t("agreementInline", { age: MIN_AGE })}{" "}
        <Link
          href="/terms"
          target="_blank"
          className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Terms
        </Link>{" "}
        ·{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Privacy
        </Link>
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <Badge tone="neutral" size="xs" className="bg-white dark:bg-zinc-900">
            {t("or")}
          </Badge>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {t("joinByCode")}
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            placeholder="XKZ-294"
            maxLength={7}
            size="md"
            className="flex-1 font-mono uppercase tracking-wider"
          />
          <Button
            type="button"
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            variant="secondary"
            size="md"
          >
            {t("join")}
          </Button>
        </div>
      </div>
    </div>
  );
}
