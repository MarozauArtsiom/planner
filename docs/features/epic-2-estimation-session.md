# Эпик 2: Сессия оценки (Estimation Session)

## Бизнес-цель

Обеспечить совместную оценку задач командой через голосование по 4 критериям (Dev Effort, QA Effort, Risk, Uncertainty) с автоматическим расчётом Story Points и пропорции Dev/QA. Scrum Master управляет процессом: выбирает тикет, раскрывает результаты, принимает оценку. Участники голосуют с мобильных устройств, изменения отображаются в реальном времени через HTTP polling.

## Что реализовано

### Story 2.1: Управление активным тикетом
- SM создаёт тикеты (ID, название, описание, AC, ссылка на трекер) через боковую панель.
- SM выбирает тикет для оценки — он мгновенно отображается на экранах всей команды.
- Кликабельная ссылка на внешний трекер (если задан `externalUrl`), название и Acceptance Criteria.
- Polling с интервалом 2 секунды обеспечивает автоматическое обновление экранов Dev/QA.

### Story 2.2: Голосование по 4 критериям
- Mobile-first интерфейс опросника с крупными тач-кнопками.
- 4 критерия с цветовой кодировкой:
  - **Dev Effort** (indigo): 1, 2, 4, 6
  - **QA Effort** (emerald): 1, 2, 4
  - **Risk** (amber): 0, 1, 2
  - **Uncertainty** (violet): 0, 1, 2
- После отправки голоса UI показывает статус «Ожидание команды» с прогресс-баром.
- SM видит прогресс голосования (X / Y проголосовали) и может раскрыть результаты.

### Story 2.3: Калькуляция результатов
- Усреднение баллов по каждому критерию среди всех проголосовавших.
- Конвертация суммы средних в SP: 2-3 = 1 SP, 4-5 = 2 SP, 6-8 = 3 SP, 9+ = 5 SP.
- Расчёт пропорции Dev/QA (avgDevEffort / (avgDevEffort + avgQaEffort)).
- Визуализация: SP-бейдж, горизонтальная шкала пропорции, прогресс-бары по критериям.
- SM может принять оценку (сохраняет SP и пропорцию в тикет) или переголосовать.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | Модели EstimationSession, Vote, Ticket (devEffortProportion) |
| `src/lib/estimation-engine.ts` | Расчёт средних, SP, пропорции Dev/QA |
| `src/app/actions/estimation.ts` | Server actions: createTicket, setActiveTicket, submitVote, revealVotes, acceptEstimation, restartVoting, deleteTicket |
| `src/app/api/estimation/session/route.ts` | GET-эндпоинт для polling (состояние сессии, активный тикет, голоса, результаты) |
| `src/hooks/use-estimation-polling.ts` | Клиентский хук для polling с интервалом 2 сек |
| `src/app/project/[id]/estimation/page.tsx` | Server-компонент страницы оценки (project-scoped) |
| `src/components/estimation/estimation-board.tsx` | Главный клиентский компонент (layout, sidebar, состояния) |
| `src/components/estimation/voting-form.tsx` | Mobile-first форма голосования по 4 критериям |
| `src/components/estimation/voting-results.tsx` | Отображение результатов (SP, пропорция, средние) |
| `src/components/estimation/ticket-form.tsx` | Форма создания тикета (SM) |

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Реализовано управление тикетами и активным тикетом для SM |
| 2026-03-14 | feat | Mobile-first голосование по 4 критериям (Dev Effort, QA Effort, Risk, Uncertainty) |
| 2026-03-14 | feat | Калькуляция SP, пропорции Dev/QA, отображение результатов |
| 2026-03-14 | feat | HTTP polling (2 сек) для real-time обновления экранов |
| 2026-03-14 | feat | SM workflow: раскрытие результатов, принятие/переголосование |
| 2026-03-14 | refactor | Estimation перенесена под /project/[id]/estimation, все данные привязаны к projectId |
| 2026-03-14 | feat | Визуальная индикация оценённых тикетов в списке: зелёный фон, чекмарк, SP-бейдж; кнопка «Переоценить» вместо «Оценить» |
