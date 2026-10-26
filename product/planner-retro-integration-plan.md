# Детальный план интеграции Sprint Retro и развития экосистемы Planner

> **Цель:** Превратить текущую рабочую папку `/Users/Artsiom_Marozau/Documents/proj/pers/sprint-retro` в расширенный монорепозиторий проекта [`MarozauArtsiom/planner`](https://github.com/MarozauArtsiom/planner), добавить в него полноценный под-модуль **Sprint Retro** (по требованиям из [retro-board-features.md](file:///Users/Artsiom_Marozau/Documents/proj/pers/sprint-retro/product/retro-board-features.md)) и переработать **Главную страницу** (Landing + Dashboard), чтобы она отражала всю экосистему: **Sprint Planning (Gantt) + Planning Poker + Sprint Retro**.

---

## Стратегия распределения фаз по моделям (`Flash` vs `Argon`)

План разбит ровно на **5 крупных фаз** без лишнего дробления, чтобы ты мог легко переключать модель под характер задач:

| Фаза | Содержание | Рекомендуемая модель | Почему |
|---|---|---|---|
| **Фаза 1** | Слияние репозитория `planner` в `sprint-retro`, сохранение `knowledge/` и `product/`, настройка БД и проверка сборки | ⚡ **Flash** | Механическая работа с файлами, git, конфигами и CLI-командами. Экономит лимиты без потери качества. |
| **Фаза 2** | Схема БД (Prisma), серверная логика ретро (Actions + Polling API с защитой анонимности/blur), хабы `/retro` и `/project/[id]/retro`, гостевой вход | 🧠 **Argon** | Сложная архитектура БД, безопасность, права доступа (`proxy.ts`), транзакции и консистентность стейта. |
| **Фаза 3** | Интерактивная Ретро-доска `/retro/[token]`: 5 фаз, карточки, Drag-and-Drop группировка (`@dnd-kit`), Dot Voting, таймер со звуком, Carry-over Action Items и мост в `Ticket` | 🧠 **Argon** | Самый сложный фронтенд и бизнес-логика: real-time polling, оптимистичный UI, DnD-группировка, Web Audio API и интеграция со спринтами. |
| **Фаза 4** | Редизайн Главной страницы (`LandingPage` + `HomePage` дашборд) под всю экосистему с живым мульти-превью 3 инструментов | 🧠 **Argon** | Сложная UI/UX-композиция, кастомная верстка, CSS-анимации, интерактивные демо-табы и агрегация данных на дашборде. |
| **Фаза 5** | Раскатка переводов (`i18n`) на остальные 5 языков (`pl`, `es`, `be`, `uk`, `hi`), документация (`changelog.md`, `epic-12`), финальный `build` и `lint` | ⚡ **Flash** | Шаблонный перевод JSON-ключей по готовым `ru.json`/`en.json`, проверка валидности JSON и прогон сборочных скриптов. |

---

## 1. Архитектура экосистемы: «Независимость + Связанность»

Все три инструмента строятся вокруг единого аккаунта (`User`) и пространства команды (`Project`), но работают по принципу **слабого сцепления (loose coupling)**:

1. **Единые креды и проект:** Один логин (`src/lib/session.ts`) открывает доступ ко всем модулям. Внутри `Project` у команды общие участники (`ProjectMember`) и права Scrum Master / Фасилитатора (`hasSmRights`).
2. **Независимость модулей:**
   - Можно пользоваться **только Ретро** (через `/retro` или `/project/[id]/retro`), вообще не создавая спринты или тикеты в Ганте (`RetroBoard.sprintId` опционален).
   - Можно пользоваться **только Планингом / Покером**, не заходя в Ретро.
   - На любую ретро-доску участники могут войти **по приватной ссылке `/retro/[token]` без регистрации**, указав только имя (`User.isGuest = true`), либо войти под своим аккаунтом планера.
3. **Экосистемные мосты (когда используются вместе):**
   - **Ретро ↔ Спринт:** При создании доски в проекте можно привязать её к `Sprint` (по умолчанию — текущий `activeSprint`) и видеть на ретро сводку спринта (даты, закрытые/запланированные задачи и SP).
   - **Carry-over Action Items:** На фазе сбора/действий в новом ретро автоматически показываются прошлые незакрытые `RetroActionItem` этой команды со статусом (`OPEN` / `DONE`).
   - **Action Item → Ticket планера:** Любой `RetroActionItem` можно в 1 клик сконвертировать в `Ticket` в бэклоге проекта или в выбранном спринте (`RetroActionItem.ticketId`).

---

## 2. Детальное описание 5 фаз реализации

### Фаза 1: Организация репозитория и перенос `planner` в `sprint-retro` (Модель: ⚡ Flash)

**Цель:** Превратить `/Users/Artsiom_Marozau/Documents/proj/pers/sprint-retro` в рабочее приложение `planner`, сохранив все наработки по исследованию рынка и продуктовым требованиям ретро.

**Шаги:**
1. Перенести содержимое `https://github.com/MarozauArtsiom/planner` (включая `.git`, `src/`, `prisma/`, `messages/`, `docs/`, `skills/`, `public/`, `scripts/`, конфиги `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vercel.json`) в корень `/Users/Artsiom_Marozau/Documents/proj/pers/sprint-retro`.
2. Сохранить в неприкосновенности папки:
   - `product/` (`retro-board-features.md`, `planner-retro-integration-plan.md`)
   - `knowledge/retro-market/` (вся база LLM Wiki)
   - `.claude/skills/` (`ingest-wiki`, `save-raw`)
3. Объединить `CLAUDE.md` (оставить блок `llm-wiki` + добавить краткую навигацию по стеку `planner` и скиллам `skills/backend-dev`, `skills/frontend-dev`, `skills/gsd-workflow`).
4. Установить зависимости (`npm install`), инициализировать локальную базу `dev.db` (`DATABASE_URL="file:./dev.db" npx prisma migrate deploy && npx prisma generate`) и убедиться, что `DATABASE_URL="file:./dev.db" npm run build` проходит с 0 ошибок.

---

### Фаза 2: База данных, Backend Ретро, Хабы (`/retro`, `/project/[id]/retro`) и Гостевой доступ (Модель: 🧠 Argon)

**Цель:** Заложить весь серверный фундамент ретро-модуля, модели данных, безопасный polling API и точки входа (хаб ретро, страница ретро проекта и гостевой вход по ссылке доски).

**Шаги:**
1. **Расширение `prisma/schema.prisma` и миграция (`add_retro_module`):**
   - `RetroBoard`: `id`, `title`, `inviteToken (@unique)`, `template`, `phase` (`COLLECT | GROUP | VOTE | DISCUSS | ACTIONS | COMPLETED`), `isAnonymous`, `hideCardsUntilReveal`, `cardsRevealed`, `maxVotesPerUser`, `hideVotesUntilDone`, `timerEndsAt`, `timerDurationSec`, `focusedItemId`, `projectId`, `sprintId?`, `createdById`, `completedAt?`.
   - `RetroColumn`: `id`, `title`, `color` (`emerald | amber | rose | blue | violet | zinc`), `position`, `boardId`.
   - `RetroCardGroup`: `id`, `title`, `position`, `boardId`, `columnId`.
   - `RetroCard`: `id`, `content`, `position`, `boardId`, `columnId`, `groupId?`, `authorId`.
   - `RetroVote`: `id`, `weight`, `userId`, `cardId?`, `groupId?` (`@@unique([userId, cardId])`, `@@unique([userId, groupId])`).
   - `RetroActionItem`: `id`, `title`, `status` (`OPEN | DONE`), `dueDate?`, `boardId`, `projectId`, `assigneeId?`, `ticketId? (@unique)`.
   - `RetroParticipant`: `id`, `boardId`, `userId`, `joinedAt`, `lastSeenAt`, `isTyping` (`@@unique([boardId, userId])`).
2. **Константы и шаблоны (`src/lib/retro.ts`):**
   - 5 классических шаблонов из P0:
     - `WENT_WELL_TO_IMPROVE` (*Went well / To improve / Actions*)
     - `START_STOP_CONTINUE` (*Start / Stop / Continue*)
     - `MAD_SAD_GLAD` (*Mad / Sad / Glad*)
     - `FOUR_LS` (*Liked / Learned / Lacked / Longed for*)
     - `SAILBOAT` (*Wind / Anchor / Rocks / Island*)
     - `CUSTOM` (свои колонки с нуля)
   - Валидаторы фаз, шаблонов, цветов и прав фасилитатора (`canFacilitateRetro`).
3. **Middleware и очистка (`src/proxy.ts` + `src/app/api/cron/cleanup-expired/route.ts`):**
   - Разрешить неавторизованным и гостевым пользователям (`userType === "guest"`) доступ к `/retro/[token]`.
   - Добавить каскадную очистку истёкших гостевых юзеров с учётом участия в ретро.
4. **Server Actions (`src/app/actions/retro.ts`):**
   - Управление доской: `createRetroBoard` (из проекта или из `/retro`), `joinRetroAsGuest(inviteToken, nickname)`, `updateRetroPhase`, `updateRetroSettings` (анонимность, лимит голосов, раскрытие карточек), `controlRetroTimer` (`start` / `pause` / `reset`), `setRetroFocus`.
   - Управление колонками: `addRetroColumn`, `updateRetroColumn` (имя, цвет), `deleteRetroColumn`, `reorderRetroColumns`.
5. **Polling API (`src/app/api/retro/board/route.ts` и `src/app/api/retro/active/route.ts`):**
   - `GET /api/retro/board?token=...&typing=0|1`:
     - Обновляет `RetroParticipant.lastSeenAt` и `isTyping`.
     - Возвращает полное состояние доски, список участников с флагом `isOnline` (`lastSeenAt > now - 12s`) и `isTyping`.
     - **Безопасность на уровне API:** если `isAnonymous = true`, скрывает `authorId`/`authorName` у чужих карточек (оставляя `isOwn: boolean`). Если `phase === "COLLECT" && hideCardsUntilReveal && !cardsRevealed`, заменяет текст чужих карточек на маску той же длины, чтобы никто не увидел контент до раскрытия даже через DevTools. Если `phase === "VOTE" && hideVotesUntilDone`, скрывает чужие голоса на карточках, отдавая только собственные точки пользователя и общий прогресс голосования.
   - `GET /api/retro/active?projectId=...`: проверяет наличие активного (не `COMPLETED`) ретро в проекте для показа уведомления команде.
6. **Страницы хабов ретро (`/retro` и `/project/[id]/retro`):**
   - `/project/[id]/retro`: список всех ретро команды (активные + завершённые read-only), блок сквозных Action Items проекта (с переключением `OPEN / DONE`), форма создания нового ретро (название, выбор шаблона, выбор `Sprint` или «без спринта», переключатели анонимности и лимита голосов).
   - `/retro`: самостоятельный хаб для быстрого старта ретро (выбор существующего проекта/команды или авто-создание рабочего пространства команды в 1 клик) + список последних ретро и назначенных пользователю Action Items.
   - `/retro/[token]/page.tsx`: серверный резолв токена → если пользователь не залогинен, рендерит форму гостевого входа по имени (`retro-guest-join-form.tsx`); если залогинен (или гость уже в сессии) — регистрирует `RetroParticipant` и рендерит доску.
   - Базовые ключи `ru.json` и `en.json` для проверки работы.

---

### Фаза 3: Интерактивная Ретро-доска — Карточки, Группировка, Голосование, Таймер и Action Items (Модель: 🧠 Argon)

**Цель:** Реализовать все интерактивные фичи ретро-доски (P0 из `retro-board-features.md`) и экосистемные мосты со спринтами и тикетами планера.

**Шаги:**
1. **Клиентский хук и каркас доски (`src/hooks/use-retro-polling.ts`, `src/components/retro/retro-board-view.tsx`):**
   - Polling каждые 3 секунды + мгновенные оптимистичные обновления (`useTransition`).
   - **Шапка доски:** название, бейдж привязанного спринта (с кнопкой открытия шторки «Контекст спринта»), аватарки/бейджи онлайн-участников + пульсирующий индикатор «N человек пишут...», кнопка «Поделиться / QR-код» (`/retro/[token]`), настройки доски (для фасилитатора).
   - **Панель фасилитации:** степпер 5 фаз (`Сбор → Группировка → Голосование → Обсуждение → Действия` + кнопка `Завершить ретро`) и синхронный **Таймер фазы** (пресеты 3 / 5 / 10 мин + старт/стоп/сброс и звуковой сигнал через `Web Audio API` по окончании).
2. **Фаза 1 (`COLLECT`) — Сбор карточек и Carry-over прогон:**
   - Сворачиваемый верхний блок **«Проверка прошлых Action Items»** (если в проекте были прошлые ретро): команда отмечает выполненные действия с прошлого раза (`OPEN ↔ DONE`), видит процент выполнения.
   - Колонки с цветовой кодировкой (`emerald`, `amber`, `rose`, `blue`, `violet`, `zinc`), добавление/переименование/удаление колонок фасилитатором.
   - Добавление, редактирование и удаление своих карточек (`addRetroCard`, `updateRetroCard`, `deleteRetroCard`). Отправка флага `typing=1` при наборе текста.
   - Blur-режим чужих карточек + кнопка фасилитатора «Раскрыть все карточки».
3. **Фаза 2 (`GROUP`) — Drag-and-Drop и объединение в группы (`@dnd-kit`):**
   - Перетаскивание карточек между колонками и изменение порядка внутри колонки (`moveRetroCard`).
   - Объединение карточек в группу с общим заголовком (`createRetroGroup`, `addCardToGroup`, `removeCardFromGroup`, `renameRetroGroup`): как перетаскиванием карточки на карточку, так и удобной кнопкой «Объединить с...» (для мобильных браузеров!).
4. **Фаза 3 (`VOTE`) — Dot Voting:**
   - Кнопки `+` / `-` на карточках и группах для распределения своих точек (`castRetroVote`, `removeRetroVote`).
   - Индикатор оставшихся у участника голосов (`Осталось 3 из 5 голосов`) и прогресс голосования по команде.
5. **Фаза 4 (`DISCUSS`) — Обсуждение и Фокус:**
   - Автоматическая сортировка карточек и групп по убыванию голосов.
   - Кнопка фасилитатора **«В фокус»** на карточке/группе: выделяет обсуждаемую тему у всех участников яркой рамкой и плашкой сверху доски, позволяя тут же в 1 клик добавить по ней `Action Item`.
6. **Фаза 5 (`ACTIONS` & `COMPLETED`) — Action Items, Мост в Тикеты и Экспорт:**
   - Панель / колонка новых `RetroActionItem`: название, выбор ответственного из участников команды (`assigneeId`), выбор срока (`dueDate`), смена статуса.
   - **Кнопка «→ В тикет планера» (`convertActionItemToTicket`):** создаёт `Ticket` в проекте (в бэклог или в выбранный `Sprint`), привязывает его к `RetroActionItem.ticketId` и показывает на ретро бейдж созданного тикета.
   - **Виджет «Контекст спринта»:** если к ретро привязан `Sprint`, показывает список задач этого спринта, сумму Story Points и даты.
   - **Глобальный `RetroToast` (`src/components/retro-toast.tsx`):** всплывающее уведомление на страницах проекта (по аналогии с `EstimationToast`), когда фасилитатор запустил активное ретро.
   - **Экспорт (`src/lib/retro-export.ts`):**
     - **Copy Markdown:** копирует структурированный отчёт по ретро (колонки, группы, карточки с голосами, прошлые и новые Action Items) в буфер обмена.
     - **Export CSV:** скачивание `.csv` файла через `papaparse`.

---

### Фаза 4: Редизайн Главной страницы — Landing Page и Dashboard экосистемы (Модель: 🧠 Argon)

**Цель:** Сделать главную страницу (`/`) визуально сильной, современной и продающей всю экосистему (Planning + Poker + Retro), а дашборд авторизованного пользователя — удобным командным центром управления.

**Шаги:**
1. **Переработка публичного лендинга (`src/components/landing-page.tsx`):**
   - **Навбар (`LandingNav`):** быстрые ссылки на оба быстрых инструмента — `Planning Poker` (`/poker`) и `Sprint Retro` (`/retro`), плюс `Sign In` / `Sign Up`.
   - **Новый Hero + Интерактивный Мульти-Превью (`EcosystemLivePreview`):**
     - Обновлённый заголовок и подзаголовок про единое пространство для спринт-планинга, покера и ретроспектив без трекеров и лишней бюрократии.
     - Вместо одиночной маленькой гистограммы — **живой интерактивный шоукейс с 3 переключаемыми вкладками** (и авто-переключением с паузой при наведении):
       1. **⚡ Planning Poker:** живая гистограмма распределения голосов, медиана, рекомендация SP/часов/дней и подсветка выбросов.
       2. **📅 Sprint Gantt:** наглядный мини-таймлайн спринта с дорожками `DEV`, `QA`, `BA`, связанными блоками задач и индикацией отпусков.
       3. **🔄 Sprint Retro (NEW):** живое превью ретро-доски с 3 колонками (*Went well / To improve / Actions*), карточками, dot-голосами, таймером фазы и плашкой *Carry-over Action Item → Sprint Ticket*.
   - **Секция «3 инструмента экосистемы — вместе или по отдельности» (`ThreePillarsSection` вместо старого `DualCta`):**
     - 3 богатые карточки в единой сетке:
       - **Quick Planning Poker** (синий/фиолетовый акцент — оценка за 60 секунд без регистрации, 4 метода).
       - **Sprint Retro Board** (изумрудный/бирюзовый акцент — приватные доски, гостевой вход по ссылке, 5 фаз фасилитации, перенос Action Items).
       - **Sprint Planner & Gantt** (индиго/тёмный акцент — таймлайн спринтов, капасити по ролям DEV/QA/BA, PDF-отчёты).
   - **Секция «Замкнутый цикл улучшения команды» (`ClosedLoopSection`):**
     - Наглядная схема из 4 шагов: *1. Оценили в Poker → 2. Разложили на Ганте → 3. Провели Ретро спринта → 4. Перенесли Action Items в тикеты следующего спринта*.
   - Обновлённый FAQ и финальный Callout с кнопками быстрого старта.
2. **Обновление дашборда авторизованного пользователя (`src/app/page.tsx`) и навигации проекта:**
   - В шапке дашборда — быстрые кнопки `Planning Poker` (`/poker`) и `Retrospectives` (`/retro`).
   - Блок **«Мои открытые Action Items»** на дашборде (если у пользователя или его проектов есть незакрытые действия с прошлых ретро — их видно сразу при входе!).
   - На карточках проектов (`Project Card`): три аккуратные кнопки быстрого перехода в модули проекта — **Gantt / Plan** (`/project/[id]`), **Poker** (`/project/[id]/estimation`), **Retro** (`/project/[id]/retro`) + бейдж количества активных/проведённых ретро и открытых Action Items.
   - Добавление ссылки `Retro` в шапку Ганта (`src/app/project/[id]/project-content.tsx`) и в шапку Estimation (`src/components/estimation/estimation-board.tsx`).

---

### Фаза 5: Мультиязычность (7 языков), документация и финальная проверка (Модель: ⚡ Flash)

**Цель:** Довести переводы на все 7 поддерживаемых языков проекта, оформить документацию эпика и провести финальную валидацию сборки.

**Шаги:**
1. Синхронизировать все новые ключи (`retro`, обновлённый `landing`, `home`, `project`, `common`, `errors`) из `messages/ru.json` и `messages/en.json` в остальные 5 языковых файлов:
   - `messages/pl.json` (Polski)
   - `messages/es.json` (Español)
   - `messages/be.json` (Беларуская)
   - `messages/uk.json` (Українська)
   - `messages/hi.json` (हिन्दी)
2. Проверить парсинг всех 7 JSON-файлов (`for f in messages/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8'))"; done`).
3. Создать документацию фичи `docs/features/epic-12-sprint-retro.md` и добавить запись в `docs/changelog.md` по стандарту репозитория.
4. Запустить финальные проверки:
   - `DATABASE_URL="file:./dev.db" npm run build` (0 ошибок компиляции и типизации)
   - `npm run lint` (отсутствие новых ошибок линтера).
