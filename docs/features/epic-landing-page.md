# Landing Page

## Бизнес-цель
Дать новым пользователям представление о продукте до регистрации. Ранее неавторизованные пользователи сразу перенаправлялись на `/login` без контекста — голая форма без объяснения ценности. Лендинг «продаёт» приложение: объясняет основные возможности (оценка, Гант, синхронизация команды) и ведёт к регистрации.

## Что реализовано
- Условный рендеринг на `/`: неавторизованные — лендинг, авторизованные — дашборд проектов
- Hero-секция с заголовком, подзаголовком и двумя CTA (Get started / Sign in)
- Секция Features: 3 карточки (Collaborative Estimation, Visual Gantt Chart, Team Sync)
- Секция How It Works: 3 шага (Create project → Invite team → Estimate and plan)
- CTA-баннер с gradient-фоном
- Sticky navbar с логотипом и кнопками авторизации
- Footer
- Staggered fade-in анимации на hero-секции
- Декоративный gradient glow на фоне hero
- Полная i18n поддержка (namespace `landing`, 7 языков)
- Адаптивная вёрстка (mobile-first)

## Ключевые файлы
| Файл | Назначение |
|---|---|
| `src/components/landing-page.tsx` | Client-компонент лендинга (Nav, Hero, Features, Steps, CTA, Footer) |
| `src/app/page.tsx` | Условный рендеринг: LandingPage для гостей, дашборд для авторизованных |
| `src/app/globals.css` | CSS-анимации (landingFadeIn) и hero glow gradient |
| `messages/*.json` | Namespace `landing` с 22 ключами на 7 языках |

## История изменений
| Дата | Тип | Описание |
|---|-----|----|
| 2026-03-15 | feat | Реализована landing page с hero, features, steps, CTA секциями |
