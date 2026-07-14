"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { SecretSelect } from "@/src/components/secrets/SecretSelect";

export type SecretFieldType = "Value" | "Secret";

export type SecretFieldRecord = Record<
  string,
  {
    value: string;
    type: SecretFieldType;
  }
>;

export type SecretFieldRow = {
  id: string;
  key: string;
  value: string;
  type: SecretFieldType;
};

function createRow(): SecretFieldRow {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? [Date.now(), Math.random().toString(36).slice(2)].join("-"),
    key: "",
    value: "",
    type: "Value",
  };
}

function normalizeFieldType(value: unknown): SecretFieldType {
  return value === "Secret" ? "Secret" : "Value";
}

export function rowsForSecretFields(value: unknown): SecretFieldRow[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>).map(([key, entry], index) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const record = entry as Record<string, unknown>;
      return {
        id: `${key}-${index}`,
        key,
        value: typeof record.value === "string" ? record.value : String(record.value ?? ""),
        type: normalizeFieldType(record.type),
      };
    }

    return {
      id: `${key}-${index}`,
      key,
      value: typeof entry === "string" ? entry : String(entry ?? ""),
      type: "Value",
    };
  });
}

export function secretFieldsFromRows(rows: SecretFieldRow[]): SecretFieldRecord {
  const record: SecretFieldRecord = {};
  for (const row of rows) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (!key || !value) continue;
    record[key] = {
      value,
      type: row.type,
    };
  }
  return record;
}

export function secretFieldRecordsEqual(
  a: SecretFieldRecord,
  b: SecretFieldRecord
) {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key, index) => {
    const otherKey = bKeys[index];
    return (
      key === otherKey &&
      a[key]?.value === b[otherKey]?.value &&
      a[key]?.type === b[otherKey]?.type
    );
  });
}

export function WebhookSecretFieldEditor({
  label,
  description,
  rows,
  onChange,
  disabled,
  keyPlaceholder = "Key",
}: {
  label: string;
  description: string;
  rows: SecretFieldRow[];
  onChange: (rows: SecretFieldRow[]) => void;
  disabled?: boolean;
  keyPlaceholder?: string;
}) {
  function updateRow(id: string, patch: Partial<SecretFieldRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([...rows, createRow()]);
  }

  function removeRow(id: string) {
    onChange(rows.filter((row) => row.id !== id));
  }

  return (
    <div className="border border-dashed bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Label>{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid gap-2 lg:grid-cols-[minmax(0,180px)_140px_minmax(0,1fr)_36px]"
            >
              <Input
                aria-label={`${label} key`}
                placeholder={keyPlaceholder}
                value={row.key}
                disabled={disabled}
                onChange={(event) => updateRow(row.id, { key: event.target.value })}
              />
              <Select
                value={row.type}
                disabled={disabled}
                onValueChange={(value) =>
                  updateRow(row.id, { type: normalizeFieldType(value), value: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Value">Value</SelectItem>
                  <SelectItem value="Secret">Secret</SelectItem>
                </SelectContent>
              </Select>
              {row.type === "Secret" ? (
                <SecretSelect
                  value={row.value}
                  onValueChange={(value) => updateRow(row.id, { value })}
                  disabled={disabled}
                />
              ) : (
                <Input
                  aria-label={`${label} value`}
                  placeholder="Value"
                  value={row.value}
                  disabled={disabled}
                  onChange={(event) =>
                    updateRow(row.id, { value: event.target.value })
                  }
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${label} row`}
                onClick={() => removeRow(row.id)}
                disabled={disabled}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No {label.toLowerCase()} configured.
        </p>
      )}
    </div>
  );
}
