# Эпик 5: Учёт отсутствия (Time-offs)

## Бизнес-цель

Дать Скрам-мастеру возможность отмечать нерабочие дни (отпуск, отгул) конкретных сотрудников прямо на диаграмме Ганта. Задачи, попадающие на отмеченные дни, автоматически удлиняются — «чистое» рабочее время на задачу не сгорает. Вся команда видит актуальный статус отсутствий через polling.

## Что реализовано

### Story 5.1: Установка нерабочих дней
- SM кликает на ячейку дня в строке сотрудника — день переключается между рабочим и нерабочим (toggle).
- Нерабочий день отображается серой диагональной штриховкой (repeating-linear-gradient).
- Клик по выходным (Сб/Вс) игнорируется — они уже нерабочие.
- Все участники видят изменения через HTTP polling (2 сек).
- Данные хранятся в модели `TimeOff` (userId + date, unique constraint).

### Story 5.2: Авто-прыжок через выходные и отпуска
- Функции `workingDaysToCalendarSpan` и `countWorkingDays` расширены: принимают опциональный `Set<string>` дат time-off.
- Блоки задач на Ганте автоматически растягиваются через дни отпуска — net рабочая длительность сохраняется.
- Finish-to-Start зависимости (Dev → QA) корректно учитывают time-off при расчёте дат начала QA-блока.
- Server-side actions (`assignTicket`, `moveAssignment`, `resizeAssignment`) запрашивают time-off пользователя из БД для точного расчёта.
- Zustand store использует time-off данные для оптимистичных обновлений F2S.

## Ключевые файлы
| Файл | Назначение |
|---|---|
| `src/app/actions/timeoff.ts` | Server action `toggleTimeOff` — toggle нерабочего дня |
| `src/app/api/board/state/route.ts` | API возвращает `timeOffs` для участников проекта |
| `src/hooks/use-board-polling.ts` | Типы `BoardTimeOff`, `BoardState.timeOffs` |
| `src/lib/date-utils.ts` | `isNonWorkingDay`, `toDateKey`, расширенные `workingDaysToCalendarSpan`/`countWorkingDays` |
| `src/components/gantt/gantt-grid.tsx` | Визуализация штриховки, onClick toggle, time-off-aware calSpan |
| `src/components/gantt/gantt-board.tsx` | Wiring toggle handler, time-off-aware resize |
| `src/components/gantt/gantt-timeline.tsx` | Проброс timeOffs/onToggleTimeOff в GanttGrid |
| `src/stores/gantt-store.ts` | `timeOffs` state, `syncTimeOffs`, time-off-aware F2S |
| `src/app/actions/assignment.ts` | `getUserTimeOffSet`, time-off-aware server-side F2S |

## История изменений
| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Story 5.1: toggle нерабочих дней SM кликом, штриховка, polling |
| 2026-03-14 | feat | Story 5.2: авто-прыжок задач через отпуска, time-off-aware F2S |
