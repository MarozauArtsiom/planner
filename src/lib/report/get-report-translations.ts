import type { ReportTranslations } from "./generate-sprint-report";

import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";
import pl from "../../../messages/pl.json";
import es from "../../../messages/es.json";
import be from "../../../messages/be.json";
import uk from "../../../messages/uk.json";
import hi from "../../../messages/hi.json";

type ReportMessages = typeof en.report;

const REPORT_MESSAGES: Record<string, ReportMessages> = {
  en: en.report,
  ru: ru.report,
  pl: pl.report,
  es: es.report,
  be: be.report,
  uk: uk.report,
  hi: hi.report,
};

export const LOCALE_LABELS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
  { code: "es", label: "Español" },
  { code: "be", label: "Беларуская" },
  { code: "uk", label: "Українська" },
  { code: "hi", label: "हिन्दी" },
];

export function getReportTranslations(locale: string): ReportTranslations {
  const m = REPORT_MESSAGES[locale] ?? REPORT_MESSAGES.en;
  return {
    title: m.coverTitle,
    generated: m.generated,
    summary: m.summaryTitle,
    totalTickets: m.totalTickets,
    totalSp: m.totalSp,
    teamMembers: m.teamMembers,
    workingDays: m.workingDays,
    utilization: m.utilization,
    ganttTitle: m.ganttTitle,
    dev: m.dev,
    qa: m.qa,
    memberBreakdown: m.memberBreakdownTitle,
    ticketSummary: m.ticketSummaryTitle,
    backlogTitle: m.backlogTitle,
    externalId: m.externalId,
    ticketTitle: m.ticketTitleCol,
    sp: m.sp,
    duration: m.duration,
    dates: m.dates,
    devAssignee: m.devAssignee,
    qaAssignee: m.qaAssignee,
    devDays: m.devDays,
    qaDays: m.qaDays,
    total: m.total,
    timeOffs: m.timeOffs,
    available: m.available,
    assigned: m.assigned,
    unassigned: m.unassigned,
    noAssignment: m.noAssignment,
    devOnly: m.devOnly,
    qaOnly: m.qaOnly,
    status: m.status,
    days: m.days,
  };
}
