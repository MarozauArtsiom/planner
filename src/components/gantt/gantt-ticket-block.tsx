"use client";

import { useState, useRef, useCallback, useEffect } from "react";

import { useDraggable } from "@dnd-kit/core";
import { COLUMN_WIDTH } from "./gantt-header";
import { ROW_HEIGHT } from "./gantt-member-list";
import { getTicketColor } from "@/lib/ticket-colors";

const BLOCK_V_PAD = 4;

interface Props {
  id: string;
  ticketId: string;
  ticketTitle: string;
  ticketExternalId: string | null;
  calendarSpan: number;
  durationDays: number;
  type: "DEV" | "QA";
  dayOffset: number;
  subRow: number;
  isSM: boolean;
  onResizeStart?: (
    id: string,
    edge: "left" | "right",
    e: React.PointerEvent,
  ) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
}

export function GanttTicketBlock({
  id,
  ticketId,
  ticketTitle,
  ticketExternalId,
  calendarSpan,
  durationDays,
  type,
  dayOffset,
  subRow,
  isSM,
  onResizeStart,
  onContextMenu,
  onDelete,
}: Props) {
  const [pinned, setPinned] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `assignment-${id}`,
    data: { type: "assignment", assignmentId: id },
    disabled: !isSM,
  });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleBlockClick = useCallback(
    (e: React.MouseEvent) => {
      if (pointerStartRef.current) {
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) return;
      }
      e.stopPropagation();
      setPinned((v) => !v);
    },
    [],
  );

  useEffect(() => {
    if (!pinned) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        blockRef.current?.contains(target)
      )
        return;
      setPinned(false);
    }
    document.addEventListener("pointerdown", onClickOutside);
    return () => document.removeEventListener("pointerdown", onClickOutside);
  }, [pinned]);

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      (blockRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
    },
    [setNodeRef],
  );

  const left = dayOffset * COLUMN_WIDTH;
  const width = calendarSpan * COLUMN_WIDTH;
  const top = subRow * ROW_HEIGHT + BLOCK_V_PAD;
  const height = ROW_HEIGHT - BLOCK_V_PAD * 2;
  const isNarrow = calendarSpan <= 2;

  const color = getTicketColor(ticketId);
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;

  const style: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width,
    height,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : pinned ? 40 : 5,
    backgroundColor: isDark ? color.darkBg : color.bg,
    borderColor: isDark ? color.darkBorder : color.border,
  };

  const typeBadgeCls =
    type === "QA"
      ? "bg-emerald-500 dark:bg-emerald-600"
      : "bg-indigo-500 dark:bg-indigo-600";

  return (
    <div
      ref={mergedRef}
      style={style}
      className={`group flex overflow-visible rounded-md border shadow-sm ${
        isSM ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      onContextMenu={
        onContextMenu ? (e) => onContextMenu(id, e) : undefined
      }
      onPointerDown={handlePointerDown}
      onClick={handleBlockClick}
      {...attributes}
      {...listeners}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-md"
        style={{ backgroundColor: isDark ? color.darkBg : color.bg }}
      >
        <div className="flex h-full items-center gap-1.5 px-1.5">
          <span
            className={`flex-shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase leading-tight text-white ${typeBadgeCls}`}
          >
            {type === "QA" ? "QA" : "DEV"}
          </span>
          {!isNarrow && (
            <span
              className="min-w-0 flex-1 truncate text-[11px] font-medium"
              style={{ color: isDark ? color.darkText : color.text }}
            >
              {ticketExternalId && (
                <span className="mr-1 opacity-60">{ticketExternalId}</span>
              )}
              {ticketTitle}
            </span>
          )}
          {!isNarrow && isSM && onDelete && (
            <button
              className="ml-0.5 flex-shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              style={{ color: isDark ? color.darkText : color.text }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              title="Удалить"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {pinned && !isDragging && !transform && (
        <div
          ref={popoverRef}
          className="absolute left-0 z-[60] w-56 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          style={{ bottom: height + 6 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span
              className={`flex-shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase leading-tight text-white ${typeBadgeCls}`}
            >
              {type}
            </span>
            <span className="text-[10px] text-zinc-400">
              {durationDays}д
            </span>
            <button
                className="ml-auto text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
                onClick={() => setPinned(false)}
                title="Закрыть"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
          </div>
          {ticketExternalId && (
            <p className="mb-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
              {ticketExternalId}
            </p>
          )}
          <p className="mb-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {ticketTitle}
          </p>
          {isSM && onDelete && (
            <button
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={(e) => {
                e.stopPropagation();
                setPinned(false);
                onDelete(id);
              }}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              Удалить
            </button>
          )}
        </div>
      )}

      {isSM && onResizeStart && (
        <>
          <div
            className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
            style={{ zIndex: 2 }}
            onPointerDown={(e) => {
              e.stopPropagation();
              pointerStartRef.current = null;
              onResizeStart(id, "left", e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full w-full rounded-l-md bg-zinc-500/50" />
          </div>
          <div
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60"
            style={{ zIndex: 2 }}
            onPointerDown={(e) => {
              e.stopPropagation();
              pointerStartRef.current = null;
              onResizeStart(id, "right", e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full w-full rounded-r-md bg-zinc-500/50" />
          </div>
        </>
      )}
    </div>
  );
}
