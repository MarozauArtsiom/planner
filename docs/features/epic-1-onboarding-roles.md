# Эпик 1: Онбординг и Роли (Roles & Onboarding)

## Бизнес-цель

Обеспечить идентификацию участников команды при регистрации через выбор командной роли (Developer или QA) и опционального флага Scrum Master. SM-права дают возможность создавать проекты и управлять доской планирования.

## Что реализовано

### Story 1.1: Регистрация
- Страница `/register` с вводом имени, пароля и чекбоксом «Scrum Master» (опционально, даёт право создавать проекты).
- Командная роль (DEV/QA) больше не выбирается при регистрации — она выбирается при присоединении к проекту.
- `User.isScrumMaster: Boolean` — глобальный SM-флаг (право создавать проекты).
- Сессия на основе httpOnly cookie (`userId`), срок жизни — 1 год.

### Story 1.2: Per-project роли
- `ProjectMember.role` = `"DEV" | "QA" | null` — командная роль привязана к участию в проекте.
- Роль выбирается при присоединении через invite-ссылку.
- SM может менять роль участника в настройках проекта (сегментированные кнопки DEV/QA/—).
- Участники с ролью DEV/QA видны на Ганте и голосуют. Без роли (null) — нет.

### Story 1.3: Разделение прав доступа
- Proxy (`src/proxy.ts`) перенаправляет неавторизованных пользователей на `/login`.
- Хелпер `hasSmRights(user, membership)` в `src/lib/permissions.ts` — проверяет `user.isScrumMaster || membership.isScrumMaster`.
- SM-права = глобальный флаг `User.isScrumMaster` ИЛИ per-project `ProjectMember.isScrumMaster`.
- Страница настроек `/settings` — чекбокс SM (роли убраны, т.к. они per-project).

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | User: `isScrumMaster`, ProjectMember: `role` + `isScrumMaster`, InviteLink |
| `src/proxy.ts` | Auth guard — редирект на `/login` без cookie |
| `src/lib/permissions.ts` | `hasSmRights(user, membership)` |
| `src/lib/current-user.ts` | Загрузка текущего пользователя из БД по сессии |
| `src/lib/session.ts` | Управление cookie-сессией |
| `src/app/register/page.tsx` | UI регистрации — имя + пароль + чекбокс SM |
| `src/app/actions/auth.ts` | Server actions: `register`, `login`, `logout` |
| `src/app/actions/user.ts` | Server action: `updateUserProfile` (isScrumMaster) |
| `src/app/page.tsx` | Главная страница |
| `src/app/settings/page.tsx` | Настройки профиля — чекбокс SM |

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
