# Инфраструктура: Деплой на Vercel + Turso

## Бизнес-цель
Обеспечить бесплатный продакшен-деплой приложения с доступом через интернет для всей команды.

## Что реализовано
- Приложение развёрнуто на Vercel (Hobby free tier): https://planner-gamma-pied.vercel.app
- БД размещена на Turso (Starter free tier) — libSQL, SQLite-совместимая serverless БД.
- Локальная разработка по-прежнему использует SQLite файл (`dev.db`).
- Переключение адаптера по env var `TURSO_DATABASE_URL` в `src/lib/db.ts`.
- Деплой выполняется локальной командой `NODE_TLS_REJECT_UNAUTHORIZED=0 vercel --prod --yes`.
- Схема на Turso накатывается через `turso db shell sprint-planner < schema.sql`.

## Ключевые файлы
| Файл | Назначение |
|---|---|
| `src/lib/db.ts` | Условный выбор Prisma-адаптера (Turso / better-sqlite3) |
| `package.json` | Build-скрипт с `prisma generate`, postinstall hook |
| `prisma/schema.prisma` | Prisma-схема (provider: sqlite) |
| `prisma.config.ts` | Конфигурация Prisma CLI (datasource URL) |

## Лимиты free tier
| Сервис | Лимит |
|--------|-------|
| Vercel Hobby | 100 GB bandwidth, 100K function invocations/day |
| Turso Starter | 9 GB storage, 500 databases |
| Vercel Serverless | 10s execution limit |

## История изменений
| Дата | Тип | Описание |
|---|-----|----|
| 2026-03-15 | feat | Первый деплой: Vercel + Turso, условный адаптер в db.ts |
