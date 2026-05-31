"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { login } from "@/app/actions/auth";
import {
  PageShell,
  Card,
  Field,
  Input,
  Button,
} from "@/components/ui";

type ActionState = { error?: string } | undefined;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const fromGuestUpgrade = searchParams.get("guestUpgrade") === "1";

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      formData.set("redirectTo", redirectTo);
      return await login(formData);
    },
    undefined,
  );

  return (
    <PageShell variant="public">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8">
          <header className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-zinc-900 transition-opacity hover:opacity-80 dark:text-zinc-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md dark:from-blue-400 dark:to-blue-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09Z"
                  />
                </svg>
              </span>
              <span className="text-xl font-bold tracking-tight">
                {tc("appName")}
              </span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("loginTitle")}
            </h1>
          </header>

          {fromGuestUpgrade && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/40">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {t("guestUpgradeTitle")}
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                {t("guestUpgradeDesc")}
              </p>
            </div>
          )}

          <Card variant="default">
            <form action={formAction} className="space-y-5">
              <Field label={t("nickname")} emphasis="strong" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  size="lg"
                />
              </Field>

              <Field label={t("password")} emphasis="strong" htmlFor="password">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  size="lg"
                />
              </Field>

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
                {isPending ? t("loginPending") : t("loginButton")}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t("noAccount")}{" "}
            <Link
              href={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t("registerButton")}
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
