import * as XLSX from "xlsx";

const SPECIAL_COLUMNS = new Set([
  "phone_number",
  "language",
  "voice_id",
  "first_message",
  "prompt",
  "system_prompt",
]);

export type ParsedBatchRecipient = {
  rowNumber: number;
  phoneNumber: string;
  language: string | null;
  voiceId: string | null;
  firstMessage: string | null;
  systemPrompt: string | null;
  dynamicVariables: Record<string, string>;
};

export type InvalidBatchRecipient = {
  rowNumber: number;
  phoneNumber: string;
  error: string;
  raw: Record<string, string>;
};

export type BatchParseResult = {
  headers: string[];
  validRows: ParsedBatchRecipient[];
  invalidRows: InvalidBatchRecipient[];
};

export function parseBatchRecipients(
  data: Buffer,
  fileName: string
): BatchParseResult {
  const workbook = XLSX.read(data, {
    type: "buffer",
    raw: false,
    cellDates: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Recipient file does not contain a worksheet");
  }

  const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName]!, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  const headerRow = rows[0] ?? [];
  const headers = headerRow.map((value) => normalizeHeader(value));
  if (!headers.includes("phone_number")) {
    throw new Error("Recipient file must include a phone_number column");
  }

  const validRows: ParsedBatchRecipient[] = [];
  const invalidRows: InvalidBatchRecipient[] = [];

  rows.slice(1).forEach((row, index) => {
    const raw = rowToRecord(headers, row);
    if (isEmptyRecord(raw)) return;

    const rowNumber = index + 2;
    const phoneNumber = raw.phone_number ?? "";
    if (!phoneNumber.trim()) {
      invalidRows.push({
        rowNumber,
        phoneNumber,
        error: "phone_number is required",
        raw,
      });
      return;
    }

    if (phoneNumber.trim().length < 10) {
      invalidRows.push({
        rowNumber,
        phoneNumber,
        error: "phone_number must be at least 10 digits",
        raw,
      });
      return;
    }

    validRows.push({
      rowNumber,
      phoneNumber: phoneNumber.trim(),
      language: nullableTrim(raw.language),
      voiceId: nullableTrim(raw.voice_id),
      firstMessage: nullableTrim(raw.first_message),
      systemPrompt: nullableTrim(raw.prompt) ?? nullableTrim(raw.system_prompt),
      dynamicVariables: buildDynamicVariables(raw),
    });
  });

  return { headers, validRows, invalidRows };
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function rowToRecord(headers: string[], row: string[]) {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    if (!header) return;
    record[header] = String(row[index] ?? "").trim();
  });
  return record;
}

function isEmptyRecord(record: Record<string, string>) {
  return Object.values(record).every((value) => value.length === 0);
}

function nullableTrim(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function buildDynamicVariables(raw: Record<string, string>) {
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (SPECIAL_COLUMNS.has(key) || !value) continue;
    variables[key] = value;
  }
  return variables;
}
