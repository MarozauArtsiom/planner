import Link from "next/link";
import { PageShell } from "@/components/ui";
import {
  APP_NAME,
  CONTROLLER_NAME,
  CONTACT_EMAIL,
  JURISDICTION,
  MIN_AGE,
  SUBPROCESSORS,
  TERMS_EFFECTIVE_DATE,
} from "@/lib/legal";

export const metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description: `Privacy Policy for ${APP_NAME}. GDPR-compliant data processing description.`,
};

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Effective {TERMS_EFFECTIVE_DATE}
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              1. Data Controller
            </h2>
            <p>
              For the purposes of the EU General Data Protection Regulation
              (GDPR) and the Polish Personal Data Protection Act, the data
              controller is:
            </p>
            <p className="rounded-lg bg-white p-4 dark:bg-zinc-900">
              <strong>{CONTROLLER_NAME}</strong>
              <br />
              Individual data controller based in {JURISDICTION}
              <br />
              Contact:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>
              The Service is operated as a personal, non-commercial project.
              No Data Protection Officer (DPO) is appointed, as the scale of
              processing does not require one under Art. 37 GDPR.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              2. What Data We Collect
            </h2>
            <p>We collect only the data strictly necessary to operate the Service:</p>
            <div className="space-y-2">
              <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Registered accounts:
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-6">
                  <li>Nickname (chosen by you)</li>
                  <li>Password hash (bcrypt; we never store the password in clear text)</li>
                  <li>Account creation and update timestamps</li>
                  <li>Language preference</li>
                </ul>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Guest accounts (Quick Rooms without registration):
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-6">
                  <li>Nickname (chosen for the session)</li>
                  <li>Automatic expiry: 24 hours after creation</li>
                  <li>No password, no email, no identifiers</li>
                </ul>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  User content:
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-6">
                  <li>Project names, ticket titles, descriptions, acceptance criteria</li>
                  <li>Sprint timelines, estimates, assignments, time-offs</li>
                  <li>Votes (numerical values you submit during estimation)</li>
                </ul>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Cookies (strictly functional):
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-6">
                  <li>
                    <code>userId</code> — authentication session (httpOnly,
                    1-year lifetime)
                  </li>
                  <li>
                    <code>NEXT_LOCALE</code> — chosen language (1-year lifetime)
                  </li>
                </ul>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  See the{" "}
                  <Link
                    href="/cookies"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Cookie Policy
                  </Link>{" "}
                  for details.
                </p>
              </div>
            </div>
            <p className="font-semibold">We do NOT collect:</p>
            <ul className="list-disc space-y-0.5 pl-6">
              <li>Email addresses (we do not have a recovery flow)</li>
              <li>IP addresses in our application database</li>
              <li>Browser fingerprints, advertising identifiers, biometrics</li>
              <li>Geolocation, device sensors, contact lists</li>
              <li>Any data revealing race, ethnic origin, political opinions, religion, sexual orientation, or health</li>
            </ul>
            <p className="text-xs italic">
              The hosting providers listed in Section 6 may temporarily process
              IP addresses and request metadata at the network level for the
              purpose of delivering and securing the Service, in accordance
              with their own privacy policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              3. Purposes and Legal Basis
            </h2>
            <p>We process your data for the following purposes:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Providing the Service</strong> (authentication,
                projects, rooms, voting, real-time updates) — legal basis:
                performance of a contract with you (Art. 6(1)(b) GDPR);
              </li>
              <li>
                <strong>Security and abuse prevention</strong> — legal basis:
                our legitimate interest (Art. 6(1)(f) GDPR) in protecting the
                Service and other users;
              </li>
              <li>
                <strong>Compliance with legal obligations</strong> when
                required (Art. 6(1)(c) GDPR).
              </li>
            </ul>
            <p>
              We do not perform automated decision-making with legal effects
              (Art. 22 GDPR). We do not engage in profiling or behavioural
              advertising.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              4. Retention
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Registered accounts:</strong> retained until you
                request deletion or until 2 years of inactivity, whichever
                comes first.
              </li>
              <li>
                <strong>Guest accounts and Quick Rooms:</strong> automatically
                deleted 24 hours after creation. Cleanup is performed lazily
                on access and via a scheduled background job.
              </li>
              <li>
                <strong>Projects you create:</strong> retained until you
                delete them, or your account is deleted.
              </li>
              <li>
                <strong>Backups</strong> (if any): purged within 30 days of
                deletion.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              5. Your Rights under GDPR
            </h2>
            <p>You have the following rights:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Right of access</strong> (Art. 15) — request a copy
                of the data we hold about you;
              </li>
              <li>
                <strong>Right to rectification</strong> (Art. 16) — request
                correction of inaccurate data;
              </li>
              <li>
                <strong>Right to erasure</strong> (Art. 17) — request deletion
                of your account and associated data;
              </li>
              <li>
                <strong>Right to restriction</strong> (Art. 18) — limit how
                we process your data;
              </li>
              <li>
                <strong>Right to data portability</strong> (Art. 20) — receive
                your data in a structured, machine-readable format;
              </li>
              <li>
                <strong>Right to object</strong> (Art. 21) — object to
                processing based on legitimate interest;
              </li>
              <li>
                <strong>Right to lodge a complaint</strong> with a supervisory
                authority. In {JURISDICTION}, this is the Personal Data
                Protection Office (UODO,{" "}
                <a
                  href="https://uodo.gov.pl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  uodo.gov.pl
                </a>
                ).
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {CONTACT_EMAIL}
              </a>
              . We will respond within one month, as required by Art. 12 GDPR.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              6. Sub-processors and International Transfers
            </h2>
            <p>
              We use the following sub-processors to operate the Service:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              {SUBPROCESSORS.map((sp) => (
                <li key={sp.name}>
                  <strong>{sp.name}</strong> — {sp.purpose} ({sp.region})
                </li>
              ))}
            </ul>
            <p>
              When data is transferred outside the European Economic Area, our
              sub-processors rely on Standard Contractual Clauses (SCCs) or
              other safeguards approved under Chapter V of the GDPR.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              7. Security
            </h2>
            <p>
              We apply commercially reasonable technical and organisational
              measures to protect your data, including: HTTPS for all
              transport, bcrypt hashing for passwords, httpOnly cookies, and
              strict input validation. No system is perfectly secure; you
              acknowledge that residual risk exists.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              8. Children
            </h2>
            <p>
              The Service is not intended for individuals under {MIN_AGE}
              years of age. We do not knowingly collect data from children.
              If you believe a minor has provided data, contact us for
              immediate deletion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              9. Changes to this Policy
            </h2>
            <p>
              We may update this Privacy Policy. Material changes will be
              announced inside the Service. The effective date at the top of
              this page reflects the latest version.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              10. Contact
            </h2>
            <p>
              For privacy-related questions or to exercise your rights, email{" "}
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
