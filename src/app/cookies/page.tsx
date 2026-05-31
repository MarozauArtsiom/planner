import Link from "next/link";
import { PageShell } from "@/components/ui";
import {
  APP_NAME,
  CONTACT_EMAIL,
  COOKIES_USED,
  TERMS_EFFECTIVE_DATE,
} from "@/lib/legal";

export const metadata = {
  title: `Cookie Policy — ${APP_NAME}`,
  description: `Cookie Policy for ${APP_NAME}. We use only strictly necessary functional cookies. No tracking.`,
};

export default function CookiesPage() {
  return (
    <PageShell variant="public">
      <div className="flex-1 px-4 py-10 md:py-16">
        <article className="mx-auto max-w-3xl space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <header className="space-y-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Back to home
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Cookie Policy
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Effective {TERMS_EFFECTIVE_DATE}
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              The short version
            </h2>
            <p>
              {APP_NAME} uses only <strong>strictly necessary functional
              cookies</strong> required to keep you signed in and remember
              your language. We do <strong>not</strong> use cookies for
              advertising, third-party tracking, or behavioural analytics.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Cookies we set
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="pb-2 pr-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Name
                    </th>
                    <th className="pb-2 pr-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Purpose
                    </th>
                    <th className="pb-2 pr-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Lifetime
                    </th>
                    <th className="pb-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES_USED.map((c) => (
                    <tr
                      key={c.name}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="py-2 pr-3 font-mono text-xs">
                        {c.name}
                      </td>
                      <td className="py-2 pr-3">{c.purpose}</td>
                      <td className="py-2 pr-3">{c.duration}</td>
                      <td className="py-2 text-xs capitalize">{c.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
              In addition, your browser may also store a one-off dismissal flag
              for the cookie information banner in localStorage (not a cookie,
              not transmitted to us).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Third-party cookies
            </h2>
            <p>
              We do not set third-party cookies. We do not use Google
              Analytics, Facebook Pixel, advertising networks, or session
              replay tools.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Consent
            </h2>
            <p>
              Under Polish/EU law, consent is not required for strictly
              necessary cookies (Art. 173 Polish Telecommunications Act
              implementing the ePrivacy Directive). The cookies we use fall
              into this category. We show an informational banner on first
              visit for transparency, which you may dismiss; no consent gating
              is applied.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Disabling cookies
            </h2>
            <p>
              You may disable cookies in your browser settings. Note that
              disabling the <code>userId</code> cookie will sign you out of
              your account and prevent you from using authenticated parts of
              the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Contact
            </h2>
            <p>
              For questions about cookies, email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </PageShell>
  );
}
