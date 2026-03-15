import Papa from "papaparse";

export interface TicketInput {
  externalId: string | null;
  title: string;
  externalUrl: string | null;
  description: string | null;
  acceptanceCriteria: string | null;
}

export interface ParsedRow extends TicketInput {
  _rowIndex: number;
  _error?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  validCount: number;
  errorCount: number;
}

const KNOWN_COLUMNS = [
  "externalId",
  "title",
  "externalUrl",
  "description",
  "acceptanceCriteria",
] as const;

const COLUMN_ALIASES: Record<string, (typeof KNOWN_COLUMNS)[number]> = {
  externalid: "externalId",
  id: "externalId",
  key: "externalId",
  "ticket id": "externalId",
  "ticket key": "externalId",
  title: "title",
  summary: "title",
  name: "title",
  externalurl: "externalUrl",
  url: "externalUrl",
  link: "externalUrl",
  description: "description",
  desc: "description",
  acceptancecriteria: "acceptanceCriteria",
  "acceptance criteria": "acceptanceCriteria",
  ac: "acceptanceCriteria",
  criteria: "acceptanceCriteria",
};

function normalizeHeader(raw: string): (typeof KNOWN_COLUMNS)[number] | null {
  const key = raw.trim().toLowerCase().replace(/[_\-]/g, " ");
  return COLUMN_ALIASES[key] ?? null;
}

function looksLikeHeader(firstRow: string[]): boolean {
  const matched = firstRow.filter((cell) => normalizeHeader(cell) !== null);
  return matched.length >= 1 && firstRow.some((c) => normalizeHeader(c) === "title");
}

export function parseTicketsCsv(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  const parsed = Papa.parse<string[]>(trimmed, {
    header: false,
    skipEmptyLines: true,
    delimiter: "",
  });

  const rawRows = parsed.data;
  if (rawRows.length === 0) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  let columnMap: Map<number, (typeof KNOWN_COLUMNS)[number]>;
  let dataStartIndex: number;

  if (looksLikeHeader(rawRows[0])) {
    columnMap = new Map();
    rawRows[0].forEach((cell, i) => {
      const mapped = normalizeHeader(cell);
      if (mapped) columnMap.set(i, mapped);
    });
    dataStartIndex = 1;
  } else {
    columnMap = new Map();
    const defaults: (typeof KNOWN_COLUMNS)[number][] = [
      "externalId",
      "title",
      "externalUrl",
      "description",
      "acceptanceCriteria",
    ];
    const colCount = Math.min(rawRows[0].length, defaults.length);
    for (let i = 0; i < colCount; i++) {
      columnMap.set(i, defaults[i]);
    }
    dataStartIndex = 0;
  }

  if (!Array.from(columnMap.values()).includes("title")) {
    const singleRows: ParsedRow[] = rawRows.slice(dataStartIndex).map((cells, i) => ({
      externalId: null,
      title: cells[0]?.trim() || "",
      externalUrl: null,
      description: null,
      acceptanceCriteria: null,
      _rowIndex: i + dataStartIndex + 1,
      _error: cells[0]?.trim() ? undefined : "Название тикета обязательно",
    }));

    return {
      rows: singleRows,
      validCount: singleRows.filter((r) => !r._error).length,
      errorCount: singleRows.filter((r) => !!r._error).length,
    };
  }

  const rows: ParsedRow[] = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const cells = rawRows[i];
    const row: Record<string, string | null> = {};

    columnMap.forEach((field, colIdx) => {
      const val = cells[colIdx]?.trim() || null;
      row[field] = val;
    });

    const title = row.title || "";
    const error = title ? undefined : "Название тикета обязательно";

    rows.push({
      externalId: row.externalId || null,
      title,
      externalUrl: row.externalUrl || null,
      description: row.description || null,
      acceptanceCriteria: row.acceptanceCriteria || null,
      _rowIndex: i + 1,
      _error: error,
    });
  }

  return {
    rows,
    validCount: rows.filter((r) => !r._error).length,
    errorCount: rows.filter((r) => !!r._error).length,
  };
}
