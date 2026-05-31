"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MIN_AGE } from "@/lib/legal";
import { Field, Input, Button } from "@/components/ui";

interface Props {
  accessCode: string;
  joinAction: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function QuickRoomJoinForm({ joinAction }: Props) {
  const t = useTranslations("quickRoom");
  const tc = useTranslations("common");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError(t("nicknameRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("nickname", nickname);
      const result = await joinAction(formData);
      if (result && "error" in result) setError(result.error ?? tc("error"));
      // в случае успеха — server action делает redirect
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={t("yourNickname")} htmlFor="join-nickname">
        <Input
          id="join-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t("nicknamePlaceholder")}
          autoFocus
          maxLength={32}
          size="md"
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || !nickname.trim()}
        variant="primary"
        size="md"
        block
      >
        {isPending ? t("joining") : t("joinButton")}
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
    </form>
  );
}
