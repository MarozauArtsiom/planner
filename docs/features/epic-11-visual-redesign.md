# Эпик 11: Visual Redesign

> **Статус: Эпик закрыт. Все 5 фаз реализованы (2026-06-01).**

## Бизнес-цель

Поднять визуальную целостность и UX-полировку продукта без функциональных изменений. Цель — после редизайна продукт чувствуется как **единый**, кнопки **легко найти**, иерархия **очевидна**. Никаких новых фич, никаких изменений в user journey, никаких изменений в backend / schema / Server Actions.

## Phases

| # | Phase | Scope | Status |
|---|---|---|---|
| 1 | Design Foundation | Shared UI primitives в `src/components/ui/` | ✅ реализовано (2026-06-01) |
| 2 | Home Page Redesign | `/` (landing + dashboard) на новые компоненты, refined visual rhythm | ✅ реализовано (2026-06-01) |
| 3 | Public Entry Pages | `/poker`, `/login`, `/register`, `/invite`, `/onboarding`, chrome legal pages | ✅ реализовано (2026-06-01) |
| 4 | App Pages | `/settings`, `/project/[id]/settings`, `/poker/[code]`, `/project/[id]/estimation` — все на `<PageShell>` + `<LoadingScreen>`. Gantt намеренно не тронут (h-screen layout) | ✅ реализовано (2026-06-01) |
| 5 | Polish + Audit | Error pages → PageShell, eslint ignore для `.claude`/`.planning`/`src/generated`, cross-page audit (Footer только в PageShell, 16/16 pages используют ui-primitives) | ✅ реализовано (2026-06-01) |

## Что реализовано (Phase 1)

### Shared UI library `src/components/ui/`

Семь компонентных файлов + barrel index. Каждый — primitive, который должен закрыть 90%+ существующих use-cases по страницам.

#### `<Button>` — `button.tsx`
- Variants: `primary` (синий), `secondary` (бордер), `ghost` (фон при hover), `danger` (красный)
- Sizes: `sm` (text-xs), `md` (text-sm, default), `lg` (text-base)
- Prop `block` — full-width (для мобильных submit-ов и hero CTA)
- `forwardRef` — работает с form submit/focus management
- Тип `type="button"` по умолчанию (защита от случайных submit)

#### `<IconButton>` — `icon-button.tsx`
- Square (h × w равны), variants `ghost | outline`, sizes `sm | md | lg`
- **Обязательный** prop `label` → автоматически становится `title` + `aria-label` (a11y enforce-ится на типе)
- Опциональный `tooltip` если визуальный текст должен отличаться от screen-reader

#### `<Card>` + `<SectionHeader>` — `card.tsx`
- Card variants: `default` (p-5), `compact` (p-4), `flush` (без padding), `accent` (blue border + gradient — для primary CTA в two-CTA layouts)
- `SectionHeader` — uppercase-tracked muted title с опциональным `actions` slot справа

#### `<Badge>` — `badge.tsx`
- Tones: `neutral`, `info`, `success`, `warning`, `danger`, `accent` + project role colours `role-dev` (indigo), `role-qa` (emerald), `role-ba` (amber)
- Sizes: `xs` (10px), `sm` (xs), `md` (sm)

#### `<Field>` + `<Input>` + `<Textarea>` + `<Checkbox>` — `field.tsx`
- `<Field label hint error emphasis="muted|strong">` — vertical stack с label сверху, hint/error снизу. Error замещает hint
- `<Input size="sm|md|lg" invalid>` — единый visual language с focus ring + disabled state
- `<Textarea invalid>` — то же с rows
- `<Checkbox label align="top|center">` — для consent UX, label принимает ReactNode (можно с `<Link>`)

#### `<PageShell>` + `<PageHeader>` — `page-shell.tsx`
- `<PageShell variant="public|app" header={...} mainConstrained?>` — public variant автоматически рендерит `<Footer />`, app — нет (footer перегружает плотные UI)
- `<PageHeader leading title trailing sticky>` — единый шаблон шапки: left (back/logo), center (title), right (user menu / primary action). Sticky опционально

#### `<Spinner>` + `<LoadingScreen>` — `loading-spinner.tsx`
- `<Spinner size>` — inline animated SVG, наследует currentColor
- `<LoadingScreen label>` — full-page centered с опциональной подписью (i18n на стороне call-site)

### Barrel re-export

```tsx
import { Button, Card, Input, PageShell } from "@/components/ui";
```

Все компоненты + type exports доступны через один путь. Это `src/components/ui/index.ts`.

### Skill updates

- `skills/frontend-dev/SKILL.md` — новая секция **4.5 Shared UI primitives** направляет сразу в `@/components/ui`
- `skills/frontend-dev/references/ui-patterns.md` — шапка с таблицей «какой компонент для чего», raw snippets оставлены как fallback / source of truth для visual tokens

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/components/ui/button.tsx` | `<Button>` (4 variants × 3 sizes + block) |
| `src/components/ui/icon-button.tsx` | `<IconButton>` (с обязательным a11y label) |
| `src/components/ui/card.tsx` | `<Card>` + `<SectionHeader>` |
| `src/components/ui/badge.tsx` | `<Badge>` (9 tones × 3 sizes) |
| `src/components/ui/field.tsx` | `<Field>`, `<Input>`, `<Textarea>`, `<Checkbox>` |
| `src/components/ui/page-shell.tsx` | `<PageShell>`, `<PageHeader>` |
| `src/components/ui/loading-spinner.tsx` | `<Spinner>`, `<LoadingScreen>` |
| `src/components/ui/index.ts` | Barrel exports |
| `skills/frontend-dev/SKILL.md` | Section 4.5 «Use these primitives» |
| `skills/frontend-dev/references/ui-patterns.md` | Шапка с component → use-case mapping |
| `.gitignore` | `.planning/` добавлен |

## UX-принципы милестоуна (применяются с Phase 2)

1. **Primary action above the fold.** Один main action на экран — виден сразу
2. **Action affordance.** Critical buttons имеют icon + text; icon-only через `IconButton` с обязательным `label`
3. **Consistent placement.** Header: back/logo слева, title в центре, user menu / primary action справа
4. **One color story.** Blue = primary, semantic colors = meaning только (red=danger, emerald=success, amber=warning, violet=accent/BA)
5. **Status visibility.** Loading (LoadingScreen/Spinner), empty (TBD Phase 5), error (red banner), success (toast или badge) — каждое визуально отличимо
6. **Whitespace as hierarchy.** Меньше борд-шума, больше spacing между группами
7. **Visual rhythm.** Любые 3 страницы рядом должны выглядеть как один продукт

## Out of scope (для всего эпика)

- Изменения в backend (Server Actions, Prisma, API)
- Изменения в user journey / порядке шагов
- Новые фичи / экраны
- Новые зависимости (no Framer / GSAP / icon library / component library)
- Содержание legal pages (только chrome)
- Mobile-first rework (уже responsive)
- Dark mode rework (уже covered)

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-06-01 | spec | Создан epic-документ для Visual Redesign (5 phases) |
| 2026-06-01 | feat | Phase 1: shared UI primitives (`src/components/ui/`) — Button, IconButton, Card, Badge, Field/Input/Textarea/Checkbox, PageShell/PageHeader, Spinner/LoadingScreen |
| 2026-06-01 | feat | Phase 2: Home Page redesign — `src/app/page.tsx` (dashboard) и `src/components/landing-page.tsx` (для гостей) полностью на новые UI primitives. Refined hero, gradient icon-containers, focus-visible rings, soft radial backdrop, animate-ping live badge, hover-lift cards. Flow и тексты не изменены |
| 2026-06-01 | feat | Phase 3: Public Entry Pages — `/login`, `/register`, `/poker` landing+form, `/poker/[code]` join-form, `/invite/[token]`, `/terms`+`/privacy`+`/cookies` chrome. Все на `<PageShell>` + `<Card>` + `<Field>/<Input>/<Button>/<Checkbox>`. Invite получил role-color encoding (DEV/QA/BA). Footer теперь автоматический в PageShell. Тексты не изменены |
| 2026-06-01 | feat | Phase 4: App Pages — `/settings`, `/project/[id]/settings`, `/poker/[code]`, `/project/[id]/estimation` на `<PageShell variant="app">` + `<LoadingScreen>`. Минимально-инвазивно: outer chrome переписан, sidebar/main/forms сохранены. Gantt намеренно не тронут (h-screen layout). Loading screens унифицированы |
| 2026-06-01 | feat | Phase 5: Polish + Audit — `/not-found` и `/error` на `<PageShell>` + `<Button>`. eslint config: ignore для `.claude/**`, `.planning/**`, `src/generated/**`. Audit confirmed: Footer теперь only в PageShell (одно место), 16 файлов в `src/app/` используют `@/components/ui`. Эпик 11 закрыт |
