---
title: Специализированные инструменты ретроспектив — ландшафт, цены, фичи (веб-исследование)
kind: web-research
saved_at: 2026-10-19
collected_by: Claude (WebSearch/WebFetch), роль — product owner sprint-retro
---

# Специализированные ретро-инструменты (кроме EasyRetro)

Снимок на 2026-10-19. Большинство обзоров написаны вендорами (TeamRetro, Kollabe, Echometer, retrospectivetools.com), их оценки предвзяты. Где был доступен официальный pricing — данные с него (помечено «оф.»). Расхождения указаны явно.

## TeamRetro (teamretro.com) — «всё-в-одном» для организаций
- Цены (оф.): Single Team $20.83/мес ($250/год), 1 команда до 25 человек; Small Organization $50/мес (3 команды, +$20 за команду); Large Organization от $75/мес (6+ команд, +$15); Enterprise — по запросу (10+ команд). Годовая оплата −16.7%. Trial 30 дней без карты, бесплатного плана нет. Участникам не нужен аккаунт.
- Во всех планах: шаблоны, кастомные workflow, анонимность, smart grouping, приватное голосование, роль фасилитатора, таймеры, вайтборды, комментарии, чат, parking lot; health checks и maturity models (радары, тренды); оценка задач (estimation); daily standups (асинхронные, расписание, перенос блокеров); action tracking (proposed actions, мгновенные саммари, sentiment/mood, темы, облака слов, личные дашборды); вовлечение (icebreakers, check-in/out, опросы, режим презентации, реакции, kudos, фоны/GIF/музыка, team agreements); отчёты, дашборды, брендинг; интеграции, webhooks, API и **MCP-доступ** на уровне команды; SAML SSO, хостинг US/EU, GDPR, SOC 3.
- Enterprise: гости/наблюдатели, Programs (team of teams), кросс-командные отчёты, SCIM, domain capture, account-level API/MCP, SOC 2 Type 2, IP allowlist.
- AI во всех планах: ассистент trAI, AI-подбор шаблонов, AI-группировка идей, AI-предложения action items, AI-саммари, AI-инсайты по sentiment и темам.
- Интеграции: Jira, Confluence, Azure DevOps, Slack, Microsoft Teams.
- retrospectivetools.com ставит его №1 (8.8). Echometer критикует: один из нескольких продуктов GroupMap, нет чёткого USP.

## Retrium (retrium.com) — фасилитация и техники
- Цены (оф.): Team $39/Team Room/мес; Business $715/Team Room/год (в таблице сравнения — $59/мес, расхождение на самой странице); Enterprise — по запросу (25+ команд). Пользователи безлимитные; единица оплаты — Team Room. Trial 30 дней, без бесплатного плана, возвратов нет.
- Фичи: неограниченные ретро и пользователи, все техники, Team Radar (health radar), анонимность; Business: SAML SSO, доступ к SOC audit и SIG Lite; Enterprise: тренинги, CSM, кастомные security review. SCIM API, custom reporting, tagging Team Rooms.
- Интеграции: только Jira Cloud. AI не упоминается. On-prem нет и не планируется.

## Parabol (parabol.co) — open source, несколько типов встреч
- Цены (оф.): Starter free — 2 команды, неограниченные пользователи, 10 встреч/мес, история 30 дней, 2 кастомных шаблона, 3 AI-саммари; Team $8/активный пользователь/мес (неактивные 30 дней не оплачиваются); Enterprise — фикс годовой, SAML SSO, SCIM, self-hosting/on-prem или single-tenant.
- Форматы: ретро, стендапы, check-ins, Sprint Poker. Team Health checks (5 категорий, тренды, пакеты вопросов) — только на платных.
- AI: discussion prompts (все планы), AI-саммари (3 на free, безлимит на платных), AI suggest groups, AI icebreakers, перефразирование анонимных комментариев.
- Открытый код (AGPL-3.0), SOC 2 Type II. 7 интеграций: Jira, GitHub, GitLab, Azure DevOps, Slack, Microsoft Teams, Google Calendar (по TeamRetro). Хостинг в США (минус для части EU-клиентов по Echometer).
- Слабости: пошаговый процесс кажется жёстким; per-user цена растёт с численностью.

## Neatro (neatro.io) — психологическая безопасность, для малых команд
- Цены (оф.): Free до 10 участников навсегда, неограниченные ретро и радары, 70+ шаблонов, история 30 дней; Premium $23.20/команда/мес при годовой оплате (неогр. участники, кастомные шаблоны, интеграции и экспорт); Pro $31.20 (SAML SSO, онбординг); Enterprise — по запросу. Годовая оплата −20% (Kollabe указывает $29 — вероятно месячная цена). Trial Premium 14 дней.
- Фичи: приватный брейншторм, затем анонимное раскрытие; Team Radar; kanban action tracking; интерфейс EN/FR. AI нет.

## GoRetro (goretro.ai) — ретро + спринт-аналитика
- Цены (оф.): Premium $29/команда/мес (годовая), Sprint Pro $49 (+capacity calculator, planning poker), Organization — по запросу (SAML/SSO, SLA). Trial 30 дней.
- Free (по TeamRetro): 1 команда, 5 публичных и 2 командные доски за 31 день; экспорт, аналитика, Jira sync, happiness index, опросы — платные.
- Фичи: анонимность, таймер, action items, happiness index, icebreakers, polls, retro analytics, Joker cards, sprint monitoring, Jira Cloud, Slack. AI-фичи только анонсированы («data driven sprint planning — coming soon»).

## Echometer (echometerapp.com) — team health, хостинг в Германии
- Цены: Pro €29/команда/мес (годовая; €35 помесячно), Business €49. Free: 1 команда, 1 ретро/мес после 21-дневного trial.
- Фичи: health checks с автоматическим расписанием, кросс-командные heatmaps/радары, конструктор анонимных опросов, ROTI, 50+ шаблонов, вайтборд, 1:1 инструменты, участие без логина, интеграция с Jira. Психологически обоснованные форматы; высокий порог входа.

## Kollabe (kollabe.com) — дешёвый free для небольших встреч
- Free: неограниченные ретро до 10 участников, без аккаунта, история 7 дней. Paid $29/мес за space (flat, безлимит участников), AI на платном: генерация шаблонов, саммари, sentiment, кросс-ретро инсайты, AI-группировка по семантической близости.
- Также стендапы и planning poker; GIF, реакции, kudos, action items с владельцем и сроком. Нет health checks и recurring retros (по retrospectivetools.com).

## Reetro (reetro.app) — AI-ретро в Slack/Teams
- Free: 3 команды, 10 пользователей на команду, 10 досок на команду. Платно: $10/команда/мес или $49/мес на организацию (retrospectivetools.com) vs $32/команда/мес (Kollabe) — расхождение.
- Фичи: AI-саммари, sentiment, группировка, health checks, happiness index, scheduler, action tracker с экспортом в Jira/Azure DevOps; интеграции Jira, Azure DevOps, Confluence, Slack, MS Teams. Анонимность и мульти-голосование — платные. Нет API.

## TeleRetro (teleretro.com) — «весёлые» ретро
- Team £26/мес (£21 при годовой), Business £72 (£58). Free: 1 команда, 3 ретро.
- AI retro bot, pulse/health checks, аналитика, картинки и музыка, emoji-голосование, таймер, icebreakers.

## ScatterSpoke — AI-платформа фидбека для инженерных лидеров
- Free 1 seat; Pro $29/seat/мес (до 5), Business $149/мес (5 seats).
- AI-темы и sentiment, приоритизация action items по ретро/стендапам/опросам, «Agent Surveys», API/MCP.

## Новые и нишевые игроки
- **LetRetro** — $15/мес flat; AI-ретро (кластеризация, саммари, action items, sentiment/тренды), Jira/GitHub/GitLab, официальный MCP-сервер; нет анонимности, общего таймера, recurring retros.
- **QRetro** — полностью бесплатный, 52 шаблона, health checks, ROTI, таймер, опросы, icebreakers, MCP-доступ; соло-мейнтейнер, нет SSO/экспорта/сертификаций.
- **SprintRetro** — Jira-native, бесплатно до 10 пользователей Jira, далее $0.84/пользователь/мес; ретро + вайтборд + спринт-метрики внутри Jira.
- **RetroTool** — без регистрации, приватная зона до шаринга, точечное голосование, таймер, zero-knowledge шифрование на верхнем тарифе; $10–20/команда/мес; выглядит слабо поддерживаемым.
- **Retrospected** — open source (GPL-3.0), self-host лицензия $599 разово; Pro $12.90/мес, Unlimited $49.95/мес; на free доски публичные.
- **RetroTime (retroti.me)** — лёгкая real-time доска, скрытие комментариев во время сбора, экспорт в спринт-инструменты.
- **IdeaBoardz** — бесплатный легаси-инструмент без аккаунта, не развивается с 2020.
- **Spreo (бывш. Metro Retro → Ludi)** — свободный вайтборд, $4–5/пользователь/мес, free план убран в 2024, Jira/SSO/PDF на Business, работа с AI-ассистентом через MCP; хостинг только EU.

## Рейтинг retrospectivetools.com (вендорский сайт, 2026-10-05)
TeamRetro 8.8, Parabol 7.4, Kollabe 6.9, QRetro 6.3, EasyRetro 6.2, Reetro 6.1, LetRetro 5.9, SprintRetro 5.8, TeleRetro 5.8, Spreo 5.7.

## Источники
- https://www.teamretro.com/pricing/
- https://www.teamretro.com/blog/best-retrospective-tools/
- https://www.retrium.com/pricing
- https://www.parabol.co/pricing/
- https://www.neatro.io/pricing
- https://www.goretro.ai/pricing
- https://echometerapp.com/en/retrospective-tools-online/
- https://kollabe.com/posts/best-free-retro-tools
- https://www.retrospectivetools.com/
- https://letretro.com/blog/5-best-ai-retrospective-tools-in-2026
