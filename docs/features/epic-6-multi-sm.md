# Эпик 6: Несколько Скрам-мастеров в проекте

## Бизнес-цель

Позволить нескольким участникам проекта иметь права Скрам Мастера. SM-права существуют только на уровне проекта (per-project). Создатель проекта автоматически становится owner и SM. Дополнительные SM назначаются через per-project toggle или invite-ссылки с флагом `grantsSm`.

## Что реализовано

### SM только per-project
- Глобальной SM-роли нет. Любой пользователь может создавать проекты.
- `ProjectMember.isScrumMaster: Boolean` — per-project SM-флаг.
- SM-права = `project.ownerId === userId || membership.isScrumMaster`.
- Чистый SM (role=null, isScrumMaster=true) — не виден на Ганте, не голосует, всегда в SM-режиме.
- DEV/QA/BA + SM — виден на Ганте, голосует, имеет расширенный UI управления.

### Per-project SM-права
- Поле `isScrumMaster: Boolean` на модели `ProjectMember` — per-project флаг.
- Owner проекта автоматически получает `isScrumMaster: true` при создании.
- Страница настроек проекта: секция «Участники» — toggle SM-прав для каждого, бейдж «Owner» для владельца.

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
| `prisma/schema.prisma` | `ProjectMember.isScrumMaster` |
| `src/lib/permissions.ts` | `hasSmRights(userId, membership, project)` |
| `src/app/actions/project.ts` | `createProject`, `toggleMemberSm` |
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
| 2026-03-15 | refactor | Глобальный `isScrumMaster` только для создания проектов. SM-права в проекте = owner или `ProjectMember.isScrumMaster` |
| 2026-03-15 | feat | Защита владельца: SM-статус owner нельзя отозвать, бейдж «Owner» в настройках |
| 2026-03-15 | refactor | Удалён `User.isScrumMaster`. SM-права только per-project. Любой пользователь создаёт проекты |
