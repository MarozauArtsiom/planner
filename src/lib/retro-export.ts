import Papa from "papaparse";
import type { RetroBoardState } from "@/hooks/use-retro-polling";

/**
 * Формирует структурированный Markdown-отчёт по итогам ретроспективы
 * для быстрого копирования в буфер обмена (Confluence / Notion / Slack / GitHub).
 */
export function formatRetroMarkdown(state: RetroBoardState): string {
  const lines: string[] = [];
  const dateStr = new Date(state.board.createdAt).toLocaleDateString("en-CA");

  lines.push(`# ${state.board.title}`);
  lines.push(
    `**Project:** ${state.board.projectName} | **Date:** ${dateStr}${
      state.sprintContext ? ` | **Sprint:** ${state.sprintContext.name}` : ""
    }`,
  );
  lines.push("");

  // Колонки, группы и карточки
  for (const col of state.columns) {
    lines.push(`## ${col.title}`);
    const colGroups = state.groups
      .filter((g) => g.columnId === col.id)
      .sort((a, b) => b.totalVotes - a.totalVotes);
    const ungroupedCards = state.cards
      .filter((c) => c.columnId === col.id && !c.groupId && !c.isBlurred)
      .sort((a, b) => b.totalVotes - a.totalVotes);

    if (colGroups.length === 0 && ungroupedCards.length === 0) {
      lines.push("_No cards_");
      lines.push("");
      continue;
    }

    for (const grp of colGroups) {
      const grpCards = state.cards.filter(
        (c) => c.groupId === grp.id && !c.isBlurred,
      );
      const votesTag = grp.totalVotes > 0 ? ` (+${grp.totalVotes})` : "";
      lines.push(`- **[Group] ${grp.title}**${votesTag}`);
      for (const c of grpCards) {
        const authorTag = c.authorName ? ` _(${c.authorName})_` : "";
        lines.push(`  - ${c.content}${authorTag}`);
      }
    }

    for (const c of ungroupedCards) {
      const votesTag = c.totalVotes > 0 ? ` (+${c.totalVotes})` : "";
      const authorTag = c.authorName ? ` _(${c.authorName})_` : "";
      lines.push(`- ${c.content}${votesTag}${authorTag}`);
    }
    lines.push("");
  }

  // Action Items
  lines.push("## Action Items");
  if (state.actionItems.length === 0) {
    lines.push("_No action items recorded_");
  } else {
    for (const item of state.actionItems) {
      const check = item.status === "DONE" ? "[x]" : "[ ]";
      const metaParts: string[] = [];
      if (item.assigneeName) metaParts.push(`@${item.assigneeName}`);
      if (item.dueDate) {
        metaParts.push(`due ${new Date(item.dueDate).toLocaleDateString("en-CA")}`);
      }
      if (item.ticketTitle) metaParts.push(`Ticket: ${item.ticketTitle}`);
      const meta = metaParts.length > 0 ? ` (${metaParts.join(" · ")})` : "";
      lines.push(`- ${check} ${item.title}${meta}`);
    }
  }

  if (state.carryOverItems.length > 0) {
    lines.push("");
    lines.push("## Previous Action Items (Carry-Over)");
    for (const item of state.carryOverItems) {
      const check = item.status === "DONE" ? "[x]" : "[ ]";
      const owner = item.assigneeName ? ` (@${item.assigneeName})` : "";
      lines.push(`- ${check} ${item.title}${owner} _[${item.fromBoardTitle}]_`);
    }
  }

  return lines.join("\n");
}

/**
 * Экспорт карточек и Action Items ретро-доски в CSV.
 */
export function downloadRetroCsv(state: RetroBoardState): void {
  const colMap = new Map(state.columns.map((c) => [c.id, c.title]));
  const groupMap = new Map(state.groups.map((g) => [g.id, g.title]));

  const rows: Record<string, string | number>[] = [];

  for (const card of state.cards) {
    if (card.isBlurred) continue;
    rows.push({
      Type: "Card",
      Column: colMap.get(card.columnId) ?? "",
      Group: card.groupId ? (groupMap.get(card.groupId) ?? "") : "",
      Content: card.content,
      Votes: card.totalVotes,
      Author: card.authorName ?? "Anonymous",
      Status: "",
      Assignee: "",
      DueDate: "",
    });
  }

  for (const action of state.actionItems) {
    rows.push({
      Type: "Action Item",
      Column: "Actions",
      Group: "",
      Content: action.title,
      Votes: "",
      Author: "",
      Status: action.status,
      Assignee: action.assigneeName ?? "",
      DueDate: action.dueDate
        ? new Date(action.dueDate).toLocaleDateString("en-CA")
        : "",
    });
  }

  const csv = Papa.unparse(rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = state.board.title
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "");
  a.href = url;
  a.download = `retro-${slug || "board"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
