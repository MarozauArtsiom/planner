import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const SUPPORTED_LOCALES = ["en", "ru", "pl", "es", "be", "uk", "hi"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = "en";

async function loadMessages(locale: string) {
  switch (locale) {
    case "ru":
      return (await import("../../messages/ru.json")).default;
    case "pl":
      return (await import("../../messages/pl.json")).default;
    case "es":
      return (await import("../../messages/es.json")).default;
    case "be":
      return (await import("../../messages/be.json")).default;
    case "uk":
      return (await import("../../messages/uk.json")).default;
    case "hi":
      return (await import("../../messages/hi.json")).default;
    default:
      return (await import("../../messages/en.json")).default;
  }
}

function detectLocaleFromAcceptLanguage(acceptLanguage: string | null): SupportedLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [langTag, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.replace("q=", "")) : 1.0;
      return { lang: langTag.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    const exact = SUPPORTED_LOCALES.find((l) => l === lang);
    if (exact) return exact;

    const prefix = lang.split("-")[0];
    const byPrefix = SUPPORTED_LOCALES.find((l) => l === prefix);
    if (byPrefix) return byPrefix;
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale: SupportedLocale;

  if (cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)) {
    locale = cookieLocale as SupportedLocale;
  } else {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language");
    locale = detectLocaleFromAcceptLanguage(acceptLanguage);
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
