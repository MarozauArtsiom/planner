"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { register } from "@/app/actions/auth";
import { MIN_AGE } from "@/lib/legal";
import {
  PageShell,
  Card,
  Field,
  Input,
  Button,
  Checkbox,
} from "@/components/ui";

type ActionState = { error?: string } | undefined;

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const tl = useTranslations("legal");
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [agreed, setAgreed] = useState(false);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      formData.set("redirectTo", redirectTo);
      return await register(formData);
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
              {t("createAccount")}
            </h1>
          </header>

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
                  placeholder={t("nicknamePlaceholder")}
                  size="lg"
                />
              </Field>

              <Field label={t("password")} emphasis="strong" htmlFor="password">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  size="lg"
                />
              </Field>

              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                align="top"
                label={
                  <>
                    {tl("registerAgreement", { age: MIN_AGE })}{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {tl("terms")}
                    </Link>{" "}
                    {tl("and")}{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {tl("privacy")}
                    </Link>
                    .
                  </>
                }
              />

              {state?.error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  {state.error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending || !agreed}
                variant="primary"
                size="lg"
                block
              >
                {isPending ? t("registerPending") : t("registerButton")}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t("hasAccount")}{" "}
            <Link
              href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t("loginButton")}
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
