import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ReportData,
  ReportOptions,
  ReportAssignment,
  ReportBacklogTicket,
} from "./types";
import { drawGanttChart } from "./draw-gantt";
import {
  generateDayColumns,
  isWeekend,
  toDateKey,
  countWorkingDays,
} from "@/lib/date-utils";
import { format } from "date-fns";

export interface ReportTranslations {
  title: string;
  generated: string;
  summary: string;
  totalTickets: string;
  totalSp: string;
  teamMembers: string;
  workingDays: string;
  utilization: string;
  ganttTitle: string;
  dev: string;
  qa: string;
  ba: string;
  memberBreakdown: string;
  ticketSummary: string;
  backlogTitle: string;
  externalId: string;
  ticketTitle: string;
  sp: string;
  duration: string;
  dates: string;
  devAssignee: string;
  qaAssignee: string;
  baAssignee: string;
  devDays: string;
  qaDays: string;
  baDays: string;
  total: string;
  timeOffs: string;
  available: string;
  assigned: string;
  unassigned: string;
  noAssignment: string;
  devOnly: string;
  qaOnly: string;
  status: string;
  days: string;
}

export function generateSprintReport(
  data: ReportData,
  options: ReportOptions,
  t: ReportTranslations,
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  drawCoverAndSummary(doc, data, options, t);
  drawGanttPage(doc, data, t);
  drawMemberBreakdownPages(doc, data, t);
  drawTicketSummaryPage(doc, data, t);

  if (options.includeBacklog && options.backlogTicketIds.length > 0) {
    drawBacklogPage(doc, data, options, t);
  }

  return doc;
}

function drawCoverAndSummary(
  doc: jsPDF,
  data: ReportData,
  options: ReportOptions,
  t: ReportTranslations,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(data.projectName, centerX, 60, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const sprintNames = data.sprints.map((s) => s.name).join(", ");
  doc.text(sprintNames, centerX, 85, { align: "center" });

  const dateRange = `${formatDate(data.sprints[0].startDate)} — ${formatDate(data.sprints[data.sprints.length - 1].endDate)}`;
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(dateRange, centerX, 105, { align: "center" });

  doc.setFontSize(8);
  doc.text(
    `${t.generated}: ${format(new Date(data.generatedAt), "dd.MM.yyyy HH:mm")}`,
    centerX,
    120,
    { align: "center" },
  );

  const stats = computeStats(data, options);

  const cardY = 150;
  const cardWidth = 160;
  const cardHeight = 55;
  const gap = 16;
  const totalCardsWidth = cardWidth * 3 + gap * 2;
  const startX = centerX - totalCardsWidth / 2;

  const cards = [
    {
      label: t.totalTickets,
      value: String(stats.totalTickets),
      sub: `${stats.assignedTickets} ${t.assigned} / ${stats.unassignedTickets} ${t.unassigned}`,
    },
    {
      label: t.totalSp,
      value: String(stats.totalSp),
      sub: `${stats.assignedSp} ${t.assigned} / ${stats.unassignedSp} ${t.unassigned}`,
    },
    {
      label: t.teamMembers,
      value: String(stats.devCount + stats.qaCount),
      sub: `${stats.devCount} DEV / ${stats.qaCount} QA`,
    },
  ];

  cards.forEach((card, i) => {
    const x = startX + i * (cardWidth + gap);
    doc.setFillColor(248, 248, 250);
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 4, 4, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(card.label, x + cardWidth / 2, cardY + 15, { align: "center" });

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(card.value, x + cardWidth / 2, cardY + 35, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text(card.sub, x + cardWidth / 2, cardY + 48, { align: "center" });
  });

  const row2Y = cardY + cardHeight + gap;
  const row2Cards = [
    {
      label: t.workingDays,
      value: String(stats.totalWorkingDays),
      sub: dateRange,
    },
    {
      label: t.utilization,
      value: `${stats.utilization}%`,
      sub: `${stats.totalAssignedDays} / ${stats.totalAvailableDays} ${t.days}`,
    },
  ];

  const row2Width = cardWidth * 2 + gap;
  const row2StartX = centerX - row2Width / 2;

  row2Cards.forEach((card, i) => {
    const x = row2StartX + i * (cardWidth + gap);
    doc.setFillColor(248, 248, 250);
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, row2Y, cardWidth, cardHeight, 4, 4, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(card.label, x + cardWidth / 2, row2Y + 15, { align: "center" });

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(card.value, x + cardWidth / 2, row2Y + 35, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text(card.sub, x + cardWidth / 2, row2Y + 48, { align: "center" });
  });
}

function drawGanttPage(doc: jsPDF, data: ReportData, t: ReportTranslations) {
  doc.addPage("landscape");
  const margin = 20;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(t.ganttTitle, margin, margin + 10);

  drawGanttChart(
    doc,
    margin + 18,
    data.sprints,
    data.members,
    data.assignments,
    data.timeOffs,
    { dev: t.dev, qa: t.qa, ba: t.ba },
  );
}

function drawMemberBreakdownPages(
  doc: jsPDF,
  data: ReportData,
  t: ReportTranslations,
) {
  doc.addPage("landscape");
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(t.memberBreakdown, margin, margin + 10);

  const allDays = data.sprints.length > 0
    ? generateDayColumns(
        new Date(data.sprints[0].startDate),
        new Date(data.sprints[data.sprints.length - 1].endDate),
      )
    : [];

  const timeOffMap = new Map<string, Set<string>>();
  for (const to of data.timeOffs) {
    if (!timeOffMap.has(to.userId)) timeOffMap.set(to.userId, new Set());
    timeOffMap.get(to.userId)!.add(toDateKey(new Date(to.date)));
  }

  let startY = margin + 22;

  for (const member of data.members) {
    const memberAssignments = data.assignments.filter(
      (a) => a.userId === member.id,
    );

    const memberTimeOffs = timeOffMap.get(member.id) ?? new Set();
    const timeOffDays = allDays.filter(
      (d) => !isWeekend(d) && memberTimeOffs.has(toDateKey(d)),
    ).length;
    const totalWorkingDays = allDays.filter((d) => !isWeekend(d)).length;
    const availableDays = totalWorkingDays - timeOffDays;
    const assignedDays = memberAssignments.reduce(
      (sum, a) => sum + a.durationDays,
      0,
    );

    const uniqueTickets = new Map<string, ReportAssignment>();
    for (const a of memberAssignments) {
      if (!uniqueTickets.has(a.ticketId)) uniqueTickets.set(a.ticketId, a);
    }

    const totalSp = [...uniqueTickets.values()].reduce(
      (sum, a) => sum + a.storyPoints,
      0,
    );

    if (startY > 360) {
      doc.addPage("landscape");
      startY = margin;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(
      `${member.name} (${member.role})`,
      margin,
      startY + 4,
    );

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const statsText = `SP: ${totalSp} | ${t.assigned}: ${assignedDays}${t.days} | ${t.available}: ${availableDays}${t.days} | ${t.timeOffs}: ${timeOffDays}${t.days}`;
    doc.text(statsText, margin + 200, startY + 4);

    startY += 10;

    if (memberAssignments.length > 0) {
      const urlsByRow = memberAssignments.map((a) => a.ticketExternalUrl);

      const tableData = memberAssignments.map((a) => {
        const start = formatDate(a.startDate);
        return [
          a.ticketExternalId ?? "-",
          a.ticketTitle,
          String(a.storyPoints),
          String(a.durationDays),
          `${start}`,
          a.type,
        ];
      });

      autoTable(doc, {
        head: [[t.externalId, t.ticketTitle, t.sp, t.duration, t.dates, "Type"]],
        body: tableData,
        startY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 6.5, cellPadding: 3 },
        headStyles: {
          fillColor: [240, 240, 245],
          textColor: [60, 60, 60],
          fontStyle: "bold",
        },
        tableWidth: pageWidth - margin * 2,
        columnStyles: {
          0: { cellWidth: 70 },
          2: { cellWidth: 30, halign: "center" },
          3: { cellWidth: 40, halign: "center" },
          5: { cellWidth: 35, halign: "center" },
        },
        didParseCell: (hookData) => {
          if (hookData.section === "body" && hookData.column.index === 0) {
            const url = urlsByRow[hookData.row.index];
            if (url) {
              hookData.cell.styles.textColor = [37, 99, 235];
            }
          }
        },
        didDrawCell: (hookData) => {
          if (hookData.section === "body" && hookData.column.index === 0) {
            const url = urlsByRow[hookData.row.index];
            if (url) {
              addCellLink(doc, hookData.cell, url);
            }
          }
        },
      });

      startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    } else {
      startY += 6;
    }
  }
}

function drawTicketSummaryPage(
  doc: jsPDF,
  data: ReportData,
  t: ReportTranslations,
) {
  doc.addPage("landscape");
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(t.ticketSummary, margin, margin + 10);

  const ticketMap = new Map<
    string,
    {
      externalId: string | null;
      externalUrl: string | null;
      title: string;
      sp: number;
      devAssignee: string;
      qaAssignee: string;
      baAssignee: string;
      devDays: number;
      qaDays: number;
      baDays: number;
    }
  >();

  const memberNameMap = new Map<string, string>();
  for (const m of data.members) memberNameMap.set(m.id, m.name);

  for (const a of data.assignments) {
    if (!ticketMap.has(a.ticketId)) {
      ticketMap.set(a.ticketId, {
        externalId: a.ticketExternalId,
        externalUrl: a.ticketExternalUrl,
        title: a.ticketTitle,
        sp: a.storyPoints,
        devAssignee: "",
        qaAssignee: "",
        baAssignee: "",
        devDays: 0,
        qaDays: 0,
        baDays: 0,
      });
    }
    const entry = ticketMap.get(a.ticketId)!;
    const assigneeName = memberNameMap.get(a.userId) ?? "?";
    if (a.type === "DEV") {
      entry.devAssignee = assigneeName;
      entry.devDays = a.durationDays;
    } else if (a.type === "QA") {
      entry.qaAssignee = assigneeName;
      entry.qaDays = a.durationDays;
    } else {
      entry.baAssignee = assigneeName;
      entry.baDays = a.durationDays;
    }
  }

  const ticketEntries = [...ticketMap.values()];
  const summaryUrlsByRow = ticketEntries.map((e) => e.externalUrl);

  const rows = ticketEntries.map((t) => [
    t.externalId ?? "-",
    t.title,
    String(t.sp),
    t.devAssignee || "-",
    t.qaAssignee || "-",
    t.baAssignee || "-",
    String(t.devDays),
    String(t.qaDays),
    String(t.baDays),
  ]);

  const totalSp = [...ticketMap.values()].reduce((s, x) => s + x.sp, 0);
  const totalDevDays = [...ticketMap.values()].reduce(
    (s, x) => s + x.devDays,
    0,
  );
  const totalQaDays = [...ticketMap.values()].reduce(
    (s, x) => s + x.qaDays,
    0,
  );
  const totalBaDays = [...ticketMap.values()].reduce(
    (s, x) => s + x.baDays,
    0,
  );

  rows.push([
    "",
    t.total,
    String(totalSp),
    "",
    "",
    "",
    String(totalDevDays),
    String(totalQaDays),
    String(totalBaDays),
  ]);

  autoTable(doc, {
    head: [
      [
        t.externalId,
        t.ticketTitle,
        t.sp,
        t.devAssignee,
        t.qaAssignee,
        t.baAssignee,
        t.devDays,
        t.qaDays,
        t.baDays,
      ],
    ],
    body: rows,
    startY: margin + 22,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: {
      fillColor: [240, 240, 245],
      textColor: [60, 60, 60],
      fontStyle: "bold",
    },
    tableWidth: pageWidth - margin * 2,
    columnStyles: {
      0: { cellWidth: 70 },
      2: { cellWidth: 30, halign: "center" },
      5: { cellWidth: 45, halign: "center" },
      6: { cellWidth: 45, halign: "center" },
    },
    didParseCell: (hookData) => {
      if (hookData.row.index === rows.length - 1) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [245, 245, 248];
      }
      if (hookData.section === "body" && hookData.column.index === 0) {
        const url = summaryUrlsByRow[hookData.row.index];
        if (url) {
          hookData.cell.styles.textColor = [37, 99, 235];
        }
      }
    },
    didDrawCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 0) {
        const url = summaryUrlsByRow[hookData.row.index];
        if (url) {
          addCellLink(doc, hookData.cell, url);
        }
      }
    },
  });
}

function drawBacklogPage(
  doc: jsPDF,
  data: ReportData,
  options: ReportOptions,
  t: ReportTranslations,
) {
  doc.addPage("landscape");
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(t.backlogTitle, margin, margin + 10);

  const selectedBacklog = data.backlog.filter((ticket) =>
    options.backlogTicketIds.includes(ticket.id),
  );

  const backlogUrlsByRow = selectedBacklog.map((t) => t.externalUrl);

  const rows = selectedBacklog.map((ticket) => [
    ticket.externalId ?? "-",
    ticket.title,
    String(ticket.storyPoints),
    getBacklogStatus(ticket, t),
  ]);

  const totalSp = selectedBacklog.reduce((s, x) => s + x.storyPoints, 0);
  rows.push(["", t.total, String(totalSp), ""]);

  autoTable(doc, {
    head: [[t.externalId, t.ticketTitle, t.sp, t.status]],
    body: rows,
    startY: margin + 22,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: {
      fillColor: [240, 240, 245],
      textColor: [60, 60, 60],
      fontStyle: "bold",
    },
    tableWidth: pageWidth - margin * 2,
    columnStyles: {
      0: { cellWidth: 80 },
      2: { cellWidth: 40, halign: "center" },
      3: { cellWidth: 100 },
    },
    didParseCell: (hookData) => {
      if (hookData.row.index === rows.length - 1) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [245, 245, 248];
      }
      if (hookData.section === "body" && hookData.column.index === 0) {
        const url = backlogUrlsByRow[hookData.row.index];
        if (url) {
          hookData.cell.styles.textColor = [37, 99, 235];
        }
      }
    },
    didDrawCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 0) {
        const url = backlogUrlsByRow[hookData.row.index];
        if (url) {
          addCellLink(doc, hookData.cell, url);
        }
      }
    },
  });
}

function getBacklogStatus(
  ticket: ReportBacklogTicket,
  t: ReportTranslations,
): string {
  const parts: string[] = [];
  if (ticket.hasDevAssignment) parts.push("DEV");
  if (ticket.hasQaAssignment) parts.push("QA");
  if (ticket.hasBaAssignment) parts.push("BA");
  if (parts.length === 0) return t.noAssignment;
  if (parts.length >= 2 && ticket.hasDevAssignment && ticket.hasQaAssignment) return t.assigned;
  return parts.join("+");
}

function computeStats(data: ReportData, options: ReportOptions) {
  const assignedTicketIds = new Set(data.assignments.map((a) => a.ticketId));

  const assignedTickets = data.backlog.filter((t) =>
    assignedTicketIds.has(t.id) || (t.hasDevAssignment && t.hasQaAssignment),
  );
  const unassignedTickets = data.backlog.filter(
    (t) => !assignedTicketIds.has(t.id) && !(t.hasDevAssignment && t.hasQaAssignment),
  );

  const assignedSp = assignedTickets.reduce((s, t) => s + t.storyPoints, 0);
  const unassignedSp = unassignedTickets.reduce(
    (s, t) => s + t.storyPoints,
    0,
  );

  const devMembers = data.members.filter((m) => m.role === "DEV");
  const qaMembers = data.members.filter((m) => m.role === "QA");
  const baMembers = data.members.filter((m) => m.role === "BA");

  const allDays =
    data.sprints.length > 0
      ? generateDayColumns(
          new Date(data.sprints[0].startDate),
          new Date(data.sprints[data.sprints.length - 1].endDate),
        )
      : [];

  const totalWorkingDays = allDays.filter((d) => !isWeekend(d)).length;

  const timeOffMap = new Map<string, Set<string>>();
  for (const to of data.timeOffs) {
    if (!timeOffMap.has(to.userId)) timeOffMap.set(to.userId, new Set());
    timeOffMap.get(to.userId)!.add(toDateKey(new Date(to.date)));
  }

  let totalAvailableDays = 0;
  for (const m of data.members) {
    const offs = timeOffMap.get(m.id);
    const memberOffDays = offs
      ? allDays.filter(
          (d) => !isWeekend(d) && offs.has(toDateKey(d)),
        ).length
      : 0;
    totalAvailableDays += totalWorkingDays - memberOffDays;
  }

  const totalAssignedDays = data.assignments.reduce(
    (s, a) => s + a.durationDays,
    0,
  );

  const utilization =
    totalAvailableDays > 0
      ? Math.round((totalAssignedDays / totalAvailableDays) * 100)
      : 0;

  return {
    totalTickets: data.backlog.length,
    assignedTickets: assignedTickets.length,
    unassignedTickets: unassignedTickets.length,
    totalSp: assignedSp + unassignedSp,
    assignedSp,
    unassignedSp,
    devCount: devMembers.length,
    qaCount: qaMembers.length,
    baCount: baMembers.length,
    totalWorkingDays,
    totalAvailableDays,
    totalAssignedDays,
    utilization,
  };
}

function addCellLink(
  doc: jsPDF,
  cell: { x: number; y: number; width: number; height: number },
  url: string,
) {
  doc.link(cell.x, cell.y, cell.width, cell.height, { url });
}

function formatDate(iso: string): string {
  return format(new Date(iso), "dd.MM.yyyy");
}
