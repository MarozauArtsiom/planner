# Эпик 0: Авторизация, Проекты и Invite-ссылки

## Бизнес-цель

Обеспечить идентификацию пользователей через login/password, объединить данные (спринты, тикеты, оценки) в проекты, позволить SM приглашать команду через reusable invite-ссылки.

## Что реализовано

### Авторизация
- Регистрация `/register` — имя, логин, пароль, выбор роли (DEV/QA/SCRUM_MASTER).
- Вход `/login` — логин + пароль. Пароли хранятся как bcrypt-хеш.
- Сессия — httpOnly cookie `userId`, 1 год.
- Logout — кнопка на всех страницах, очищает cookie.
- Поддержка `?redirect=` query param для возврата после логина (например, из invite-ссылки).

### Проекты
- Модель `Project` с owner (SM) и `inviteToken`.
- Модель `ProjectMember` — связь User и Project.
- SM создаёт проект на главной странице `/`. Автоматически становится участником.
- Все данные (Sprint, Ticket, EstimationSession) привязаны к проекту через `projectId`.
- Главная страница показывает список проектов текущего пользователя.

### Invite-ссылки
- `inviteToken` хранится на модели `Project`, генерируется при создании.
- Формат: `/invite/{token}`.
- Незалогиненный пользователь → redirect на `/login?redirect=/invite/{token}`.
- Залогиненный, не участник → страница "Присоединиться к {project.name}?".
- Залогиненный, уже участник → redirect на `/project/{id}`.
- SM может перегенерировать токен в настройках проекта `/project/{id}/settings`.

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | User (login, passwordHash), Project, ProjectMember |
| `src/lib/password.ts` | bcrypt hash/verify обёртки |
| `src/app/actions/auth.ts` | register, login, logout server actions |
| `src/app/actions/project.ts` | createProject, joinProject, regenerateInviteToken |
| `src/app/login/page.tsx` | Страница входа |
| `src/app/register/page.tsx` | Страница регистрации |
| `src/app/page.tsx` | Список проектов |
| `src/app/project/[id]/page.tsx` | Board проекта |
| `src/app/project/[id]/settings/page.tsx` | Настройки проекта (invite-ссылка) |
| `src/app/invite/[token]/page.tsx` | Присоединение по invite |
| `src/app/api/project/[id]/invite/route.ts` | API для получения invite URL |
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
