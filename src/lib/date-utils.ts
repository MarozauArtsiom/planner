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
