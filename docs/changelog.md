# Changelog

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
