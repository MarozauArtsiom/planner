# Эпик 1: Онбординг и Роли (Roles & Onboarding)

## Бизнес-цель

Обеспечить идентификацию участников команды при первом входе через выбор роли (Developer, QA или Scrum Master) и разделение прав доступа: SM — единственный редактор доски планирования, остальные наблюдают в реальном времени.

## Что реализовано

### Story 1.1: Выбор роли при старте
- Страница `/onboarding` с вводом имени и выбором одной из трёх ролей: Developer, QA Engineer, Scrum Master.
- Роль SM выбирается пользователем при онбординге наравне с DEV/QA.
- Сессия на основе httpOnly cookie (`userId`), срок жизни — 1 год.

### Story 1.2: Разделение прав доступа
- Proxy (`src/proxy.ts`) перенаправляет неавторизованных пользователей на `/onboarding`.
- Утилиты `isScrumMaster()` и `canEditBoard()` в `src/lib/permissions.ts` для централизованной проверки прав по `user.role`.
- Главная страница `/` показывает роль пользователя и адаптирует плейсхолдер Ганта (редактирование для SM vs. просмотр для DEV/QA).
- Страница настроек `/settings` позволяет сменить роль на любую из трёх.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | Модель User с полем `role` ("DEV" / "QA" / "SCRUM_MASTER") |
| `src/proxy.ts` | Auth guard (Next.js 16 proxy) — редирект на `/onboarding` без cookie |
| `src/lib/permissions.ts` | Утилиты проверки прав: `isScrumMaster()`, `canEditBoard()` |
| `src/lib/current-user.ts` | Загрузка текущего пользователя из БД по сессии |
| `src/lib/session.ts` | Управление cookie-сессией |
| `src/app/onboarding/page.tsx` | UI онбординга — имя + выбор DEV/QA/SM |
| `src/app/actions/user.ts` | Server actions: `createUser`, `updateUserRole` |
| `src/app/page.tsx` | Главная страница с role-aware UI |
| `src/app/settings/page.tsx` | Настройки профиля — смена роли |

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Реализован онбординг с выбором роли DEV/QA |
| 2026-03-14 | feat | Proxy для авторизации |
| 2026-03-14 | feat | Role-aware UI на главной и настройках |
| 2026-03-14 | refactor | SM стал полноценной ролью (DEV/QA/SCRUM_MASTER), удалён флаг `isScrumMaster` и админ-панель |
