"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { KVPair } from "@/src/lib/api/types";

interface KVEditorProps {
  value: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
  disableAdd?: boolean;
}

export function KVEditor({
  value,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  disabled = false,
  disableAdd = false,
}: KVEditorProps) {
  const update = (index: number, field: keyof KVPair, text: string) => {
    const next = value.map((pair, i) =>
      i === index ? { ...pair, [field]: text } : pair
    );
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...value, { key: "", value: "" }]);
  };

  return (
    <div className="space-y-2">
      {value.map((pair, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={keyPlaceholder}
            value={pair.key}
            onChange={(e) => update(index, "key", e.target.value)}
            disabled={disabled}
            className="h-9 flex-1 font-mono text-xs"
          />
          <Input
            placeholder={valuePlaceholder}
            value={pair.value}
            onChange={(e) => update(index, "value", e.target.value)}
            disabled={disabled}
            className="h-9 flex-1 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(index)}
            disabled={disabled}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      {!disableAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={add}
          disabled={disabled}
        >
          <Plus className="size-3.5" />
          Add row
        </Button>
      )}
    </div>
  );
}
