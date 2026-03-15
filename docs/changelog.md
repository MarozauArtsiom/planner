# Changelog

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
