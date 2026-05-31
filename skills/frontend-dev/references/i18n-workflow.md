# i18n Workflow

## Tech: next-intl 4

- Config: `src/i18n/request.ts` (cookie-based locale via `NEXT_LOCALE`)
- Provider: `<NextIntlClientProvider>` wraps everything in `src/app/layout.tsx`
- Source files: `messages/<lang>.json` (7 languages: ru, en, pl, es, be, uk, hi)

## Adding a New UI String — Required Steps

1. **Pick the right namespace.** Look at existing top-level keys in `messages/ru.json`:
   - `common` — buttons, generic labels (save, cancel, loading)
   - `auth` — login/register UI
   - `home` — home page
   - `settings` — profile settings
   - `projectSettings` — `/project/[id]/settings`
   - `estimation` — `/project/[id]/estimation` UI
   - `votingForm` — composite voting form
   - `votingResults`, `voteDetails` — reveal UI
   - `quickRoom` — `/poker/*` UI
   - `landing` — landing page
   - `legal` — registration agreement / privacy / terms links
   - `cookieBanner` — cookie banner
   - `errors` — server-side error messages returned from actions

2. **Add the key in ALL 7 files.** Use the existing key naming style (camelCase, descriptive).

3. **Use ICU placeholders for variables.** Examples:
   - `"count": "{count} votes"`
   - `"named": "Hello, {name}"`
   - `"plural": "{count, plural, one {# task} few {# tasks} many {# tasks} other {# tasks}}"` (for Slavic languages — see `weekLabel` pattern)

4. **Validate JSON.**
   ```bash
   for f in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8'))" && echo "OK $f"; done
   ```

5. **Use in component.**
   ```tsx
   // Client component
   const t = useTranslations("yourNamespace");
   return <span>{t("yourKey", { count: 5 })}</span>;
   ```
   ```tsx
   // Server component
   const t = await getTranslations("yourNamespace");
   return <h1>{t("yourKey")}</h1>;
   ```

## Pluralization

Slavic languages (ru, be, uk) have 3 plural forms. The project uses ad-hoc `weekLabel` / `memberCount{1,234,5plus}` patterns:

```json
"week1": "неделя",
"week234": "недели",
"week5plus": "недель"
```

```tsx
const weekLabel = (w: number) => {
  if (w === 1) return t("week1");
  if (w < 5) return t("week234");
  return t("week5plus");
};
```

**Better alternative going forward:** use ICU plural syntax:
```json
"weeks": "{count, plural, one {# неделя} few {# недели} many {# недель} other {# недель}}"
```

```tsx
t("weeks", { count: 5 })  // "5 недель"
```

Choose one approach per feature; don't mix.

## Translation Quality

| Language | Native speaker available |
|---|---|
| Russian | yes (controller native) |
| English | yes |
| Polish | reasonable (controller in Poland) |
| Belarusian, Ukrainian | reasonable |
| Spanish | DeepL-grade, acceptable for UI |
| Hindi | DeepL-grade, acceptable for UI |

For sensitive copy (legal disclaimers, error messages users see), proofread carefully or fall back to English.

## File Discipline

- Keep top-level keys sorted by **logical grouping**, not alphabetically (existing convention).
- Indent: 2 spaces.
- Trailing comma forbidden (it's JSON).
- Don't add keys you don't use — remove unused keys when refactoring.

## Locale Switcher

The settings page (`/settings`) has a language dropdown writing to a `NEXT_LOCALE` cookie via a server action (`src/app/actions/locale.ts`). When adding a new language, also:
- Add the locale to the dropdown
- Add the JSON file
- Update `src/i18n/request.ts` if the supported-locales list lives there

## Common Mistakes

| ❌ Don't | ✅ Do |
|---|---|
| `<span>Loading...</span>` | `<span>{tc("loading")}</span>` |
| Hard-code English in error returned from action | `return { error: t("invalidInput") }` |
| Add a key only to `messages/ru.json` | Add to all 7, validate JSON |
| `${name} voted` | `t("voted", { name })` |
| Long block of copy concatenated in code | Single key with full text, even if it's a paragraph |
