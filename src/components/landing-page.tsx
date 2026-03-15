"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
    </svg>
  );
}

function GanttIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  );
}

function LinkChainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

export function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <SparklesIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {tc("appName")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t("getStarted")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero relative overflow-hidden px-6 py-24 md:py-32 lg:py-40">
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="landing-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            <RocketIcon className="h-4 w-4" />
            {t("badge")}
          </div>
          <h1 className="landing-fade-in landing-delay-1 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl lg:text-6xl dark:text-zinc-50">
            {t("headline")}
          </h1>
          <p className="landing-fade-in landing-delay-2 mx-auto mt-6 max-w-2xl text-lg text-zinc-500 md:text-xl dark:text-zinc-400">
            {t("subheadline")}
          </p>
          <div className="landing-fade-in landing-delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/register"
              className="w-full rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 sm:w-auto dark:bg-blue-500 dark:shadow-blue-500/20 dark:hover:bg-blue-600"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-zinc-300 bg-white px-8 py-3.5 text-base font-semibold text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-white px-6 py-20 md:py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("featuresTitle")}
            </h2>
            <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
              {t("featuresSubtitle")}
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-800">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60">
                <ClipboardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("feature1Title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("feature1Desc")}
              </p>
            </div>

            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-800">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60">
                <GanttIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("feature2Title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("feature2Desc")}
              </p>
            </div>

            <div className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-800">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60">
                <UsersIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("feature3Title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("stepsTitle")}
          </h2>

          <div className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
            <div className="absolute top-6 right-[17%] left-[17%] hidden h-0.5 border-t-2 border-dashed border-zinc-300 md:block dark:border-zinc-700" aria-hidden="true" />

            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
                1
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {t("step1Title")}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {t("step1Desc")}
              </p>
            </div>

            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
                2
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {t("step2Title")}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {t("step2Desc")}
              </p>
            </div>

            <div className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/20">
                3
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {t("step3Title")}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {t("step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-12 text-center shadow-xl md:px-16 md:py-16 dark:from-blue-700 dark:to-blue-800">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-blue-100">
              {t("ctaSubtitle")}
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
              >
                {t("getStarted")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
              <SparklesIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {tc("appName")}
            </span>
          </div>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
