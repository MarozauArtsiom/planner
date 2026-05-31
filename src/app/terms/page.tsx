import Link from "next/link";
import { Footer } from "@/components/footer";
import {
  APP_NAME,
  CONTROLLER_NAME,
  CONTACT_EMAIL,
  JURISDICTION,
  GOVERNING_LAW,
  MIN_AGE,
  TERMS_VERSION,
  TERMS_EFFECTIVE_DATE,
} from "@/lib/legal";

export const metadata = {
  title: `Terms of Use — ${APP_NAME}`,
  description: `Terms of Use for ${APP_NAME}, a free planning poker and sprint estimation service.`,
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
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
              Terms of Use
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE_DATE}
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms of Use (the &quot;Terms&quot;) govern your access to
              and use of <strong>{APP_NAME}</strong> (the &quot;Service&quot;),
              operated by <strong>{CONTROLLER_NAME}</strong> (&quot;we&quot;,
              &quot;us&quot;). By accessing or using the Service, you confirm
              that you have read, understood, and agree to be bound by these
              Terms. If you do not agree, you must not use the Service.
            </p>
            <p>
              The Service is provided free of charge as a personal,
              non-commercial project. No fees are or will be charged.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              2. Description of the Service
            </h2>
            <p>
              {APP_NAME} is a web-based tool for collaborative software
              estimation, including:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Real-time planning poker rooms with optional registration
                (&quot;Quick Rooms&quot;) — ephemeral sessions auto-deleted
                after 24 hours;
              </li>
              <li>
                Persistent projects for sprint planning, ticket management,
                Gantt-style visualisation, and PDF reports, requiring
                registration.
              </li>
            </ul>
            <p>
              The Service is informational. It does not constitute professional
              advice and must not be relied upon for life-, health- or
              safety-critical decisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              3. Eligibility and Accounts
            </h2>
            <p>
              You must be at least <strong>{MIN_AGE} years old</strong> to use
              the Service. If you are under the age of {MIN_AGE}, you may not
              create an account or join a Quick Room.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your
              password and for all activities under your account. You agree to
              notify us immediately of any unauthorised use.
            </p>
            <p>
              Guest accounts (created in Quick Rooms without registration) are
              automatically deleted within 24 hours of creation, along with
              any associated room data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              4. Acceptable Use
            </h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Submit unlawful, harmful, defamatory, obscene, harassing, or
                otherwise objectionable content (including in nicknames,
                project names, ticket titles);
              </li>
              <li>
                Attempt to gain unauthorised access to the Service, other
                accounts, or systems;
              </li>
              <li>
                Use automated means (bots, scrapers) to access the Service in
                a manner that imposes unreasonable load;
              </li>
              <li>
                Reverse engineer, decompile, or disassemble any part of the
                Service except to the extent permitted by applicable law;
              </li>
              <li>
                Use the Service to estimate, plan, or support decisions
                involving risk to human life, health, or safety;
              </li>
              <li>
                Use the Service in violation of any applicable law in your
                jurisdiction.
              </li>
            </ul>
            <p>
              We may terminate access without notice for violations of this
              section.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              5. Intellectual Property
            </h2>
            <p>
              The Service&apos;s software, design, and documentation are the
              property of {CONTROLLER_NAME}. Content you submit (project
              names, ticket titles, descriptions, votes) remains your
              property; by submitting it to the Service, you grant us a
              limited, non-exclusive, royalty-free licence to host, store,
              and process that content solely to operate the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              6. Disclaimer of Warranties
            </h2>
            <p className="font-semibold">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED.
            </p>
            <p>
              To the maximum extent permitted by applicable law, we disclaim
              all warranties, including but not limited to:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>warranties of merchantability or fitness for a particular purpose;</li>
              <li>warranties that the Service will be uninterrupted, error-free, or secure;</li>
              <li>
                warranties regarding the accuracy, reliability, or completeness
                of any estimates, calculations, or other output produced by
                the Service. Estimates are statistical aggregations of user
                input — not predictions or recommendations;
              </li>
              <li>
                warranties regarding the integrity, persistence, or recovery of
                user data, particularly data in Quick Rooms which is
                ephemeral by design.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              7. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, in no event
              shall {CONTROLLER_NAME} be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not
              limited to loss of profits, data, business opportunities, or
              goodwill, arising out of or in connection with your use of the
              Service.
            </p>
            <p className="font-semibold">
              Because the Service is provided free of charge, our total
              aggregate liability to you for all claims arising from or
              related to the Service shall not exceed EUR 0 (zero euro).
            </p>
            <p>
              Nothing in these Terms shall exclude or limit liability for:
              (a) death or personal injury caused by our negligence;
              (b) fraud or fraudulent misrepresentation;
              (c) gross negligence or wilful misconduct;
              (d) any other liability which cannot be excluded or limited
              under applicable law of {JURISDICTION}.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              8. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless {CONTROLLER_NAME}
              against any claims, damages, or expenses arising from your
              breach of these Terms or your misuse of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              9. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any
              time, with or without notice, for any reason, including
              violation of these Terms or inactivity. You may stop using the
              Service at any time. You may request account deletion by
              contacting us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <p>
              We may discontinue the Service in whole or in part at any time
              without liability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              10. Changes to the Terms
            </h2>
            <p>
              We may modify these Terms at any time. Material changes will be
              communicated via a notice within the Service. Your continued
              use after the effective date of the updated Terms constitutes
              acceptance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              11. Governing Law and Jurisdiction
            </h2>
            <p>
              These Terms are governed by {GOVERNING_LAW}, without regard to
              its conflict-of-laws principles. Any dispute arising from these
              Terms or the Service shall be submitted to the competent courts
              of {JURISDICTION}, subject to mandatory consumer protection
              rules of your country of residence.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              12. Contact
            </h2>
            <p>
              Questions regarding these Terms can be sent to{" "}
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
      <Footer />
    </div>
  );
}
