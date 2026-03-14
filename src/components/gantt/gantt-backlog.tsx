"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { BacklogTicket } from "@/hooks/use-board-polling";
import { getTicketColor } from "@/lib/ticket-colors";

interface Props {
  tickets: BacklogTicket[];
}

function BacklogCard({
  ticket,
  isAssigned,
}: {
  ticket: BacklogTicket;
  isAssigned: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `backlog-${ticket.id}-${isAssigned ? "re" : "new"}`,
      data: { type: "backlog", ticketId: ticket.id, ticket },
    });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 100 : undefined,
      }
    : {};

  const color = getTicketColor(ticket.id);
  const devPercent = Math.round(ticket.devEffortProportion * 100);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: color.bg,
        borderColor: color.border,
      }}
      className="cursor-grab rounded-lg border p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isAssigned && (
            <span className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" title="На доске">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
          )}
          {ticket.externalId && (
            <span
              className="truncate text-[10px] font-medium"
              style={{ color: color.text }}
            >
              {ticket.externalId}
            </span>
          )}
        </div>
        <span
          className="flex-shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold dark:bg-black/20"
          style={{ color: color.text }}
        >
          {ticket.storyPoints} SP
        </span>
      </div>
      <p
        className="mb-2 truncate text-xs font-medium"
        style={{ color: color.text }}
      >
        {ticket.title}
      </p>
      <div className="flex gap-1">
        <span className="rounded bg-indigo-500 px-1 py-px text-[8px] font-bold uppercase text-white">
          dev {devPercent}%
        </span>
        <span className="rounded bg-emerald-500 px-1 py-px text-[8px] font-bold uppercase text-white">
          qa {100 - devPercent}%
        </span>
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left"
    >
      <svg
        className={`h-3 w-3 flex-shrink-0 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="rounded-full bg-zinc-200/70 px-1.5 py-px text-[10px] font-medium text-zinc-500 dark:bg-zinc-700/50 dark:text-zinc-400">
        {count}
      </span>
    </button>
  );
}

export function GanttBacklog({ tickets }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [unassignedOpen, setUnassignedOpen] = useState(true);
  const [assignedOpen, setAssignedOpen] = useState(false);

  const unassigned = tickets.filter(
    (t) => !t.hasDevAssignment && !t.hasQaAssignment,
  );
  const assigned = tickets.filter(
    (t) => t.hasDevAssignment || t.hasQaAssignment,
  );

  if (collapsed) {
    return (
      <div className="flex-shrink-0 border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-full w-10 flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          title="Показать бэклог"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          <span className="text-[10px] font-medium [writing-mode:vertical-rl]">
            Бэклог ({unassigned.length})
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-56 flex-shrink-0 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          Бэклог
          <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {tickets.length}
          </span>
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          title="Свернуть"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tickets.length === 0 && (
          <p className="py-4 text-center text-xs text-zinc-400">
            Нет оценённых тикетов
          </p>
        )}

        {unassigned.length > 0 && (
          <div>
            <SectionHeader
              label="Не назначено"
              count={unassigned.length}
              open={unassignedOpen}
              onToggle={() => setUnassignedOpen((v) => !v)}
            />
            {unassignedOpen && (
              <div className="space-y-2 px-2 pb-2">
                {unassigned.map((ticket) => (
                  <BacklogCard
                    key={ticket.id}
                    ticket={ticket}
                    isAssigned={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {assigned.length > 0 && (
          <div>
            <SectionHeader
              label="На доске"
              count={assigned.length}
              open={assignedOpen}
              onToggle={() => setAssignedOpen((v) => !v)}
            />
            {assignedOpen && (
              <div className="space-y-2 px-2 pb-2">
                {assigned.map((ticket) => (
                  <BacklogCard
                    key={ticket.id}
                    ticket={ticket}
                    isAssigned={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
