# Эпик 7: Настройки проекта для Скрам-мастера

## Бизнес-цель
SM получает полный контроль над параметрами проекта: длительность и нейминг спринтов, шкала Story Points с описаниями для команды, коэффициент задач для корректировки оценок, и активный спринт для фокуса команды.

## Что реализовано
- **Настраиваемая длительность спринта** — SM выбирает 1-4 недели и день старта. Изменение mid-project пересчитывает будущие спринты (после активного).
- **Шаблон нейминга спринтов** — свободный текст с переменными `{number}`, `{date}`, `{quarter}`, `{year}`. Применяется при создании новых спринтов.
- **Активный спринт** — SM выбирает в Settings или на борде (кнопка-звезда). Борда автоскроллится к нему при открытии. Визуальное выделение рамкой.
- **Настраиваемая шкала SP** — редактируемая таблица значений SP, описаний (видны команде при голосовании) и длительности в рабочих днях (для Ганта). Кнопка «Сбросить к дефолту».
- **Коэффициент задач** — множитель длительности при назначении на Гант. 1.0 = без изменений. Применяется в `assignTicket` и `splitTicketAssignment`, НЕ при ручном resize.

## Ключевые файлы
| Файл | Назначение |
|---|---|
| `prisma/schema.prisma` | Новые поля Project, модель SpScaleItem |
| `src/lib/sp-scale.ts` | Дефолтная шкала SP, `getSpDurationDays()` |
| `src/lib/date-utils.ts` | `isCorrectStartDay()`, `renderSprintName()`, `DAY_NAMES` |
| `src/app/actions/project.ts` | `updateProjectSettings`, `setActiveSprint`, `updateSpScale`, `resetSpScale` |
| `src/app/actions/sprint.ts` | `createSprint` (шаблон + настройки), `recalcFutureSprints` |
| `src/app/actions/assignment.ts` | Использует шкалу проекта и коэффициент |
| `src/app/api/project/[id]/settings/route.ts` | GET — конфигурация проекта |
| `src/app/api/board/state/route.ts` | Возвращает `activeSprintId` |
| `src/app/api/estimation/session/route.ts` | Возвращает `spScale` |
| `src/app/project/[id]/settings/page.tsx` | 5 новых секций настроек |
| `src/components/gantt/gantt-header.tsx` | Индикатор активного спринта + кнопка «Сделать активным» |
| `src/components/gantt/gantt-timeline.tsx` | Автоскролл к активному спринту |
| `src/components/estimation/estimation-board.tsx` | SP-selector с лейблами из шкалы |
| `src/lib/estimation-engine.ts` | `calculateEstimation` принимает опциональные SP-значения |

## История изменений
| Дата | Тип | Описание |
|---|-----|----|
| 2026-03-15 | feat | Настраиваемая длительность спринта (1-4 недели), день старта, пересчёт будущих спринтов |
| 2026-03-15 | feat | Шаблон нейминга спринтов с переменными {number}, {date}, {quarter}, {year} |
| 2026-03-15 | feat | Активный спринт — выбор в Settings и на борде, автоскролл |
| 2026-03-15 | feat | Настраиваемая шкала SP — значения, описания, длительность на Ганте |
| 2026-03-15 | feat | Коэффициент задач — множитель длительности при назначении |
