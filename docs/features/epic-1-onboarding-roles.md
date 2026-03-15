# Эпик 1: Онбординг и Роли (Roles & Onboarding)

## Бизнес-цель

Обеспечить идентификацию участников команды при регистрации. Любой зарегистрированный пользователь может создавать проекты и автоматически становится владельцем и Scrum Master. Командная роль (DEV/QA/BA) выбирается при присоединении к проекту.

## Что реализовано

### Story 1.1: Регистрация
- Страница `/register` с вводом имени и пароля.
- Командная роль (DEV/QA/BA) выбирается при присоединении к проекту, а не при регистрации.
- Любой зарегистрированный пользователь может создавать проекты.
- Сессия на основе httpOnly cookie (`userId`), срок жизни — 1 год.

### Story 1.2: Per-project роли
- `ProjectMember.role` = `"DEV" | "QA" | "BA" | null` — командная роль привязана к участию в проекте.
- Роль выбирается при присоединении через invite-ссылку (3 карточки: DEV, QA, BA).
- SM может менять роль участника в настройках проекта (сегментированные кнопки DEV/QA/BA/—).
- Участники с ролью DEV/QA/BA видны на Ганте и голосуют. Без роли (null) — нет.
- BA — отдельная третья секция на Ганте (после QA). При назначении тикета на BA создаётся только BA-блок (без авто-привязки к DEV/QA).

### Story 1.3: Разделение прав доступа
- Proxy (`src/proxy.ts`) перенаправляет неавторизованных пользователей на `/login`.
- Хелпер `hasSmRights(userId, membership, project)` в `src/lib/permissions.ts` — проверяет `project.ownerId === userId || membership.isScrumMaster`.
- SM-права в проекте = владелец проекта (owner, неизменяемый) ИЛИ per-project `ProjectMember.isScrumMaster`.
- Глобальной SM-роли нет — SM-права существуют только на уровне проекта.
- Страница настроек `/settings` — выбор языка интерфейса.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | User, ProjectMember: `role` + `isScrumMaster`, InviteLink |
| `src/proxy.ts` | Auth guard — редирект на `/login` без cookie |
| `src/lib/permissions.ts` | `hasSmRights(userId, membership, project)` |
| `src/lib/current-user.ts` | Загрузка текущего пользователя из БД по сессии |
| `src/lib/session.ts` | Управление cookie-сессией |
| `src/app/register/page.tsx` | UI регистрации — имя + пароль |
| `src/app/actions/auth.ts` | Server actions: `register`, `login`, `logout` |
| `src/app/page.tsx` | Главная страница |
| `src/app/settings/page.tsx` | Настройки профиля — выбор языка |

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Реализован онбординг с выбором роли DEV/QA |
| 2026-03-14 | feat | Proxy для авторизации |
| 2026-03-14 | feat | Role-aware UI на главной и настройках |
| 2026-03-14 | refactor | SM как флаг (`User.isScrumMaster`), а не роль — регистрация: DEV/QA + чекбокс SM |
| 2026-03-14 | feat | Per-project SM-права, переключатель режима «Команда / Скрам Мастер» |
| 2026-03-14 | refactor | `User.role` стал nullable — чистый SM (role=null) без командной роли |
| 2026-03-15 | refactor | Per-project роли: `ProjectMember.role` вместо `User.role`. Регистрация упрощена — только имя + пароль + SM чекбокс |
| 2026-03-15 | feat | Роль BA (Business Analyst) — третья командная роль наряду с DEV и QA |
| 2026-03-15 | refactor | Глобальный SM только для создания проектов. SM-права в проекте = owner или ProjectMember.isScrumMaster |
| 2026-03-15 | refactor | Удалён глобальный `User.isScrumMaster`. Любой пользователь создаёт проекты. SM-права только per-project |
