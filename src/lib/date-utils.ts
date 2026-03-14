import {
  addDays,
  isSameDay,
  isWeekend as dateFnsIsWeekend,
  getDay,
  startOfDay,
  eachDayOfInterval,
  format,
} from "date-fns";

const WEDNESDAY = 3;

export function isWednesday(date: Date): boolean {
  return getDay(date) === WEDNESDAY;
}

export function getSprintEndDate(startDate: Date): Date {
  const end = addDays(startOfDay(startDate), 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getNextSprintStart(lastEndDate: Date): Date {
  return startOfDay(addDays(lastEndDate, 1));
}

export function generateDayColumns(
  startDate: Date,
  endDate: Date,
): Date[] {
  return eachDayOfInterval({
    start: startOfDay(startDate),
    end: startOfDay(endDate),
  });
}

export function isWeekend(date: Date): boolean {
  return dateFnsIsWeekend(date);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function formatDayShort(date: Date): string {
  return format(date, "EEE");
}

export function formatDayNumber(date: Date): string {
  return format(date, "d");
}

export function formatMonthDay(date: Date): string {
  return format(date, "d MMM");
}

export function spToDurationDays(sp: number): number {
  if (sp <= 1) return 2;
  if (sp <= 2) return 3;
  if (sp <= 3) return 5;
  return 8;
}

export function workingDaysToCalendarSpan(
  start: Date,
  workingDays: number,
): number {
  if (workingDays <= 0) return 1;
  let current = startOfDay(start);
  let remaining = workingDays;
  let span = 0;

  while (remaining > 0) {
    span++;
    if (!dateFnsIsWeekend(current)) {
      remaining--;
    }
    current = addDays(current, 1);
  }

  return span;
}

export function countWorkingDays(start: Date, end: Date): number {
  let current = startOfDay(start);
  const endDay = startOfDay(end);
  let count = 0;

  while (current <= endDay) {
    if (!dateFnsIsWeekend(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return Math.max(1, count);
}
