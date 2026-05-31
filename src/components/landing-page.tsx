"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageShell, Card, Badge } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG — no icon library per project convention)
// ─────────────────────────────────────────────────────────────────────────────

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
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <PageShell variant="public" header={<LandingNav />}>
      <Hero t={t} />
      <DualCta t={t} />
      <TrustBlock t={t} />
      <HowItWorks t={t} />
      <FaqSection t={t} />
    </PageShell>
  );

  // Suppress unused warning — `tc` is referenced inside <LandingNav /> via its own hook
  void tc;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticky nav
// ─────────────────────────────────────────────────────────────────────────────

function LandingNav() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-zinc-900 transition-opacity hover:opacity-80 dark:text-zinc-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm dark:from-blue-400 dark:to-blue-600">
            <SparklesIcon className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">{tc("appName")}</span>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero — refined typography + soft radial backdrop
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-12 md:pt-28 md:pb-16">
      {/* Soft radial backdrop — CSS-only, no asset */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,_theme(colors.blue.100/.7),transparent_60%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,_theme(colors.blue.950/.5),transparent_60%)]"
      />
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-medium text-emerald-700 backdrop-blur-sm dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {t("badge")}
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tighter text-zinc-900 sm:text-5xl md:text-6xl lg:text-7xl dark:text-zinc-50">
          {t("headline")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-zinc-500 sm:text-lg md:text-xl dark:text-zinc-400">
          {t("subheadline")}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Two-CTA section
// ─────────────────────────────────────────────────────────────────────────────

function DualCta({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  return (
    <section className="px-4 pb-20 md:pb-28">
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2 md:gap-6">
        {/* Quick Poker — accent card */}
        <Link
          href="/poker"
          className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
        >
          <Card
            variant="accent"
            className="h-full p-7 transition-all group-hover:-translate-y-0.5 group-hover:border-blue-600 group-hover:shadow-xl group-hover:shadow-blue-500/15 md:p-8"
          >
            <Badge tone="info" size="sm" className="bg-blue-600 text-white dark:bg-blue-500 dark:text-white">
              {t("ctaQuickBadge")}
            </Badge>
            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md dark:from-blue-400 dark:to-blue-600">
              <BoltIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("ctaQuickTitle")}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("ctaQuickDesc")}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {(["ctaQuickFeature1", "ctaQuickFeature2", "ctaQuickFeature3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1 dark:text-blue-300">
              {t("ctaQuickAction")}
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </Card>
        </Link>

        {/* Sprint Planner — neutral card */}
        <Link
          href="/register"
          className="group rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20 dark:focus-visible:ring-zinc-100/20"
        >
          <Card
            variant="flush"
            className="h-full border-2 border-zinc-200 p-7 transition-all group-hover:-translate-y-0.5 group-hover:border-zinc-400 group-hover:shadow-xl md:p-8 dark:border-zinc-800 dark:group-hover:border-zinc-600"
          >
            <Badge tone="neutral" size="sm">
              {t("ctaFullBadge")}
            </Badge>
            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 text-white shadow-md dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
              <ChartIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("ctaFullTitle")}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("ctaFullDesc")}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {(["ctaFullFeature1", "ctaFullFeature2", "ctaFullFeature3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 transition-transform group-hover:translate-x-1 dark:text-zinc-100">
              {t("ctaFullAction")}
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </Card>
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust block
// ─────────────────────────────────────────────────────────────────────────────

function TrustBlock({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  const items = [
    {
      icon: <ShieldIcon className="h-5 w-5" />,
      iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      title: t("trust1Title"),
      desc: t("trust1Desc"),
    },
    {
      icon: <SparklesIcon className="h-5 w-5" />,
      iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      title: t("trust2Title"),
      desc: t("trust2Desc"),
    },
    {
      icon: <BoltIcon className="h-5 w-5" />,
      iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
      title: t("trust3Title"),
      desc: t("trust3Desc"),
    },
  ];
  return (
    <section className="border-y border-zinc-200 bg-white px-4 py-14 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          {t("trustTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${item.iconBg}`}>
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h3>
              <p className="mt-1.5 max-w-[22ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How Quick Poker works
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorks({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  return (
    <section className="px-4 py-20 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            {t("howQuickTitle")}
          </h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {t("howQuickSub")}
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <Card className="h-full">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {n}
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {t(`howQuick${n}Title` as "howQuick1Title")}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t(`howQuick${n}Desc` as "howQuick1Desc")}
                </p>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Link
            href="/poker"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 dark:from-blue-400 dark:to-blue-600"
          >
            <BoltIcon className="h-4 w-4" />
            {t("ctaQuickAction")}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────────────

function FaqSection({ t }: { t: ReturnType<typeof useTranslations<"landing">> }) {
  return (
    <section className="border-t border-zinc-200 bg-white px-4 py-20 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
          {t("faqTitle")}
        </h2>
        <dl className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="group rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-950/60"
            >
              <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
                {t(`faq${i}Q` as "faq1Q")}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(`faq${i}A` as "faq1A")}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
