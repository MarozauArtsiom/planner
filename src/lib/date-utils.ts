import {
  addDays,
  isSameDay,
  isWeekend as dateFnsIsWeekend,
  startOfDay,
  eachDayOfInterval,
  format,
  formatISO,
} from "date-fns";

export function getSprintEndDate(startDate: Date, durationWeeks: number = 1): Date {
  const totalDays = durationWeeks * 7 - 1;
  const end = addDays(startOfDay(startDate), totalDays);
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

export function toDateKey(date: Date): string {
  return formatISO(startOfDay(date), { representation: "date" });
}

export function isNonWorkingDay(date: Date, timeOffDates?: Set<string>): boolean {
  if (dateFnsIsWeekend(date)) return true;
  if (timeOffDates && timeOffDates.has(toDateKey(date))) return true;
  return false;
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
  timeOffDates?: Set<string>,
): number {
  if (workingDays <= 0) return 1;
  let current = startOfDay(start);
  let remaining = workingDays;
  let span = 0;

  while (remaining > 0) {
    span++;
    if (!isNonWorkingDay(current, timeOffDates)) {
      remaining--;
    }
    current = addDays(current, 1);
  }

  return span;
}

export function countWorkingDays(
  start: Date,
  end: Date,
  timeOffDates?: Set<string>,
): number {
  let current = startOfDay(start);
  const endDay = startOfDay(end);
  let count = 0;

  while (current <= endDay) {
    if (!isNonWorkingDay(current, timeOffDates)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return Math.max(1, count);
}

export const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;

function getQuarter(date: Date): string {
  const month = date.getMonth();
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
}

export function renderSprintName(
  template: string,
  number: number,
  startDate: Date,
): string {
  return template
    .replace(/\{number\}/g, String(number))
    .replace(/\{date\}/g, format(startDate, "dd.MM"))
    .replace(/\{quarter\}/g, getQuarter(startDate))
    .replace(/\{year\}/g, format(startDate, "yyyy"));
}
