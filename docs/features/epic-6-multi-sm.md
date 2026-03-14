# Эпик 6: Несколько Скрам-мастеров в проекте

## Бизнес-цель

Позволить нескольким участникам проекта иметь права Скрам Мастера. SM — не отдельная роль, а дополнительный флаг: при регистрации пользователь выбирает командную роль (DEV/QA) и опционально отмечает «Scrum Master». Все участники видны на Ганте, все голосуют, а SM-права дают возможность управлять доской и сессиями оценки.

## Что реализовано

### SM как флаг, а не роль
- `User.role` = `"DEV" | "QA" | null` — командная роль (опциональна).
- `User.isScrumMaster: Boolean` — глобальный SM-флаг (создание проектов, глобальные права).
- `ProjectMember.isScrumMaster: Boolean` — per-project SM-флаг.
- SM-права = `user.isScrumMaster || membership.isScrumMaster`.
- Чистый SM (role=null, isScrumMaster=true) — не виден на Ганте, не голосует, всегда в SM-режиме.
- DEV/QA + SM — виден на Ганте, голосует, переключатель «Команда / SM».

### Регистрация и настройки
- Регистрация: 2 карточки DEV/QA (опциональные, можно не выбирать) + чекбокс «Scrum Master». Нужно выбрать хотя бы что-то.
- Настройки профиля: dropdown DEV/QA/«Не выбрана» + чекбокс SM.
- `SCRUM_MASTER` удалён из `VALID_ROLES`.

### Per-project SM-права
- Поле `isScrumMaster: Boolean` на модели `ProjectMember` — per-project флаг.
- Owner проекта автоматически получает `isScrumMaster: true` при создании.
- Страница настроек проекта: секция «Участники» — toggle SM-прав для каждого, бейдж «SM» для глобальных SM.

### Переключатель режима
- Пользователь с SM-правами видит переключатель «Команда / Скрам Мастер» в шапке.
- Режим «Команда»: read-only Гант, только голосование на эстимации.
- Режим «Скрам Мастер»: drag/resize на Ганте, управление сессией + голосование одновременно.
- Состояние переключателя хранится в `localStorage` per project.

### Голосование
- Все пользователи (DEV/QA) могут голосовать — ограничение `canVote` по роли SM удалено.
- В SM-режиме пользователь может и голосовать, и управлять сессией.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | `User.isScrumMaster`, `ProjectMember.isScrumMaster` |
| `src/lib/permissions.ts` | `hasSmRights(user, membership)` |
| `src/app/actions/auth.ts` | `register` — role (DEV/QA) + isScrumMaster |
| `src/app/actions/user.ts` | `updateUserProfile` — role + isScrumMaster |
| `src/app/actions/project.ts` | `createProject` (user.isScrumMaster), `toggleMemberSm` |
| `src/app/register/page.tsx` | UI: 2 карточки + чекбокс SM |
| `src/app/settings/page.tsx` | UI: dropdown + чекбокс SM |
| `src/components/sm-mode-toggle.tsx` | `SmModeToggle` + `useSmMode` hook |
| `src/app/project/[id]/project-content.tsx` | Client wrapper с toggle |
| `src/components/estimation/estimation-board.tsx` | Estimation с toggle |
| `src/app/project/[id]/settings/page.tsx` | Настройки — управление SM-правами |
| `src/app/api/project/[id]/members/route.ts` | API списка участников |

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Per-project SM-права через `ProjectMember.isScrumMaster` |
| 2026-03-14 | feat | Переключатель режима «Команда / Скрам Мастер» |
| 2026-03-14 | feat | Секция управления SM-правами в настройках проекта |
| 2026-03-14 | refactor | SM как флаг (`User.isScrumMaster`), а не роль — `SCRUM_MASTER` удалён из `User.role` |
| 2026-03-14 | refactor | Регистрация: 2 карточки DEV/QA + чекбокс SM |
| 2026-03-14 | refactor | Все пользователи с командной ролью голосуют — ограничение canVote по SM-роли удалено |
| 2026-03-14 | refactor | `User.role` стал nullable — чистый SM (role=null) без Ганта и голосования |
