"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/footer";

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <SparklesIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {tc("appName")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 md:px-4 md:py-2 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 md:px-4 md:py-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {t("signUp")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t("badge")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl lg:text-6xl dark:text-zinc-50">
            {t("headline")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500 md:text-xl dark:text-zinc-400">
            {t("subheadline")}
          </p>
        </div>
      </section>

      {/* Двойной CTA — два равных пути */}
      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-6">
          {/* Quick Poker — главный CTA для нового user */}
          <Link
            href="/poker"
            className="group relative overflow-hidden rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 transition-all hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10 md:p-8 dark:border-blue-600 dark:from-blue-950/40 dark:to-blue-900/20 dark:hover:border-blue-500"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-blue-500">
              {t("ctaQuickBadge")}
            </div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white dark:bg-blue-500">
              <BoltIcon className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("ctaQuickTitle")}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("ctaQuickDesc")}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{t("ctaQuickFeature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{t("ctaQuickFeature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{t("ctaQuickFeature3")}</span>
              </li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1 dark:text-blue-300">
              {t("ctaQuickAction")}
              <span aria-hidden="true">→</span>
            </div>
          </Link>

          {/* Full Tool — secondary CTA для долгосрочного использования */}
          <Link
            href="/register"
            className="group rounded-2xl border-2 border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg md:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {t("ctaFullBadge")}
            </div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <ChartIcon className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("ctaFullTitle")}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("ctaFullDesc")}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-700 dark:text-zinc-300" />
                <span>{t("ctaFullFeature1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-700 dark:text-zinc-300" />
                <span>{t("ctaFullFeature2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-700 dark:text-zinc-300" />
                <span>{t("ctaFullFeature3")}</span>
              </li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 transition-transform group-hover:translate-x-1 dark:text-zinc-100">
              {t("ctaFullAction")}
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Trust block */}
      <section className="border-y border-zinc-200 bg-white px-4 py-12 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("trustTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t("trust1Title")}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t("trust1Desc")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t("trust2Title")}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t("trust2Desc")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <BoltIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t("trust3Title")}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t("trust3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Quick Poker works */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("howQuickTitle")}
          </h2>
          <p className="mb-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t("howQuickSub")}
          </p>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              { n: 1, t: t("howQuick1Title"), d: t("howQuick1Desc") },
              { n: 2, t: t("howQuick2Title"), d: t("howQuick2Desc") },
              { n: 3, t: t("howQuick3Title"), d: t("howQuick3Desc") },
            ].map((s) => (
              <li
                key={s.n}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {s.n}
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {s.t}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {s.d}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link
              href="/poker"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <BoltIcon className="h-4 w-4" />
              {t("ctaQuickAction")}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-200 bg-white px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("faqTitle")}
          </h2>
          <dl className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
              >
                <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {t(`faq${i}Q`)}
                </dt>
                <dd className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {t(`faq${i}A`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Footer />
    </div>
  );
}
