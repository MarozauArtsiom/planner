# Changelog

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
