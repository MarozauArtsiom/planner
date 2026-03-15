import type { jsPDF } from "jspdf";
import type {
  ReportSprint,
  ReportMember,
  ReportAssignment,
  ReportTimeOff,
} from "./types";
import {
  generateDayColumns,
  isWeekend,
  isToday,
  toDateKey,
} from "@/lib/date-utils";
import { getTicketColorRgb } from "./color-utils";

const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 18;
const SUB_ROW_HEIGHT = 16;
const MEMBER_COL_WIDTH = 90;
const GROUP_HEADER_HEIGHT = 14;
const MIN_DAY_WIDTH = 12;
const MAX_DAY_WIDTH = 28;
const BLOCK_PADDING = 1;

interface GanttDrawResult {
  endY: number;
}

export function drawGanttChart(
  doc: jsPDF,
  startY: number,
  sprints: ReportSprint[],
  members: ReportMember[],
  assignments: ReportAssignment[],
  timeOffs: ReportTimeOff[],
  translations: { dev: string; qa: string; ba: string },
): GanttDrawResult {
  if (sprints.length === 0 || members.length === 0) {
    return { endY: startY };
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const gridWidth = pageWidth - margin * 2 - MEMBER_COL_WIDTH;

  const allDays = generateDayColumns(
    new Date(sprints[0].startDate),
    new Date(sprints[sprints.length - 1].endDate),
  );

  const dayWidth = Math.min(
    MAX_DAY_WIDTH,
    Math.max(MIN_DAY_WIDTH, gridWidth / allDays.length),
  );
  const actualGridWidth = dayWidth * allDays.length;

  const timeOffSet = new Map<string, Set<string>>();
  for (const to of timeOffs) {
    if (!timeOffSet.has(to.userId)) timeOffSet.set(to.userId, new Set());
    timeOffSet.get(to.userId)!.add(toDateKey(new Date(to.date)));
  }

  const devMembers = members.filter((m) => m.role === "DEV");
  const qaMembers = members.filter((m) => m.role === "QA");
  const baMembers = members.filter((m) => m.role === "BA");

  const memberSubRows = computeAllSubRows(members, assignments, allDays);

  const groups = [devMembers, qaMembers, baMembers].filter((g) => g.length > 0);
  const totalRows = computeTotalHeight(groups, memberSubRows);

  const totalChartHeight =
    HEADER_HEIGHT + totalRows * SUB_ROW_HEIGHT + GROUP_HEADER_HEIGHT * groups.length;

  let currentY = startY;

  if (currentY + totalChartHeight > pageHeight - margin) {
    doc.addPage("landscape");
    currentY = margin;
  }

  const gridX = margin + MEMBER_COL_WIDTH;

  drawHeader(doc, currentY, gridX, allDays, dayWidth, sprints);
  currentY += HEADER_HEIGHT;

  const groupDefs: { label: string; members: ReportMember[] }[] = [
    { label: translations.dev, members: devMembers },
    { label: translations.qa, members: qaMembers },
    { label: translations.ba, members: baMembers },
  ];

  for (const group of groupDefs) {
    if (group.members.length === 0) continue;
    currentY = drawGroup(
      doc,
      currentY,
      margin,
      gridX,
      group.label,
      group.members,
      assignments,
      allDays,
      dayWidth,
      timeOffSet,
      memberSubRows,
      pageHeight,
      margin,
    );
  }

  const legendY = drawLegend(
    doc,
    currentY + 6,
    margin,
    actualGridWidth + MEMBER_COL_WIDTH,
    assignments,
    pageHeight,
  );

  return { endY: legendY };
}

function drawHeader(
  doc: jsPDF,
  y: number,
  gridX: number,
  days: Date[],
  dayWidth: number,
  sprints: ReportSprint[],
) {
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);

  const sprintBoundaries = new Map<number, string>();
  for (const sprint of sprints) {
    const startKey = toDateKey(new Date(sprint.startDate));
    const idx = days.findIndex((d) => toDateKey(d) === startKey);
    if (idx >= 0) sprintBoundaries.set(idx, sprint.name);
  }

  for (const [idx, name] of sprintBoundaries) {
    const x = gridX + idx * dayWidth;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(name, x + 2, y + 8, { maxWidth: dayWidth * 7 });
  }

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const x = gridX + i * dayWidth;
    const weekend = isWeekend(day);
    const today = isToday(day);

    if (weekend) {
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y + 14, dayWidth, HEADER_HEIGHT - 14, "F");
    }

    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(weekend ? 180 : 120, weekend ? 180 : 120, weekend ? 180 : 120);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    doc.text(dayNames[day.getDay()], x + dayWidth / 2, y + 22, {
      align: "center",
    });

    doc.setFontSize(7);
    doc.setTextColor(today ? 220 : 60, today ? 50 : 60, today ? 50 : 60);
    if (today) doc.setFont("helvetica", "bold");
    doc.text(String(day.getDate()), x + dayWidth / 2, y + 31, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(gridX, y + HEADER_HEIGHT, gridX + days.length * dayWidth, y + HEADER_HEIGHT);
}

function drawGroup(
  doc: jsPDF,
  startY: number,
  marginLeft: number,
  gridX: number,
  groupLabel: string,
  groupMembers: ReportMember[],
  assignments: ReportAssignment[],
  days: Date[],
  dayWidth: number,
  timeOffSet: Map<string, Set<string>>,
  memberSubRows: Map<string, Map<string, number>>,
  pageHeight: number,
  pageMargin: number,
): number {
  let y = startY;

  doc.setFillColor(245, 245, 245);
  doc.rect(marginLeft, y, MEMBER_COL_WIDTH + days.length * dayWidth, GROUP_HEADER_HEIGHT, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text(groupLabel, marginLeft + 4, y + 10);
  doc.setFont("helvetica", "normal");
  y += GROUP_HEADER_HEIGHT;

  for (const member of groupMembers) {
    const subRowMap = memberSubRows.get(member.id) ?? new Map();
    const subRowCount = Math.max(
      1,
      subRowMap.size > 0 ? Math.max(...subRowMap.values()) + 1 : 1,
    );
    const rowHeight = subRowCount * SUB_ROW_HEIGHT;

    if (y + rowHeight > pageHeight - pageMargin) {
      doc.addPage("landscape");
      y = pageMargin;
    }

    doc.setFontSize(6.5);
    doc.setTextColor(40, 40, 40);
    doc.text(
      member.name,
      marginLeft + 4,
      y + rowHeight / 2 + 2,
      { maxWidth: MEMBER_COL_WIDTH - 8 },
    );

    const memberTimeOffs = timeOffSet.get(member.id);
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const x = gridX + i * dayWidth;
      const dayKey = toDateKey(day);
      const weekend = isWeekend(day);
      const isOff = memberTimeOffs?.has(dayKey);

      if (weekend || isOff) {
        doc.setFillColor(isOff ? 230 : 245, isOff ? 235 : 245, isOff ? 240 : 245);
        doc.rect(x, y, dayWidth, rowHeight, "F");
      }

      if (isToday(day)) {
        doc.setDrawColor(220, 60, 60);
        doc.setLineWidth(0.5);
        doc.line(x, y, x, y + rowHeight);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
      }
    }

    const memberAssignments = assignments.filter(
      (a) => a.userId === member.id,
    );

    for (const assignment of memberAssignments) {
      const subRow = subRowMap.get(assignment.id) ?? 0;
      drawAssignmentBlock(
        doc,
        assignment,
        gridX,
        y + subRow * SUB_ROW_HEIGHT,
        days,
        dayWidth,
        memberTimeOffs,
      );
    }

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, y + rowHeight, gridX + days.length * dayWidth, y + rowHeight);

    y += rowHeight;
  }

  return y;
}

function drawAssignmentBlock(
  doc: jsPDF,
  assignment: ReportAssignment,
  gridX: number,
  blockY: number,
  days: Date[],
  dayWidth: number,
  memberTimeOffs: Set<string> | undefined,
) {
  const startKey = toDateKey(new Date(assignment.startDate));
  const startIdx = days.findIndex((d) => toDateKey(d) === startKey);
  if (startIdx < 0) return;

  let calendarSpan = 0;
  let workingDaysLeft = assignment.durationDays;
  for (let i = startIdx; i < days.length && workingDaysLeft > 0; i++) {
    calendarSpan++;
    const dayKey = toDateKey(days[i]);
    const isOff = isWeekend(days[i]) || (memberTimeOffs?.has(dayKey) ?? false);
    if (!isOff) workingDaysLeft--;
  }

  const x = gridX + startIdx * dayWidth + BLOCK_PADDING;
  const w = calendarSpan * dayWidth - BLOCK_PADDING * 2;
  const h = SUB_ROW_HEIGHT - BLOCK_PADDING * 2;

  const color = getTicketColorRgb(assignment.ticketId);

  doc.setFillColor(color.bgR, color.bgG, color.bgB);
  doc.setDrawColor(color.borderR, color.borderG, color.borderB);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, blockY + BLOCK_PADDING, w, h, 1.5, 1.5, "FD");

  const FONT_SIZE = 5;
  const CHAR_WIDTH = FONT_SIZE * 0.45;
  const textPad = 2;
  const maxTextWidth = w - textPad * 2;

  if (maxTextWidth <= 4) return;

  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(color.textR, color.textG, color.textB);

  const isNarrow = calendarSpan < 3;
  const rawLabel = isNarrow
    ? (assignment.ticketExternalId ?? assignment.ticketTitle)
    : assignment.ticketExternalId
      ? `${assignment.ticketExternalId}: ${assignment.ticketTitle}`
      : assignment.ticketTitle;

  const label = truncateToFit(rawLabel, maxTextWidth, CHAR_WIDTH);

  doc.text(label, x + textPad, blockY + BLOCK_PADDING + h / 2 + 1.5);
}

function drawLegend(
  doc: jsPDF,
  startY: number,
  marginLeft: number,
  totalWidth: number,
  assignments: ReportAssignment[],
  pageHeight: number,
): number {
  const uniqueTickets = new Map<
    string,
    { id: string; externalId: string | null; title: string }
  >();
  for (const a of assignments) {
    if (!uniqueTickets.has(a.ticketId)) {
      uniqueTickets.set(a.ticketId, {
        id: a.ticketId,
        externalId: a.ticketExternalId,
        title: a.ticketTitle,
      });
    }
  }

  if (uniqueTickets.size === 0) return startY;

  let y = startY;
  const colWidth = totalWidth / 2;
  let col = 0;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Legend", marginLeft, y + 4);
  doc.setFont("helvetica", "normal");
  y += 8;

  const legendStartY = y;

  for (const [ticketId, ticket] of uniqueTickets) {
    if (y > pageHeight - 20) {
      doc.addPage("landscape");
      y = 20;
      col = 0;
    }

    const x = marginLeft + col * colWidth;
    const color = getTicketColorRgb(ticketId);

    doc.setFillColor(color.bgR, color.bgG, color.bgB);
    doc.setDrawColor(color.borderR, color.borderG, color.borderB);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, 6, 5, 1, 1, "FD");

    doc.setFontSize(5.5);
    doc.setTextColor(60, 60, 60);
    const label = ticket.externalId
      ? `${ticket.externalId} — ${ticket.title}`
      : ticket.title;
    doc.text(label, x + 9, y + 3.5, { maxWidth: colWidth - 14 });

    if (col === 0) {
      col = 1;
    } else {
      col = 0;
      y += 8;
    }
  }

  if (col === 1) y += 8;

  return y;
}

function truncateToFit(
  text: string,
  maxWidth: number,
  charWidth: number,
): string {
  const maxChars = Math.floor(maxWidth / charWidth);
  if (maxChars <= 0) return "";
  if (text.length <= maxChars) return text;
  if (maxChars <= 2) return text.slice(0, maxChars);
  return text.slice(0, maxChars - 1) + "\u2026";
}

function computeAllSubRows(
  members: ReportMember[],
  assignments: ReportAssignment[],
  days: Date[],
): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();

  for (const member of members) {
    const memberAssignments = assignments.filter(
      (a) => a.userId === member.id,
    );
    const subRowMap = computeSubRowsForReport(memberAssignments, days);
    result.set(member.id, subRowMap);
  }

  return result;
}

function computeSubRowsForReport(
  assignments: ReportAssignment[],
  days: Date[],
): Map<string, number> {
  const result = new Map<string, number>();
  if (assignments.length === 0) return result;

  const sorted = [...assignments].sort((a, b) => {
    const diff =
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    if (diff !== 0) return diff;
    return b.durationDays - a.durationDays;
  });

  const subRowEnds: number[] = [];

  for (const assignment of sorted) {
    const startKey = toDateKey(new Date(assignment.startDate));
    const startIdx = days.findIndex((d) => toDateKey(d) === startKey);
    if (startIdx < 0) {
      result.set(assignment.id, 0);
      continue;
    }
    const start = startIdx;
    const end = startIdx + assignment.durationDays;

    let placed = false;
    for (let row = 0; row < subRowEnds.length; row++) {
      if (subRowEnds[row] <= start) {
        result.set(assignment.id, row);
        subRowEnds[row] = end;
        placed = true;
        break;
      }
    }

    if (!placed) {
      result.set(assignment.id, subRowEnds.length);
      subRowEnds.push(end);
    }
  }

  return result;
}

function computeTotalHeight(
  groups: ReportMember[][],
  memberSubRows: Map<string, Map<string, number>>,
): number {
  let total = 0;
  for (const group of groups) {
    for (const m of group) {
      const subRowMap = memberSubRows.get(m.id);
      const maxSub = subRowMap && subRowMap.size > 0
        ? Math.max(...subRowMap.values()) + 1
        : 1;
      total += maxSub;
    }
  }
  return total;
}
