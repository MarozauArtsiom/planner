# Эпик 4: Гибкая диаграмма Ганта (Gantt Board)

## Бизнес-цель

Дать Скрам-мастеру интерактивный инструмент для назначения задач на конкретных исполнителей через drag-and-drop. Блоки задач визуально отражают эстимацию (SP → дни), пропорцию Dev/QA работы, и зависимости между Dev и QA частями. Команда видит формирование спринта в реальном времени.

## Что реализовано

### Story 4.1: Группировка команды
- Ось Y сетки разделена на 2 секции: Dev (верхний блок, indigo) и QA (нижний блок, emerald).
- Участники отсортированы по имени внутри каждой секции.

### Story 4.2: Базовый Drag-and-Drop тикета
- Панель бэклога (правый сайдбар) показывает оценённые тикеты с SP-бейджем и индикатором пропорции Dev/QA.
- Каждый тикет имеет уникальный цвет фона (12 цветов в палитре), видный и в бэклоге, и на таймлайне.
- SM перетаскивает тикет из бэклога на строку конкретного сотрудника на таймлайне.
- **Авто-разделение:** при назначении тикет сразу создаёт два блока — DEV и QA, с длительностью по пропорции `devEffortProportion`.
- DEV-блок размещается на выбранном Dev-исполнителе, QA-блок — на первом QA-инженере (начало сразу после окончания Dev).
- Каждый блок помечен бейджем «DEV» (indigo) или «QA» (emerald), фон — уникальный цвет тикета.
- При перемещении блока дата начала определяется по левому краю блока — интуитивное позиционирование.
- Существующие блоки можно перемещать drag-and-drop на другого сотрудника или другую дату.
- Hover-popover на блоках: при наведении (400мс) всплывает карточка с полным названием, типом, длительностью и кнопкой «Удалить». На узких блоках (1-2 дня) inline-кнопка скрыта — удаление только через popover.
- Бэклог разделён на секции «Не назначено» и «На доске» (collapsible). Назначенные тикеты остаются draggable — можно назначить один тикет на нескольких разработчиков.
- Оптимистичный UI через Zustand store — мгновенная реакция при drag, синхронизация с сервером через polling.

### Story 4.3: Параллельные задачи (Multi-row)
- При наложении задач по датам строка сотрудника автоматически расширяется по высоте.
- Каждая параллельная задача размещается на своей подстроке (sub-row) — тексты не перекрываются.
- Greedy interval packing алгоритм для минимизации количества подстрок.

### Story 4.4: Ручное изменение длительности (Resize & Spillover)
- При наведении на края блока появляются resize-контролы (cursor: col-resize).
- Левый край: сдвиг начала + изменение длительности. Правый край: изменение длительности.
- Pointer events (pointermove/pointerup) для плавного resize, независимо от @dnd-kit.
- Resize корректно работает с рабочими днями — расширение через выходные добавляет только рабочие дни.
- Spillover: блок свободно пересекает границу спринта — спринты не ограничивают длительность.

### Story 4.5: Разделение Dev и QA (Dependencies)
- Разделение на Dev и QA происходит автоматически при назначении тикета из бэклога.
- Dev и QA блоки связаны через `parentAssignmentId`.
- SVG-линия зависимости (dashed, bezier curve) от конца Dev-блока к началу QA-блока.
- Finish-to-Start: при сдвиге Dev-блока QA-блок автоматически сдвигается вправо (никогда не начнётся раньше окончания Dev).
- Контекстное меню (правый клик) на любом блоке: «Удалить».

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/app/actions/assignment.ts` | Server actions: assignTicket, moveAssignment, resizeAssignment, splitTicketAssignment, deleteAssignment |
| `src/app/api/board/state/route.ts` | Расширен: assignments + backlog в ответе |
| `src/hooks/use-board-polling.ts` | Типы BoardAssignment, BacklogTicket |
| `src/stores/gantt-store.ts` | Zustand store для оптимистичного UI (drag/resize/split) |
| `src/lib/gantt-layout.ts` | Алгоритм sub-rows (computeSubRows) и динамических высот (computeRowHeights) |
| `src/lib/date-utils.ts` | spToDurationDays — маппинг SP → рабочие дни |
| `src/components/gantt/gantt-board.tsx` | DndContext, store sync, resize handler, context menu, split/delete |
| `src/components/gantt/gantt-timeline.tsx` | Передача assignments, rowHeights, dependency lines |
| `src/components/gantt/gantt-grid.tsx` | Droppable member rows, рендеринг блоков, динамические высоты |
| `src/components/gantt/gantt-member-list.tsx` | Динамические высоты строк (rowHeights) |
| `src/components/gantt/gantt-ticket-block.tsx` | Draggable блок: цветовой сплит, resize handles, context menu |
| `src/components/gantt/gantt-backlog.tsx` | Collapsible sidebar, draggable карточки тикетов |
| `src/components/gantt/gantt-dependency-lines.tsx` | SVG overlay: bezier dependency lines с arrow marker |

## История изменений

| Дата | Тип | Описание |
|---|---|---|
| 2026-03-14 | feat | Board API расширен: assignments + backlog в ответе polling |
| 2026-03-14 | feat | Server actions для назначения, перемещения, resize, split, удаления |
| 2026-03-14 | feat | Zustand store для оптимистичного UI (drag/resize/split) |
| 2026-03-14 | feat | Backlog panel (collapsible sidebar) с draggable тикетами |
| 2026-03-14 | feat | DnD: drag из бэклога на строку сотрудника, перемещение блоков |
| 2026-03-14 | feat | Ticket blocks с цветовым Dev/QA сплитом |
| 2026-03-14 | feat | Multi-row: interval packing для параллельных задач |
| 2026-03-14 | feat | Resize handles с pointer events, spillover через спринты |
| 2026-03-14 | feat | Split Dev/QA через контекстное меню, SVG dependency lines |
| 2026-03-14 | feat | Finish-to-Start каскад при перемещении Dev-блока |
