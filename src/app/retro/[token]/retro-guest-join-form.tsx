"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { joinRetroAsGuest } from "@/app/actions/retro";
import { MIN_AGE } from "@/lib/legal";
import { PageShell, Card, Field, Input, Button, Badge } from "@/components/ui";

interface Props {
  inviteToken: string;
  boardTitle: string;
  projectName: string;
}

export function RetroGuestJoinForm({
  inviteToken,
  boardTitle,
  projectName,
}: Props) {
  const t = useTranslations("retro");
  const tl = useTranslations("legal");
  const tq = useTranslations("quickRoom");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("nickname", nickname);
      const res = await joinRetroAsGuest(inviteToken, fd);
      if (res && "error" in res) {
        setError(res.error ?? t("createError"));
      }
    });
  };

  return (
    <PageShell variant="public">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </span>
            <Badge tone="success" size="sm">
              {projectName}
            </Badge>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {boardTitle}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("guestJoinSubtitle")}
            </p>
          </div>

          <Card variant="default">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  {error}
                </p>
              )}

              <Field
                label={tq("yourNickname")}
                hint={t("guestJoinNameHint")}
              >
                <Input
                  name="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={tq("nicknamePlaceholder")}
                  size="lg"
                  required
                  maxLength={32}
                  autoFocus
                />
              </Field>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={isPending || !nickname.trim()}
              >
                {isPending ? tq("joining") : t("joinRetroButton")}
              </Button>

              <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                {tq("agreementInline", { age: MIN_AGE })}{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {tl("terms")}
                </Link>{" "}
                ·{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {tl("privacy")}
                </Link>
              </p>
            </form>
          </Card>

          <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {t("alreadyHaveAccountPrompt")}{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(`/retro/${inviteToken}`)}`}
              className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {t("signInWithPlanner")}
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
