# Changelog

## 2026-03-14
- **chore(prd):** Обновление PRD до v2.0 — уточнены роли (SM = Редактор, Member = Зритель с Read-Only на Ганте), Эпик 4 переименован в Infinite Capacity Board с Multi-row Assigning (sub-rows при пересечении задач)
- **chore(tech-architecture):** Обновление Tech Spec — добавлена полная Prisma-схема с моделями Assignment (subRowIndex), Role enum (DEV/QA/SCRUM_MASTER), упрощена real-time стратегия до HTTP Polling
