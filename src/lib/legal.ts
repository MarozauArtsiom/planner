/**
 * Юридические константы продукта.
 * Используются в Terms / Privacy / Cookie Policy, footer, click-wrap UX.
 *
 * Меняй только здесь — не дублируй по коду.
 */

export const APP_NAME = "Planning Poker";
export const APP_TAGLINE = "Free planning poker & sprint estimation";

export const CONTROLLER_NAME = "Planning Poker by Artsiom Marozau";
export const CONTROLLER_TYPE = "individual"; // physical person, not a legal entity
export const CONTACT_EMAIL = "ar.marozau@gmail.com";

/** Юрисдикция: Польша (EU). Влияет на governing law в Terms и GDPR-режим в Privacy. */
export const JURISDICTION = "Poland (European Union)";
export const GOVERNING_LAW = "the laws of Poland";

export const MIN_AGE = 16; // GDPR минимум для consent

/** Subprocessors — кто реально обрабатывает данные кроме нас. */
export const SUBPROCESSORS = [
  { name: "Vercel Inc.", purpose: "application hosting", region: "US / EU" },
  { name: "Turso (libSQL)", purpose: "database hosting", region: "EU" },
];

/** Версия legal-документов. Бампать при существенных изменениях, чтобы триггерить переподтверждение. */
export const TERMS_VERSION = "1.0.0";
export const TERMS_EFFECTIVE_DATE = "2026-05-31";

/** Cookies, которые мы реально используем. Никаких трекеров. */
export const COOKIES_USED = [
  {
    name: "userId",
    purpose: "Authentication session",
    duration: "1 year",
    type: "strictly necessary",
  },
  {
    name: "NEXT_LOCALE",
    purpose: "Language preference",
    duration: "1 year",
    type: "functional",
  },
];
