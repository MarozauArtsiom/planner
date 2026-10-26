---
title: Тренды рынка ретро-инструментов и продуктовые гипотезы для sprint-retro
kind: analysis-notes
saved_at: 2026-10-19
collected_by: Claude, роль — product owner sprint-retro; выводы основаны на трёх соседних raw-снимках от 2026-10-19
---

# Тренды рынка и гипотезы для sprint-retro

Это аналитическая выжимка исследователя, а не первоисточник: факты взяты из raw-снимков `2026-10-19--easyretro-deep-dive`, `2026-10-19--dedicated-retro-tools-landscape`, `2026-10-19--whiteboards-and-atlassian-retro-apps`, `2026-10-19--russian-market-retro-tools`. Гипотезы помечены как гипотезы и требуют валидации (интервью, конкурентные тесты).

## Наблюдаемые тренды
1. **Из «доски» в «платформу командных ритуалов».** Лидеры (TeamRetro, Parabol, GoRetro, Kollabe, Retrius) объединяют ретро + planning poker + стендапы + health checks. EasyRetro остаётся retro-only.
2. **Health checks и долгосрочная динамика** — главный дифференциатор «outcome-ориентированных» продуктов (TeamRetro, Echometer, Neatro radar, Retrium Team Radar, Parabol Team Health, Retrius «пульс»). ROTI встречается у Echometer, TeamRetro, QRetro.
3. **AI становится базовым ожиданием:** саммари (EasyRetro, Parabol, TeamRetro, Kollabe, Reetro, LetRetro), AI-группировка карточек (TeamRetro, Parabol, Kollabe, Reetro, LetRetro, FigJam; у EasyRetro нет), предложения action items, sentiment/темы, AI-генерация шаблонов, AI-icebreakers. Часто AI — на платном плане.
4. **MCP/API для AI-агентов** — новый слой: TeamRetro (MCP на уровне команды и аккаунта), LetRetro (официальный MCP-сервер), QRetro, ScatterSpoke, Spreo, FigJam.
5. **Модели цены расходятся:** за команду/комнату (TeamRetro, Retrium, Neatro, GoRetro, Echometer, Retrius), за активного пользователя (Parabol, Miro, Spreo), flat за план с лимитом досок (EasyRetro, Kollabe, LetRetro). Per-user критикуется за рост стоимости с численностью.
6. **Бесплатные планы сжимаются:** trial-only у TeamRetro, Retrium, Spreo (убрал free в 2024); free с жёсткими лимитами у EasyRetro (1–2 публичные доски/мес), Echometer (1 ретро/мес), TeleRetro (3 ретро), Kollabe (история 7 дней), Neatro/Parabol (история 30 дней).
7. **Enterprise-гигиена:** SAML SSO, SCIM, SOC 2, выбор региона хостинга (US/EU), on-prem (Parabol Enterprise, Retrospected). В РФ аналогично: серверы в РФ, реестр отечественного ПО, on-prem.
8. **Анонимность и психологическая безопасность** — базовая фича (приватный сбор → раскрытие у Neatro, RetroTool, RetroTime; blur/reveal у EasyRetro).
9. **Follow-up action items между ретро** — слабое место многих: у EasyRetro нет carry-over action items (по TeamRetro); TeamRetro и Kollabe делают трекинг с владельцем и сроком; экспорт в Jira — стандарт.
10. **Вовлечение/«фан»:** icebreakers, kudos, GIF, музыка, игры (TeleRetro, TeamRetro, EasyRetro Kudos Generator/Icebreaker Bingo, Kollabe).

## Гипотезы позиционирования sprint-retro (требуют проверки)
- H1. Ниша «замкнутый цикл улучшений»: action items автоматически переносятся в следующее ретро со статусом, плюс метрика «доля выполненных действий» — у большинства конкурентов это слабо.
- H2. AI-фасилитатор по умолчанию на free (кластеризация + саммари + черновик action items), т.к. у EasyRetro нет AI-группировки, а у остальных AI часто платный.
- H3. Щедрый free для одной команды (приватные доски, история без 7/30-дневного лимита) как канал роста против EasyRetro (публичные доски) и Kollabe (7 дней).
- H4. Для российского рынка: рубли, хранение в РФ, интеграции с локальными трекерами (Kaiten, YouTrack, Яндекс Трекер) — у Retrius интеграции не заявлены.
- H5. MCP-сервер с первого дня — ретро-данные доступны AI-агентам команды (trend у TeamRetro/LetRetro).
- H6. Простая flat-цена за команду без лимита досок — против лимитов EasyRetro.

## Открытые вопросы
- Целевой рынок: глобальный, СНГ или оба?
- Кто покупатель: scrum-мастер/тимлид (self-serve) или организация (enterprise)?
- Нужны ли planning poker/стендапы в MVP или фокус только на ретро + follow-up?
- Точные текущие цены EasyRetro (страница цен не читается автоматически).
