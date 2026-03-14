# Эпик 0: Авторизация, Проекты и Invite-ссылки

## Бизнес-цель

Обеспечить идентификацию пользователей через login/password, объединить данные (спринты, тикеты, оценки) в проекты, позволить SM приглашать команду через reusable invite-ссылки.

## Что реализовано

### Авторизация
- Регистрация `/register` — имя, пароль + чекбокс «Scrum Master» (опционально, даёт право создавать проекты). Роль (DEV/QA) выбирается при присоединении к проекту.
- Вход `/login` — логин + пароль. Пароли хранятся как bcrypt-хеш.
- Сессия — httpOnly cookie `userId`, 1 год.
- Logout — кнопка на всех страницах, очищает cookie.
- Поддержка `?redirect=` query param для возврата после логина (например, из invite-ссылки).

### Проекты
- Модель `Project` с owner (SM).
- Модель `ProjectMember` — связь User и Project с per-project `role` (DEV/QA/null) и `isScrumMaster`.
- Пользователь с `isScrumMaster = true` создаёт проект на главной странице `/`. Автоматически становится участником с per-project SM-правами.
- Все данные (Sprint, Ticket, EstimationSession) привязаны к проекту через `projectId`.
- Главная страница показывает список проектов текущего пользователя.

### Invite-ссылки
- Модель `InviteLink` — множественные invite-ссылки на проект. Каждая ссылка имеет уникальный `token` и флаг `grantsSm` (даёт ли SM-права при присоединении).
- Формат: `/invite/{token}`.
- При присоединении пользователь выбирает свою роль в проекте (DEV/QA/без роли). SM-права назначаются автоматически на основе `grantsSm`.
- Незалогиненный пользователь → redirect на `/login?redirect=/invite/{token}`.
- Залогиненный, уже участник → redirect на `/project/{id}`.
- SM может создавать и удалять invite-ссылки в настройках проекта `/project/{id}/settings`.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | User (login, passwordHash), Project, ProjectMember |
| `src/lib/password.ts` | bcrypt hash/verify обёртки |
| `src/app/actions/auth.ts` | register, login, logout server actions |
| `src/app/actions/project.ts` | createProject, joinProject, createInviteLink, deleteInviteLink, toggleMemberSm, updateMemberRole |
| `src/app/login/page.tsx` | Страница входа |
| `src/app/register/page.tsx` | Страница регистрации |
| `src/app/page.tsx` | Список проектов |
| `src/app/project/[id]/page.tsx` | Board проекта |
| `src/app/project/[id]/settings/page.tsx` | Настройки проекта (invite-ссылки, роли, SM-права) |
| `src/app/api/project/[id]/members/route.ts` | API списка участников проекта |
| `src/app/invite/[token]/page.tsx` | Присоединение по invite с выбором роли |
| `src/app/invite/[token]/invite-form.tsx` | Клиентская форма выбора роли при присоединении |
| `src/app/api/project/[id]/invite/route.ts` | API списка invite-ссылок проекта |
| `src/proxy.ts` | Auth guard — redirect на /login |

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Авторизация login/password с bcrypt |
| 2026-03-14 | feat | Модели Project и ProjectMember |
| 2026-03-14 | feat | Invite-ссылки с поддержкой redirect после логина |
| 2026-03-14 | feat | Главная страница — список проектов |
| 2026-03-14 | refactor | Estimation перенесена под /project/[id]/estimation с projectId |
| 2026-03-14 | refactor | Удалён /onboarding, заменён на /register + /login |
| 2026-03-14 | feat | Секция управления SM-правами участников в настройках проекта |
| 2026-03-14 | refactor | Invite API и regenerateToken проверяют SM-права вместо ownerId |
| 2026-03-15 | refactor | Per-project роли: `ProjectMember.role` вместо `User.role` |
| 2026-03-15 | feat | Множественные invite-ссылки: модель `InviteLink` с `grantsSm` вместо `Project.inviteToken` |
| 2026-03-15 | feat | Выбор роли (DEV/QA) при присоединении к проекту |
| 2026-03-15 | feat | SM может менять роль участника и SM-права в настройках проекта |
