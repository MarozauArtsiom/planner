# Интернационализация (i18n)

## Бизнес-цель
Мультиязычная поддержка приложения. Все пользовательские лейблы вынесены в отдельные файлы переводов, язык определяется автоматически по браузеру и может быть изменён пользователем в настройках.

## Что реализовано
- Интеграция `next-intl` как i18n-библиотеки для Next.js App Router
- 7 языков: English (дефолт), Русский, Polski, Español, Беларуская, Українська, हिन्दी
- ~200 ключей переводов в каждом файле с namespace-структурой
- Автоопределение языка по заголовку `Accept-Language` браузера при первом визите
- Fallback на английский, если язык браузера не поддерживается
- Cookie-based выбор локали (`NEXT_LOCALE` cookie, срок жизни 1 год)
- `NextIntlClientProvider` в root layout — переводы доступны во всех компонентах
- Языковой дропдаун на странице настроек профиля (`/settings`) с 7 языками (текстом, без флагов)
- Компонент `UserMenu` — выпадающее меню (Настройки + Выйти) возле имени пользователя
- Все UI-страницы и компоненты переведены на `useTranslations()` (client) / `getTranslations()` (server)
- Все error messages в server actions используют `getTranslations("errors")`
- Cursor rule `.cursor/rules/i18n.mdc` — автоматическое соблюдение i18n при добавлении новых фич

## Автоопределение языка

Приоритет выбора локали:
1. Cookie `NEXT_LOCALE` (если пользователь уже выбрал язык)
2. Заголовок `Accept-Language` из браузера (парсинг с приоритетами `q=`)
3. Fallback: English (`en`)

## Ключевые файлы
| Файл | Назначение |
|---|---|
| `messages/en.json` | Английские переводы (дефолт) |
| `messages/ru.json` | Русские переводы |
| `messages/pl.json` | Польские переводы |
| `messages/es.json` | Испанские переводы |
| `messages/be.json` | Белорусские переводы |
| `messages/uk.json` | Украинские переводы |
| `messages/hi.json` | Переводы на хинди |
| `src/i18n/request.ts` | Конфигурация next-intl (cookie → Accept-Language → fallback) |
| `src/app/layout.tsx` | NextIntlClientProvider обёртка |
| `src/components/user-menu.tsx` | Выпадающее меню пользователя |
| `src/app/actions/locale.ts` | Server action для смены языка |
| `next.config.ts` | Подключение next-intl plugin |
| `.cursor/rules/i18n.mdc` | Cursor rule для автоматического учёта i18n |

## Добавление нового языка

1. Создать `messages/<code>.json` — скопировать структуру из `en.json`, перевести все ключи
2. Добавить `case "<code>"` в `loadMessages()` в `src/i18n/request.ts`
3. Добавить код в `SUPPORTED_LOCALES` в `src/i18n/request.ts`
4. Добавить `{ code: "<code>", label: "<Название>" }` в `AVAILABLE_LOCALES` в `src/app/settings/page.tsx`
5. Обновить `.cursor/rules/i18n.mdc` — добавить язык в список

## История изменений
| Дата | Тип | Описание |
|---|-----|-----|
| 2026-03-15 | feat | Полная интеграция i18n: next-intl, переводы, UserMenu, языковой дропдаун |
| 2026-03-15 | feat | 6 новых языков, автоопределение по Accept-Language, fallback на English, cursor rule |
