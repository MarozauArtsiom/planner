# Changelog

## 2026-06-01 (Logout кнопка для guest + redirect → /)

Гостевой юзер теперь может выйти и увидеть главную страницу (landing).

- **fix(auth):** `logout()` action редиректит на `/` вместо `/login`. Гость после выхода видит landing (т.к. без session он не идентифицирован как guest); registered после logout тоже сначала видит landing — там есть Sign In в navbar для возврата
- **feat(poker):** На `/poker` landing page внизу — кнопка «Sign out» если есть активная сессия. Для unauthenticated пользователей сохраняется старый «← Back to app» link
- Раньше: гость был «застрял» в Quick Poker без способа выйти, кроме как через DevTools / clear cookies. Сейчас: один клик «Sign out» → видит landing

## 2026-06-01 (Guest/User segregation — жёсткое разделение доступа)

Гостевые юзеры (созданные через Quick Poker) теперь **не могут попасть** ни в одну страницу кроме Quick-комнат и legal/auth. Полные функции (проекты, спринты, Гант, settings) — только для зарегистрированных через `/register`.

### Защита в три уровня

- **Cookie `userType`** в `src/lib/session.ts`: `"user"` для registered, `"guest"` для Quick-юзеров. `setSession(userId, userType?)` — второй параметр опциональный, дефолт `"user"`. httpOnly + Secure (prod) + SameSite=Lax. Клиент не может его подменить
- **Middleware `src/proxy.ts`**: если `userType === "guest"`, разрешены ТОЛЬКО `/poker/*`, `/terms`, `/privacy`, `/cookies`, `/login`, `/register`. Остальное → редирект на `/login?guestUpgrade=1`. Edge-friendly (без БД-запросов)
- **Action guards `src/app/actions/project.ts`**: новая функция `requireFullUser()` блокирует `isGuest=true` пользователей в `createProject` и `joinProject`. Defense-in-depth — даже если middleware обойдут, action откажет

### UX

- **`/login?guestUpgrade=1`** → info-banner «Это была гостевая сессия. Чтобы создавать проекты, планировать спринты и пользоваться Гант-чартом — зарегистрируйтесь.»
- **Quick Room board** для guest-юзера показывает внизу маленький блок «Need more? Sprint planning, Gantt, reports — in the full app. → Create a free account». Для зарегистрированных в Quick-комнате (например, тестируют) hint не показывается
- **Главная (`/`)**: если guest зашёл — редирект на `/poker` (его «home»)
- **Login page**: useSearchParams читает `?guestUpgrade=1` и показывает banner до формы

### API

- `/api/estimation/session` response теперь включает `currentUser.isGuest: boolean`
- Hook `useEstimationPolling` тип `SessionState.currentUser.isGuest: boolean`

### Что было раньше (баг)

До этих изменений: гость с cookie мог физически набрать `/project/[id]` или `/settings` — middleware пропускал (cookie был), он попадал на страницу, которая делала Prisma-query → либо 404 (нет membership), либо ошибка. UX был сломан. Теперь — единое поведение: гость **не видит** этих страниц.

### i18n

Добавлено в 7 языках:
- `auth.guestUpgradeTitle` / `auth.guestUpgradeDesc`
- `quickRoom.guestHintTitle` / `quickRoom.guestHintAction`

### Build

✓ Compiled successfully

## 2026-06-01 (Epic 11 Phase 5 — Polish + Audit • эпик 11 закрыт)

Финальная фаза: error pages → `<PageShell>`, eslint hygiene, cross-page audit, закрытие милестоуна.

- **feat(errors):** `src/app/not-found.tsx` и `src/app/error.tsx` переписаны на `<PageShell variant="public">` + `<Button>` (для error reset). Hero number (404/500) получил `select-none tracking-tight`, hover-states получили focus ring, ARIA-label на error digest. Это были последние страницы с ручным `<Footer />`
- **chore(eslint):** Добавлен ignore для `.claude/**` (GSD install artifacts), `.planning/**` (planning artifacts, gitignored), `src/generated/**` (Prisma client). Никаких новых eslint-ошибок от Phase 1-5 не введено. Pre-existing 7 errors (`set-state-in-effect` в `gantt-header.tsx`, `use-estimation-notification.ts`) + 13 unused-vars warnings (csv-parser, report) сохранены **как есть** — pre-existing, вне scope визуального редизайна
- **audit(footer):** Поиск `from "@/components/footer"` теперь возвращает **только `src/components/ui/page-shell.tsx`** — Footer стал внутренней деталью PageShell, нельзя случайно забыть на public page
- **audit(ui-primitives):** 16 файлов в `src/app/` используют `@/components/ui` — полное покрытие дизайн-системой
- **audit(gantt):** Намеренно не тронут (см. Phase 4 changelog), причина задокументирована
- **chore(epic):** `docs/features/epic-11-visual-redesign.md` обновлён до финального статуса

### Эпик 11 — итоги

**Phase 1** заложил shared UI primitives (`Button`, `IconButton`, `Card`+`SectionHeader`, `Badge`, `Field`+`Input`+`Textarea`+`Checkbox`, `PageShell`+`PageHeader`, `Spinner`+`LoadingScreen`).

**Phase 2** переделал главную (`/`) — landing для гостей и dashboard для авторизованных. Refined visual rhythm, animate-ping live badge, gradient icon-containers, hover-lift cards.

**Phase 3** унифицировал public entry pages: `/login`, `/register`, `/poker` landing+form, `/poker/[code]` join-form, `/invite/[token]`, chrome для `/terms`+`/privacy`+`/cookies`. Footer ушёл в PageShell автоматически.

**Phase 4** привёл app pages к единому ритму: `/settings`, `/project/[id]/settings`, `/poker/[code]` board, `/project/[id]/estimation`. LoadingScreen унифицирован. Gantt board намеренно не тронут (h-screen layout).

**Phase 5** закрыл error pages и провёл cross-page audit — Footer теперь только в PageShell, eslint ignored для third-party (.claude, .planning, generated/), 16/16 pages используют ui-primitives.

**Изменено файлов:** 22 (8 новых ui-primitives + 14 переписанных страниц/компонентов)  
**НЕ изменено:** Server Actions, Prisma schema, API routes, polling hooks, business logic, user journey, тексты (кроме 2 новых ключей в Phase 2: `noProjectsTitleNew`, `ownerBadgeShort`). Gantt (`project-content.tsx`) сохранён как есть.

**Build:** ✓ Compiled successfully  
**Lint:** только pre-existing errors/warnings (set-state-in-effect и unused-vars из других эпиков)

## 2026-06-01 (Epic 11 Phase 4 — App Pages)

Authentication-internal страницы (где user проводит время) приведены к единому visual rhythm с public surfaces. Применён минимально-инвазивный подход: chrome заменён на `<PageShell>` + `<PageHeader>`, loading state — на `<LoadingScreen>`. Внутренние interaction-tighty компоненты (sidebars, forms, gantt) оставлены как есть.

- **feat(user-settings):** `src/app/settings/page.tsx` — `<PageShell variant="app">` + `<PageHeader>` с back-`IconButton` + brand-логотип + UserMenu. Profile блок → `<Card>+<SectionHeader>`. Language form → `<Card>+<Button>`. Success notice получил `<emerald>` border + ✓ префикс. Title увеличен до `text-3xl`
- **feat(project-settings):** `src/app/project/[id]/settings/page.tsx` — outer wrapper заменён на `<PageShell variant="app">`. Title увеличен до `text-3xl`. Inline section constants (`SECTION_CLASS` и т.д.) **намеренно не тронуты** — они и так визуально идентичны `<Card>+<SectionHeader>` и в файле много специфичной grid-логики (SP scale editor, members, invite links), переписывать = риск регрессии
- **feat(quick-room-board):** `src/app/poker/[code]/quick-room-board.tsx` — outer chrome заменён на `<PageShell variant="app">`. Loading state теперь `<LoadingScreen label>`. Custom sticky header (room code, copy link, QR, leave) — sохранён, он слишком специфичен для unified `<PageHeader>`
- **feat(estimation-board):** `src/components/estimation/estimation-board.tsx` — outer chrome заменён на `<PageShell variant="app">`. Loading state → `<LoadingScreen>`. Inline header с tickets sidebar и main area — сохранён (slot-based design board нельзя унифицировать)
- **chore(gantt):** `src/app/project/[id]/project-content.tsx` — **намеренно не тронут**. Gantt использует `h-screen` (не `min-h-screen`) для точного chart-scroll behavior. PageShell сделал бы layout-break. По ROADMAP-у Gantt помечен как "самый рискованный, делать последним с light touch" — light touch = nothing
- **chore(loading):** Унификация loading screen — теперь 3 страницы (`/settings`, `/poker/[code]`, `/project/[id]/estimation`) показывают одинаковый spinner + label вместо трёх разных вариантов

**Что НЕ изменилось:** Server Actions, polling hooks, drag-drop logic, sidebar interactions, ticket form / import modal, voting form / results / details, gantt chart rendering, sprint timeline, time-offs.

**Build:** ✓ Compiled successfully — пройдено после каждого файла.

## 2026-06-01 (Epic 11 Phase 3 — Public Entry Pages)

Все публичные точки входа на новые UI-primitives. Единый визуальный язык от первого экрана до создания комнаты. Flow и тексты не изменены — только chrome.

- **feat(login):** `src/app/login/page.tsx` — `<PageShell variant="public">` + brand-логотип сверху (gradient blue icon + `appName`) + `<Card>` с формой через `<Field>+<Input>+<Button>`. `size="lg"` инпуты для тач-френдли feel
- **feat(register):** `src/app/register/page.tsx` — то же шаблон, плюс `<Checkbox align="top">` для consent UX (16+ checkbox + Terms/Privacy links сохранены)
- **feat(poker landing):** `src/app/poker/page.tsx` + `poker-landing-form.tsx` — `<PageShell>` с brand-зерном (Bolt icon в quick poker color), форма через `<Field>+<Input>+<Button>`. Method selector грид остался hand-rolled (specifically-tuned). "OR" разделитель через `<Badge>`. "Logged in as" блок получил иконку перед текстом
- **feat(quick-room join):** `src/app/poker/[code]/quick-room-join-form.tsx` — `<Field>+<Input>+<Button>` примитивы. Consent inline-текст сохранён
- **feat(invite):** `src/app/invite/[token]/page.tsx` — `<PageShell variant="app">` (т.к. authenticated only) + `<PageHeader>` с brand и UserMenu + `<Card>` с формой. Hero icon в gradient bg. `invite-form.tsx`: role-buttons получили per-role color encoding (DEV=indigo, QA=emerald, BA=amber) вместо одинакового синего — теперь визуально совпадает с project role colours везде в продукте. `aria-pressed` на role-buttons для a11y. SM rights notice получил `<Badge tone="warning">` и более plotting layout
- **feat(legal):** `src/app/terms/page.tsx`, `privacy/page.tsx`, `cookies/page.tsx` — обернуты в `<PageShell variant="public">` вместо ручного div+Footer. Содержание юридического текста **не изменено** (как требует Definition of Done эпика 11)
- **chore(footer):** Footer теперь автоматически рендерится в `<PageShell variant="public">` — ручные `<Footer />` import-ы убраны из 5 файлов

**Что НЕ изменилось:** Server Actions (`login`, `register`, `joinProject`, `createQuickRoom`, `joinQuickRoomAsGuest`), schema, i18n keys, маршруты, user journey, тексты на legal-страницах.

**Build:** ✓ Compiled successfully — пройдено после каждого файла.

## 2026-06-01 (Epic 11 Phase 2 — Home Page Redesign)

Refined-current редизайн главной страницы. Обе варианта (`/` для гостей через `LandingPage` и для авторизованных через `HomePage`) полностью на новые UI-primitives. Flow и тексты не изменились, только визуальное исполнение и UX-полировка.

- **feat(home/dashboard):** `src/app/page.tsx` переписан на `<PageShell variant="app">` + `<PageHeader>` с brand (gradient blue icon), Planning Poker shortcut и UserMenu. Greeting/title иерархия (sm meta → 3xl title). Create-project в отдельном `<Card>` с inline формой. Project cards используют `<Card variant="flush">` с full-card click area, primary action (Estimation) visible, settings — `<IconButton>` с tooltip, Owner `<Badge>` для уточнения роли
- **feat(home/dashboard):** Empty state переделан — gradient-icon в кружке вместо плоского SVG, осмысленный CTA (создать первый проект). Фильтр `project: { isQuick: false }` чтобы Quick-комнаты не засоряли список проектов
- **feat(landing):** `src/components/landing-page.tsx` полностью переписан, использует `<PageShell variant="public">` (auto Footer) + custom `<LandingNav>` (sticky, backdrop-blur). Hero получил soft radial backdrop (CSS radial-gradient, без assets), `text-balance` / `text-pretty` для перенесов, шкала до `text-7xl` на lg. Animated-ping dot на live badge
- **feat(landing):** Dual CTA через `<Card variant="accent">` (Quick Poker, gradient) и `<Card variant="flush" border-2>` (Sprint Planner). Hover-lift `-translate-y-0.5` + shadow growth, focus-visible rings (`ring-blue-500/30`) для a11y. Checkmarks вынесены в круглые badge перед текстом фичи, не inline icons
- **feat(landing):** Trust block — gradient icon-containers, `tracking-[0.18em]` на uppercase заголовке. How-it-works steps в `<Card>` с number-badge. FAQ — карточки с hover-states (`hover:bg-zinc-50`)
- **feat(landing):** Hero CTA button в How-it-works получил gradient bg + shadow-lift на hover
- **feat(i18n):** Новые ключи `home.noProjectsTitleNew` и `home.ownerBadgeShort` в 7 языках
- **chore(skills):** Skill `frontend-dev` уже направляет в `@/components/ui` (обновлено в Phase 1) — никаких изменений не требуется

**Что НЕ изменилось:** Server Actions, schema, API routes, user journey (тот же flow: создать проект → залогиниться → попасть в /poker → создать комнату → голосовать), любые тексты (i18n keys кроме добавленных)

**Build:** ✓ Compiled successfully — пройдено после Dashboard и после Landing

## 2026-06-01 (Epic 11 Phase 1 — Design Foundation)

Старт milestone Visual Redesign. Phase 1 закладывает shared UI primitives — без них Phase 2+ привели бы к дублированию Tailwind-классов по всем страницам.

- **feat(ui):** `src/components/ui/button.tsx` — `<Button>` с variants `primary | secondary | ghost | danger` × sizes `sm | md | lg`, prop `block` для full-width
- **feat(ui):** `src/components/ui/icon-button.tsx` — `<IconButton>` square с обязательным `label` (tooltip + aria-label) и variants `ghost | outline`
- **feat(ui):** `src/components/ui/card.tsx` — `<Card>` (variants `default | compact | flush | accent`) и `<SectionHeader>` с opt `actions` slot
- **feat(ui):** `src/components/ui/badge.tsx` — `<Badge>` с tones `neutral | info | success | warning | danger | accent | role-dev | role-qa | role-ba`
- **feat(ui):** `src/components/ui/field.tsx` — `<Field>` обёртка с label+hint/error, `<Input>`, `<Textarea>` (consistent visual language), `<Checkbox>` для consent UX
- **feat(ui):** `src/components/ui/page-shell.tsx` — `<PageShell variant="public|app">` (auto Footer для public) + `<PageHeader leading/title/trailing>` для sticky-friendly шапки
- **feat(ui):** `src/components/ui/loading-spinner.tsx` — `<Spinner>` inline + `<LoadingScreen>` full-page
- **feat(ui):** `src/components/ui/index.ts` — barrel re-export, импорт через `@/components/ui`
- **chore(skills):** `skills/frontend-dev/SKILL.md` + `references/ui-patterns.md` обновлены — теперь Section 4.5 и шапка ui-patterns направляют сразу в `@/components/ui` вместо inline-разметки
- **chore(gitignore):** `.planning/` добавлен в `.gitignore` (GSD-артефакты планирования локальные, итоги фиксируются в changelog/docs)

**Что не сделано:** ни одна существующая страница ещё не портирована на новые компоненты — это Phase 2 (Home Page) и далее. Foundation готов, можно строить.

## 2026-05-31 (Phase 2 — финальный релиз: governance, redesign, polish)

### Brand & Legal
- **feat(brand):** Переименование `Sprint Planner` → `Planning Poker`. Lib-константы в `src/lib/legal.ts` (CONTROLLER_NAME, CONTACT_EMAIL, JURISDICTION, MIN_AGE=16)
- **feat(legal):** Полноценные `/terms`, `/privacy`, `/cookies` страницы — на английском, GDPR-compliant (для Польши/EU), AS IS disclaimer, limitation of liability = €0 для бесплатного сервиса, права субъектов данных Art. 15-21 GDPR, сабпроцессоры (Vercel, Turso), Min age 16
- **feat(consent):** Чекбокс согласия на `/register` (обязательный, блокирует submit) + browse-wrap текст «By using you confirm 16+ and accept Terms / Privacy» на `/poker` landing form и join form
- **feat(cookie-banner):** Информационный (не gating) cookie-баннер с localStorage dismiss, виден один раз на первом визите. Контент: «only functional cookies, no tracking»
- **feat(footer):** Глобальный footer-компонент со ссылками на Terms / Privacy / Cookies / Contact + бренд-строка «Free forever • No tracking». Подключён в registration, /poker, all legal pages, error pages

### Landing redesign
- **feat(landing):** Полный редизайн главной для гостей — hero с заголовком «Estimation in 60 seconds» + **два равных CTA** карточками: Quick Poker (без регистрации, выделен синим border) и Sprint Planner (полное приложение). Trust block: «Free forever / No tracking / Minimal data». «How it works» — 3 шага Quick Poker. FAQ с 4 вопросами (free? NDA? data retention? who's behind?)
- **feat(landing):** Footer на landing с legal ссылками

### Error pages & polish
- **feat(errors):** `/not-found` (404) и `/error` (500) — кастомные страницы с Footer, CTA «Back home» + «Try Planning Poker»
- **feat(api):** Cron endpoint `/api/cron/cleanup-expired` — удаляет истёкшие Quick-комнаты и orphan guest-юзеров (защищён `CRON_SECRET` в проде). `vercel.json` запускает каждый час
- **feat(quick-room):** QR-код для шеринга комнаты — модал с локально-сгенерированным SVG (пакет `qrcode`), показывает код + URL. Кнопка-иконка рядом с «Копировать ссылку»
- **feat(quick-room):** Кнопка «Leave» для гостей в шапке. Action `leaveQuickRoom` чистит membership, удаляет guest-юзера если у него больше нет других проектов, очищает session-cookie
- **feat(quick-room):** Action `kickFromQuickRoom` (host-only) — для будущего UI. Проверяет ownerId и не даёт кикнуть себя
- **fix(quick-room):** Хост не может leave (ошибка «host cannot leave») — комната рассыплется

### i18n
- **feat(i18n):** Все новые ключи в 7 языках: namespace `legal` (registerAgreement, terms, privacy, and), `cookieBanner` (message, learnMore, dismiss), `errors` (notFoundTitle, serverErrorTitle, tryAgain, backHome, tryQuickPoker, hostCannotLeave, cannotKickHost), `landing` (ctaQuickBadge, ctaQuickTitle/Desc/Feature1-3/Action, ctaFullBadge/Title/Desc/Feature1-3/Action, trustTitle, trust1-3 Title/Desc, howQuickTitle/Sub, howQuick1-3 Title/Desc, faqTitle, faq1-4 Q/A, signUp), `quickRoom` (qrTitle, leave, agreementInline)

## 2026-05-31 (Видимость гистограммы: только SM/host по дефолту + тогл «показать всем»)
- **feat(schema):** Project.showDistributionToAll: Boolean @default(false) — флаг видимости гистограммы голосов для не-админов
- **feat(actions):** `setShowDistribution(projectId, show)` в `estimation.ts` — доступен SM/host (через `requireProjectSM`, которая для Quick-комнат проверяет owner)
- **feat(api):** `estimationConfig.showDistributionToAll` в response `/api/estimation/session` и `/api/estimation/ticket-stats`
- **feat(ui):** `VoteDistributionChart` теперь принимает опциональный `headerSlot` — место для контролов в шапке (используется для чекбокса)
- **feat(ui):** В `VoteDetails` chart рендерится при `isSM || showDistributionToAll`. Чекбокс «Показать график всем» в шапке chart виден только SM/host, optimistic update + polling-синхронизация для остальных
- **feat(i18n):** Ключ `showToAll` в 7 языках

## 2026-05-31 (Гистограмма распределения голосов)
- **feat(estimation):** Новый компонент `VoteDistributionChart` — SVG-гистограмма распределения голосов с подсветкой медианы (синий), рекомендации (янтарь) и выбросов через IQR (красная рамка). Hover на колонке показывает имена проголосовавших. Без сторонних библиотек графиков
- **feat(estimation):** `VoteDetails` разделён на `CompositeView` (chart по totalScore + 4-факторная таблица) и `SimpleView` (chart по singleValue + одноколоночная таблица с единицами `h`/`d`/SP). Для simple-методов раньше была только min/median/max — теперь полное распределение
- **feat(estimation):** Chart показывается при ≥ 3 голосах (раньше — никогда для simple, всегда таблица для composite)
- **feat(i18n):** Ключи `distributionTitle`, `voteCount`, `legendMedian`, `legendRecommended`, `legendOutlier`, `vote` в 7 языках

## 2026-05-31 (Quick Rooms: смена метода во время сессии с real-time апдейтом)
- **feat(quick-room):** `changeQuickRoomMethod` теперь корректно работает во время активного раунда — голоса в старом методе очищаются в транзакции, сессия возвращается в `VOTING`, текущий тикет остаётся. Команда переголосовывает в новом методе
- **feat(ui):** Toast «Метод изменён на X. Текущий раунд переголосуется.» для всех участников (показывается на 3.5 секунды через сравнение `prevMethodRef` в `useEffect`)
- **fix(ui):** `<VotingForm key={method} ... />` в `quick-room-board.tsx` и `estimation-board.tsx` — React пересоздаёт компонент при смене метода, локальный `selected` state сбрасывается. Иначе форма могла показать невалидное значение из старой шкалы
- **feat(i18n):** Ключ `methodChangedToast` в 7 языках

## 2026-05-29 (Эпик 10, итерация 2: Quick Rooms — быстрый planning poker без проектов)
- **feat(schema):** `Project.isQuick`/`accessCode`(unique)/`expiresAt` для Quick-комнат. `User.passwordHash` сделан nullable, добавлены `User.isGuest` и `User.expiresAt`. `User.name` больше не unique — теперь несколько гостей могут иметь одно имя; register/login переключены на `findFirst({name, isGuest: false})`
- **feat(quick-room):** `src/lib/quick-room.ts` — генератор кода `XKZ-294` (алфавит без 0/O/1/I), TTL = 24ч, lazy-проверка истечения, нормализация ника
- **feat(actions):** `createQuickRoom` (создаёт Project с isQuick=true + хост-юзер, если не залогинен — создаём guest); `joinQuickRoomAsGuest(code, nickname)` (по ссылке вводит ник); `startNextRound(code)` (Ticket с title="Раунд N", делает активным); `changeQuickRoomMethod(code, method)` (хост меняет метод эстимации в комнате)
- **feat(api/voting):** `submitVote` и `requireProjectSM` в Quick-комнатах не требуют DEV/QA/BA-роли — любой member голосует; SM-логика заменена проверкой `project.ownerId === userId`. API `/api/estimation/session` возвращает `quickRoom: { accessCode, isHost }` для Quick-проектов
- **feat(pages):** `/poker` — публичный landing с CTA «Создать комнату» (ник + метод + кнопка), плюс поле «Присоединиться по коду». `/poker/[code]` — серверный резолв accessCode → 404/expired/join-form/board
- **feat(quick-room-board):** упрощённая комната — хедер с кодом + копировать ссылку + ник + бейдж Хост, переключатель метода (только хост), states: IDLE (хост запускает первый раунд) / VOTING (форма голосования + прогресс) / REVEALED (медиана + рекомендация + таблица голосов + «Следующий раунд» / «Переголосовать»)
- **feat(navigation):** Вкладка «Planning Poker» в хедере главной страницы (для авторизованных) и в навигации landing-страницы + рядом с «Sign In» в hero
- **feat(proxy):** `/poker` и `/poker/[code]` публично доступны без auth (для гостей)
- **feat(i18n):** ~40 новых ключей в 7 языках — новый namespace `quickRoom`, ключи в `common` (close, backToApp, planningPokerNav), `landing` (quickPokerNav), `errors` (guestNicknameRequired, quickRoomNotFound, onlyHostCanStartRound и т.д.)
- **chore(migration):** `20260528212850_add_quick_rooms`
- **chore(seed):** seed.ts переключён на findFirst+create для users (после удаления @unique с name)

## 2026-05-26 (Эпик 10, итерация 1: мульти-методная эстимация)
- **feat(schema):** `Project.estimationMethod` (`COMPOSITE_SP` | `FIBONACCI_SP` | `HOURS` | `DAYS`), `Project.workingHoursPerDay` (дефолт 8). Поля `Vote.devEffort/qaEffort/risk/uncertainty` сделаны nullable, добавлено `Vote.singleValue` для single-value методов
- **feat(engine):** `calculateSimpleEstimation()` — медиана + round-up к sane-шкале (HOURS: 1,2,4,8,16,24,40; DAYS: 0.5,1,2,3,5,8,13; FIBONACCI: 1,2,3,5,8,13,21). Конвертация в SP через проектную шкалу по длительности в днях. SP-эквивалент сохраняется в `Ticket.storyPoints` — Гант и отчёты работают без изменений
- **feat(estimation):** `submitVote` и `acceptEstimation` ветвятся по методу проекта. Валидация значений из соответствующей шкалы
- **feat(api):** `/api/estimation/session` и `/api/estimation/ticket-stats` возвращают `estimationConfig: { method, workingHoursPerDay, shape }`. Структура `results` варьируется по методу (`{ method, ... }`-discriminated union)
- **feat(voting-form):** Обёртка с ветвлением — `VotingFormComposite` (4-факторный, без изменений) и `VotingFormSimple` (одна линейка карточек). Для HOURS-голоса показывается approximate-конвертация в дни
- **feat(voting-results):** Для FIBONACCI_SP/HOURS/DAYS блок «Рекомендация» = round-up значение, hint про конвертацию (для HOURS — в дни), блок «Разброс голосов» (min/median/max). Для COMPOSITE_SP — без изменений. Строки переведены через i18n namespace `votingResults`
- **feat(vote-details):** Поддержка единого голоса (`singleValue`) — упрощённая таблица с одной колонкой для simple-методов
- **feat(settings):** Новая секция «Метод эстимации» — 4 карточки с описаниями, при HOURS показывается поле `workingHoursPerDay` (1-24)
- **feat(i18n):** ~30 новых ключей в 7 языках (ru, en, pl, es, be, uk, hi) — `projectSettings.estimationMethod*`, `votingForm.simple*`, новый namespace `votingResults`, `voteDetails.voteColumn`, `errors.invalidEstimationMethod`/`workingHoursRange`
- **chore(migration):** `20260526180821_add_estimation_method`

## 2026-03-16 (Estimation polling interval)
- **refactor(estimation):** Интервал polling в estimation увеличен с 2 до 5 секунд (`use-estimation-polling` и `estimation-board`)
- **chore(docs):** Обновлена документация по estimation/архитектуре: polling = 5 секунд

## 2026-03-16 (Спринт стартует в любой день)
- **fix(sprint):** Убрана валидация `isCorrectStartDay` — первый спринт может стартовать в любой день недели
- **fix(calendar):** Мини-календарь первого спринта показывает все дни как кликабельные (убран хардкод среды)
- **refactor(settings):** Удалён селектор `sprintStartDay` из настроек проекта — поле больше не используется
- **refactor(date-utils):** Удалены `isWednesday`, `isCorrectStartDay`, константа `WEDNESDAY`
- **refactor(i18n):** Удалены ключи `sprintMustStartOn`, `startDay`, `startDayRange`; обновлены `selectStartDate`, `calendarHint` во всех 7 языках

## 2026-03-15 (Удаление глобальной роли SM)
- **refactor(schema):** Удалено поле `User.isScrumMaster` — SM-права теперь только per-project (`ProjectMember.isScrumMaster` + `project.ownerId`)
- **refactor(auth):** Упрощена регистрация — только имя + пароль, без чекбокса SM
- **refactor(project):** Любой авторизованный пользователь может создавать проекты. Создатель = owner + SM автоматически
- **refactor(settings):** Удалён SM-toggle из настроек профиля (`/settings`). Удалён `updateUserProfile` action
- **refactor(api):** Удалено поле `userIsScrumMaster` из ответа `GET /api/project/[id]/members`
- **refactor(i18n):** Удалены ключи `auth.scrumMaster`, `auth.scrumMasterDesc`, `errors.onlySmCanCreateProjects`
- **chore(prd):** PRD v6.2 — обновлены секции авторизации, ролей, проектов, эпика 6
- **chore(docs):** Обновлены epic-1, epic-6, tech-architecture

## 2026-03-15 (Deployment: Vercel + Turso)
- **feat(infra):** Добавлен `@prisma/adapter-libsql` и `@libsql/client` для Turso (libSQL) в проде
- **feat(infra):** Условный выбор адаптера в `src/lib/db.ts`: Turso (prod) / better-sqlite3 (local)
- **feat(infra):** Build-скрипт: `prisma generate && next build`, postinstall hook
- **feat(infra):** Развёрнуто на Vercel (Hobby free tier), БД на Turso (Starter free tier)
- **feat(infra):** Деплой локальной командой `vercel --prod`

## 2026-03-15 (Landing Page)
- **feat(landing):** Landing page для неавторизованных пользователей — hero, features, how it works, CTA секции
- **refactor(home):** Условный рендеринг на `/`: гости видят лендинг, авторизованные — дашборд проектов
- **feat(landing):** Staggered fade-in анимации, gradient glow, sticky navbar, адаптивная вёрстка
- **feat(i18n):** Namespace `landing` с 22 ключами переводов во всех 7 языках

## 2026-03-15 (Разделение глобальных и проектных ролей + роль BA)
- **refactor(permissions):** `hasSmRights(userId, membership, project)` — глобальный `isScrumMaster` больше не даёт SM-права в проектах, только право создавать проекты
- **feat(permissions):** Владелец проекта (`project.ownerId`) всегда имеет SM-права, которые нельзя отозвать
- **feat(project-settings):** Бейдж «Owner» и заблокированный SM-toggle для владельца в списке участников
- **feat(project-settings):** Защита `toggleMemberSm` от изменения статуса владельца
- **feat(roles):** Новая командная роль BA (Business Analyst) — голосование, отдельная секция на Ганте, назначение тикетов
- **feat(gantt):** Третья секция BA на диаграмме Ганта (после QA), amber-стилизация блоков
- **feat(assignment):** Drop на BA создаёт только BA-назначение (без авто-привязки к DEV/QA)
- **feat(invite):** BA-карточка на форме присоединения к проекту
- **feat(report):** BA-секция в PDF-отчёте — группа, колонки baAssignee и baDays
- **feat(i18n):** Ключи `cannotChangeOwnerSm`, `ownerBadge`, `roleBa`, `businessAnalyst`, `baDesc`, `ba`, `baAssignee`, `baDays` во всех 7 языках

## 2026-03-15 (Sprint Report PDF Export)
- **feat(report):** Экспорт PDF-отчёта по спринт-планированию — Ганта-чарт, сводка, таблицы по участникам и тикетам
- **feat(report):** Multi-sprint выбор через чекбоксы в диалоге экспорта
- **feat(report):** Настраиваемый бэклог — toggle + поиск + ручной выбор тикетов (выключен по умолчанию)
- **feat(report):** Клиентская генерация PDF через `jspdf` + `jspdf-autotable`, landscape A4
- **feat(report):** API endpoint `GET /api/project/[id]/report` для данных отчёта
- **feat(report):** Кликабельные ссылки на Jira в PDF — ID тикетов во всех таблицах являются гиперссылками на `externalUrl`
- **feat(report):** Выбор языка PDF в диалоге экспорта — дефолт = язык интерфейса пользователя, все 7 языков доступны
- **feat(i18n):** Namespace `report` с 45 ключами во всех 7 языковых файлах

## 2026-03-15 (i18n: Мультиязычная поддержка)
- **feat(i18n):** 6 новых языков: English, Polski, Español, Беларуская, Українська, हिन्दी — файлы `messages/{en,pl,es,be,uk,hi}.json`
- **feat(i18n):** Автоопределение языка по заголовку `Accept-Language` браузера при первом визите
- **feat(i18n):** Fallback на английский, если язык браузера не поддерживается
- **feat(i18n):** Языковой дропдаун в настройках расширен до 7 языков
- **feat(i18n):** Cursor rule `.cursor/rules/i18n.mdc` — автоматическое соблюдение i18n при добавлении новых фич

## 2026-03-15 (i18n: Интернационализация)
- **feat(i18n):** Интеграция `next-intl` — поддержка интернационализации для всех лейблов и сообщений в приложении
- **feat(i18n):** Файл переводов `messages/ru.json` — ~200 ключей, организованных по namespace (common, auth, home, settings, estimation, gantt, errors и др.)
- **feat(i18n):** Конфигурация `src/i18n/request.ts` — cookie-based выбор локали (`NEXT_LOCALE`)
- **feat(i18n):** `NextIntlClientProvider` в root layout — переводы доступны во всех серверных и клиентских компонентах
- **feat(user-menu):** Новый компонент `UserMenu` — выпадающее меню возле имени пользователя с кнопками «Настройки» и «Выйти»
- **feat(settings):** Языковой дропдаун на странице `/settings` — выбор языка интерфейса (пока только Русский)
- **feat(locale-action):** Server action `setLocale` — сохраняет выбранный язык в cookie
- **refactor(pages):** Все страницы переведены на `useTranslations` / `getTranslations` — login, register, home, settings, invite, project settings, estimation
- **refactor(components):** Все компоненты переведены — estimation-board, ticket-form, import-modal, voting-form, vote-details, estimation-toast, gantt-board, gantt-backlog, gantt-empty-state, sprint-create-dialog, gantt-header
- **refactor(actions):** Все error messages в server actions используют `getTranslations("errors")` — auth, project, estimation, sprint, assignment, timeoff
- **refactor(home):** Инлайн-ссылки «Настройки» и «Выйти» заменены на компонент `UserMenu` (dropdown)
- **refactor(project-content):** Аналогично — `UserMenu` вместо инлайн-ссылок в хедере проекта

## 2026-03-15 (Эпик 2: Импорт тикетов из CSV)
- **feat(csv-parser):** Клиентский парсер CSV/TSV на базе papaparse с автоопределением разделителя, маппингом колонок по алиасам и валидацией (title обязательно)
- **feat(estimation):** Server action `importTickets` — массовое создание тикетов через `prisma.ticket.createMany()`, SM-only
- **feat(estimation):** Модал импорта тикетов: два режима ввода (вставка текста / drag-and-drop файла), инструкция по формату, таблица предпросмотра с подсветкой ошибок
- **feat(estimation-board):** Кнопка импорта (upload icon) в сайдбаре рядом с «+» для SM

## 2026-03-15 (Эпик 7: Настройки проекта для SM)
- **feat(schema):** Новые поля в Project: `sprintDurationWeeks`, `sprintStartDay`, `sprintNameTemplate`, `taskCoefficient`, `activeSprintId`
- **feat(schema):** Новая модель `SpScaleItem` — настраиваемая шкала SP per-project
- **feat(sp-scale):** Хелпер `getSpDurationDays()` — длительность из шкалы проекта с коэффициентом
- **feat(sprint):** Длительность спринта 1-4 недели, настраиваемый день старта вместо хардкода Ср-Вт
- **feat(sprint):** Шаблон нейминга спринтов с переменными `{number}`, `{date}`, `{quarter}`, `{year}`
- **feat(sprint):** `recalcFutureSprints` — пересчёт будущих спринтов при изменении длительности
- **feat(active-sprint):** `activeSprintId` на проекте, автоскролл борды к активному спринту
- **feat(active-sprint):** Кнопка «Сделать активным» на заголовке спринта для SM
- **feat(sp-scale):** Редактируемая шкала SP в Settings (значение, описание, дни), сброс к дефолту
- **feat(estimation):** SP-selector показывает лейблы из шкалы проекта при голосовании
- **feat(coefficient):** Коэффициент задач — множитель длительности при назначении
- **feat(settings):** 5 новых секций настроек: спринт, шаблон имени, активный спринт, шкала SP, коэффициент
- **feat(api):** `GET /api/project/[id]/settings` — конфигурация проекта
- **refactor(assignment):** `assignTicket`, `splitTicketAssignment` используют шкалу проекта и коэффициент
- **refactor(estimation-engine):** `calculateEstimation` принимает опциональные SP-значения проекта

## 2026-03-15 (Per-project роли и множественные invite-ссылки)
- **refactor(schema):** Роль (`role`) перенесена с `User` на `ProjectMember` — теперь per-project
- **feat(schema):** Новая модель `InviteLink` — множественные invite-ссылки с флагом `grantsSm`
- **refactor(schema):** Удалён `Project.inviteToken`, заменён на `InviteLink.token`
- **feat(invite):** При присоединении к проекту пользователь выбирает роль (DEV/QA/без роли)
- **feat(invite):** SM может создавать несколько invite-ссылок (с/без SM-прав) в настройках проекта
- **feat(settings):** SM может менять роль участника (DEV/QA/—) через сегментированные кнопки
- **feat(settings):** Секция управления invite-ссылками — создание, копирование, удаление
- **refactor(register):** Упрощена регистрация — имя + пароль + чекбокс SM (без выбора роли)
- **refactor(settings):** Настройки профиля — убран выбор роли (теперь per-project)
- **refactor(api):** board/state, estimation/session — фильтрация по `ProjectMember.role` вместо `User.role`
- **refactor(actions):** estimation, assignment — проверки по `membership.role` вместо `user.role`
- **chore(seed):** Роли перенесены в `memberDefs` для `ProjectMember`, добавлены 2 `InviteLink`
- **chore(prd):** Обновлён PRD v5.0 — per-project роли, множественные invite-ссылки
- **chore(tech-architecture):** Обновлены модели БД, маршрутизация
- **refactor(sm-toggle):** Удалён переключатель «Команда / Скрам Мастер». SM с ролью DEV/QA теперь всегда видит расширенный UI и может голосовать + управлять одновременно

## 2026-03-14 (Seed: тестовые данные)
- **chore(seed):** Prisma seed скрипт `prisma/seed.ts` — 16 пользователей (5 DEV, 5 QA, 2 DEV+SM, 2 QA+SM, 2 pure SM), пароль `1234`
- **chore(seed):** Проект «Todo List App» с 23 тикетами (Auth, CRUD, Lists, Rich Content, Collaboration, UX)
- **chore(prisma-config):** `prisma.config.ts` — настроена seed-команда `npx tsx prisma/seed.ts`

## 2026-03-14 (Estimation: расширенная статистика)
- **refactor(estimation-engine):** Медиана вместо среднего — устойчивость к выбросам
- **feat(estimation):** Таблица индивидуальных голосов «Голоса команды» для всех участников после раскрытия
- **feat(estimation):** SM-only: подсветка Risk=2 (amber), IQR outlier detection (красный бордер + бейдж «Выброс»), строка медианы
- **feat(api):** `GET /api/estimation/ticket-stats` — статистика любого тикета с голосами
- **feat(estimation):** Клик на оценённый тикет в sidebar — модал со статистикой, голосами и SM-кнопками

## 2026-03-14 (Estimation: SM override SP)
- **feat(estimation):** SM выбирает произвольное значение SP (1/2/3/5/8/13) при принятии оценки — Fibonacci-шкала с предвыбранной рекомендацией
- **feat(estimation):** `acceptEstimation` принимает опциональный `overrideSp` параметр

## 2026-03-14 (Документация)
- **chore(prd):** Обновлён PRD v4.0 — роли, регистрация, SM как флаг, множественные SM, эпик 6
- **chore(tech-architecture):** Обновлён Tech Architecture — схема БД с nullable role и SM-флагами, permissions architecture
- **chore(feature-docs):** Добавлены правила обновления PRD и Tech Architecture при изменениях бизнес-логики или архитектуры
- **chore(epic-docs):** Обновлены epic-0, epic-1, epic-6 — nullable role, актуальная регистрация

## 2026-03-14 (Эпик 6: SM как флаг + несколько Скрам-мастеров)
- **refactor(schema):** `User.role` стал nullable (`"DEV" | "QA" | null`). Чистый SM (role=null) не виден на Ганте и не голосует
- **refactor(schema):** `SCRUM_MASTER` удалён из `User.role`. Добавлен `User.isScrumMaster: Boolean`
- **feat(schema):** `ProjectMember.isScrumMaster: Boolean` — per-project SM-права
- **feat(permissions):** Единый хелпер `hasSmRights(user, membership)` — проверяет оба флага
- **feat(register):** 2 карточки DEV/QA + чекбокс «Scrum Master» при регистрации
- **feat(settings):** Dropdown DEV/QA + чекбокс SM в настройках профиля
- **feat(sm-toggle):** Компонент `SmModeToggle` + hook `useSmMode` — переключатель «Команда / Скрам Мастер» (localStorage)
- **feat(project-settings):** Секция «Участники» — toggle per-project SM-прав, бейдж «SM» для глобальных SM
- **feat(api):** `GET /api/project/[id]/members` — список участников с SM-статусами
- **refactor(actions):** Все `requireProjectSM()` обновлены на `hasSmRights(user, membership)`
- **refactor(estimation):** Все пользователи голосуют — ограничение `canVote` по роли удалено
- **refactor(invite):** `regenerateInviteToken` и invite API проверяют SM-права вместо ownerId
- **refactor(project-page):** Вынесен в client wrapper `ProjectContent` для поддержки toggle
- **refactor(ui):** `SCRUM_MASTER` удалён из `ROLE_LABELS`/`ROLE_STYLES` во всех страницах

## 2026-03-14 (Эпик 5: Учёт отсутствия / Time-offs)
- **feat(timeoff):** Server action `toggleTimeOff` — SM переключает нерабочие дни кликом по ячейке дня в строке сотрудника
- **feat(board-api):** GET /api/board/state возвращает `timeOffs` для участников проекта в диапазоне спринтов
- **feat(gantt-grid):** Визуальная штриховка (repeating-linear-gradient) на ячейках нерабочих дней, cursor pointer для SM
- **feat(date-utils):** `isNonWorkingDay`, `toDateKey`; `workingDaysToCalendarSpan`/`countWorkingDays` принимают опциональный Set time-off дат
- **feat(gantt-calspan):** Блоки задач растягиваются через дни отпуска — net рабочая длительность сохраняется
- **feat(gantt-store):** Zustand store хранит `timeOffs`, time-off-aware Finish-to-Start в optimisticMove/optimisticResize
- **feat(assignment):** Server-side actions (`assignTicket`, `moveAssignment`, `resizeAssignment`) учитывают time-off при F2S расчётах

## 2026-03-14 (Эпик 4: Hover-popover, multi-assign, backlog split)
- **feat(gantt-blocks):** Hover-popover на блоках: полная информация + кнопка удаления, на узких блоках (1-2 дня) inline-кнопка скрыта
- **feat(backlog):** Бэклог разделён на «Не назначено» и «На доске» (collapsible секции)
- **feat(backlog):** Назначенные тикеты остаются draggable — можно назначить один тикет на нескольких разработчиков
- **fix(backlog):** Убран read-only state для назначенных тикетов

## 2026-03-14 (Эпик 4: Авто-сплит, уникальные цвета тикетов)
- **feat(assignment):** Авто-разделение тикета на DEV + QA блоки при назначении из бэклога
- **feat(ticket-colors):** Уникальный цвет фона для каждого тикета (палитра из 12 цветов)
- **feat(gantt-blocks):** Бейджи DEV/QA на блоках, фон по цвету тикета вместо фиксированных indigo/emerald
- **feat(backlog):** Карточки бэклога окрашены в цвет тикета
- **refactor(assignment):** Удалён ручной split — разделение происходит автоматически

## 2026-03-14 (Эпик 4: Гибкая диаграмма Ганта)
- **feat(board-api):** Расширен GET /api/board/state — assignments + backlog в ответе polling
- **feat(assignment):** Server actions: assignTicket, moveAssignment, resizeAssignment, splitTicketAssignment, deleteAssignment
- **feat(gantt-store):** Zustand store для оптимистичного UI при drag/resize/split
- **feat(gantt-backlog):** Collapsible sidebar с draggable карточками оценённых тикетов
- **feat(gantt-dnd):** DndContext: drag тикета из бэклога на строку конкретного сотрудника, перемещение существующих блоков
- **feat(gantt-blocks):** Ticket blocks с цветовым Dev/QA сплитом, SP → рабочие дни маппинг
- **feat(gantt-multirow):** Interval packing для параллельных задач, динамические высоты строк
- **feat(gantt-resize):** Resize handles с pointer events, spillover через границы спринтов
- **feat(gantt-split):** Разделение Dev/QA через контекстное меню, SVG dependency lines (bezier)
- **feat(gantt-deps):** Finish-to-Start каскад при перемещении Dev-блока
- **fix(gantt-dnd):** Позиционирование при drag по левому краю блока, а не по курсору
- **fix(gantt-working-days):** Длительность в рабочих днях — блоки перепрыгивают выходные
- **feat(gantt-delete):** Кнопка удаления (×) на блоке при наведении
- **chore(date-utils):** spToDurationDays, workingDaysToCalendarSpan, countWorkingDays
- **chore(gantt-layout):** computeSubRows, computeRowHeights — алгоритмы размещения блоков

## 2026-03-14 (Эпик 2: Сессия оценки — дополнение)
- **feat(estimation):** Визуальная индикация оценённых тикетов в списке: зелёный фон, чекмарк-иконка, SP-бейдж в emerald-цвете; кнопка «Переоценить» для уже оценённых

## 2026-03-14 (Эпик 3: Настройка таймлайна)
- **feat(sprint):** Server actions для создания, удаления и переименования спринтов (строго Ср–Вт, последовательное создание встык)
- **feat(board):** API route `GET /api/board/state` + polling hook (2 сек) для real-time обновления Ганта
- **feat(gantt):** Сетка Ганта: ось X (дни/спринты с двухуровневым заголовком), ось Y (sticky-колонка Dev/QA участников)
- **feat(gantt):** Подсветка текущего/прошлого/будущего спринта, выходных, маркер "Сегодня" (красная линия)
- **feat(gantt):** Мини-календарь выбора стартовой среды для первого спринта, inline-переименование
- **feat(gantt):** Пустое состояние с CTA для SM и текстом ожидания для Dev/QA
- **feat(gantt):** Авто-скролл к позиции "Сегодня" при открытии
- **chore(date-utils):** Утилиты дат на date-fns: isWednesday, getSprintEndDate, isWeekend, isToday и др.

## 2026-03-14 (Эпик 0: Auth, Projects, Invites)
- **feat(auth):** Регистрация (`/register`) и вход (`/login`) с login/password, bcrypt-хеширование, cookie-сессия
- **feat(auth):** Кнопка logout на всех страницах
- **feat(projects):** Модель Project + ProjectMember, SM создаёт проекты, главная страница — список проектов
- **feat(invites):** Reusable invite-ссылки `/invite/{token}`, redirect после логина, перегенерация токена
- **refactor(estimation):** Перенос estimation под `/project/[id]/estimation`, все данные привязаны к `projectId`
- **refactor(auth):** Удалён `/onboarding`, заменён на `/register` + `/login`
- **refactor(proxy):** Public paths: `/login`, `/register`, `/invite` вместо `/onboarding`
- **chore(schema):** Добавлены Project, ProjectMember, User.login, User.passwordHash, projectId на Sprint/Ticket/EstimationSession
- **chore(prd):** Обновлён PRD v3.0 — секции авторизации, проектов, invite-ссылок
- **chore(tech-architecture):** Обновлён Tech Spec — auth strategy, routing, обновлённая схема

## 2026-03-14 (Эпик 2: Сессия оценки)
- **feat(estimation-session):** Страница `/estimation` — SM создаёт тикеты и выбирает для оценки, команда видит активный тикет через polling (< 2 сек)
- **feat(voting):** Mobile-first голосование по 4 критериям: Dev Effort (1/2/4/6), QA Effort (1/2/4), Risk (0/1/2), Uncertainty (0/1/2)
- **feat(estimation-engine):** Калькуляция SP (2-3→1, 4-5→2, 6-8→3, 9+→5) и пропорции Dev/QA
- **feat(estimation-results):** Визуализация результатов — SP-бейдж, шкала пропорции, прогресс-бары средних баллов
- **feat(estimation-workflow):** SM workflow — раскрытие результатов, принятие оценки (сохранение в тикет), переголосование
- **chore(schema):** Добавлено поле `devEffortProportion` в Ticket, `sprintId` стал опциональным в EstimationSession

## 2026-03-14 (Эпик 1: Онбординг)
- **refactor(roles):** SM стал полноценной ролью — поле `role` принимает "DEV" | "QA" | "SCRUM_MASTER", удалён флаг `isScrumMaster` и админ-панель `/admin`
- **feat(onboarding):** Онбординг с выбором из трёх ролей: Developer, QA Engineer, Scrum Master
- **feat(roles):** Proxy авторизации, утилиты проверки прав (`isScrumMaster`, `canEditBoard`) по `user.role`
- **feat(ui):** Role-aware UI на главной странице и настройках (бейдж роли, адаптивный плейсхолдер Ганта)
- **chore(prd):** Обновление PRD — все три роли выбираются при онбординге
- **chore(tech-architecture):** Обновление Tech Spec — добавлена полная Prisma-схема с моделями Assignment (subRowIndex), Role enum (DEV/QA/SCRUM_MASTER), упрощена real-time стратегия до HTTP Polling
