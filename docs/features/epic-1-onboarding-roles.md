# Эпик 1: Онбординг и Роли (Roles & Onboarding)

## Бизнес-цель

Обеспечить идентификацию участников команды при регистрации через выбор командной роли (Developer или QA) и опционального флага Scrum Master. SM-права дают возможность создавать проекты и управлять доской планирования.

## Что реализовано

### Story 1.1: Выбор роли при регистрации
- Страница `/register` с вводом имени, пароля, выбором командной роли (DEV/QA, опционально) и чекбоксом «Scrum Master» (опционально). Нужно выбрать хотя бы что-то.
- `User.role` = `"DEV" | "QA" | null` — командная роль (nullable).
- `User.isScrumMaster: Boolean` — глобальный SM-флаг.
- Чистый SM (role=null, isScrumMaster=true) — не виден на Ганте, не голосует, всегда в SM-режиме.
- DEV/QA + SM — виден на Ганте, голосует, переключатель «Команда / SM».
- Сессия на основе httpOnly cookie (`userId`), срок жизни — 1 год.

### Story 1.2: Разделение прав доступа
- Proxy (`src/proxy.ts`) перенаправляет неавторизованных пользователей на `/login`.
- Хелпер `hasSmRights(user, membership)` в `src/lib/permissions.ts` — проверяет `user.isScrumMaster || membership.isScrumMaster`.
- SM-права = глобальный флаг `User.isScrumMaster` ИЛИ per-project `ProjectMember.isScrumMaster`.
- Пользователи с командной ролью (DEV/QA) видны на Ганте и голосуют. Чистый SM — нет.
- Страница настроек `/settings` — dropdown DEV/QA/«Не выбрана» + чекбокс SM.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | Модель User: `role` ("DEV"/"QA"/null) + `isScrumMaster` (Boolean) |
| `src/proxy.ts` | Auth guard — редирект на `/login` без cookie |
| `src/lib/permissions.ts` | `hasSmRights(user, membership)` |
| `src/lib/current-user.ts` | Загрузка текущего пользователя из БД по сессии |
| `src/lib/session.ts` | Управление cookie-сессией |
| `src/app/register/page.tsx` | UI регистрации — имя + роль DEV/QA + чекбокс SM |
| `src/app/actions/auth.ts` | Server actions: `register`, `login`, `logout` |
| `src/app/actions/user.ts` | Server action: `updateUserProfile` (role + isScrumMaster) |
| `src/app/page.tsx` | Главная страница с role-aware UI |
| `src/app/settings/page.tsx` | Настройки профиля — смена роли и SM-флага |

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Реализован онбординг с выбором роли DEV/QA |
| 2026-03-14 | feat | Proxy для авторизации |
| 2026-03-14 | feat | Role-aware UI на главной и настройках |
| 2026-03-14 | refactor | SM как флаг (`User.isScrumMaster`), а не роль — регистрация: DEV/QA + чекбокс SM |
| 2026-03-14 | feat | Per-project SM-права, переключатель режима «Команда / Скрам Мастер» |
| 2026-03-14 | refactor | `User.role` стал nullable — чистый SM (role=null) без командной роли |
