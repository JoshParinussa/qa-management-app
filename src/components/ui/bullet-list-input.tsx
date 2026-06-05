"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseBulletItems, serializeBulletItems } from "@/lib/reports/bullets";

type BulletListInputProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  error?: string;
};

function parseRows(value?: string | null): string[] {
  const rows = parseBulletItems(value);
  return rows.length > 0 ? rows : [""];
}

export function BulletListInput({ name, label, defaultValue, placeholder, required, error }: BulletListInputProps) {
  const [rows, setRows] = useState<string[]>(() => parseRows(defaultValue));
  const labelText = label.trim();
  const errorId = error ? `${name}-error` : undefined;

  const joined = serializeBulletItems(rows);

  function update(index: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? value : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index)));
  }

  return (
    <div className="space-y-2">
      {labelText ? (
        <Label>
          {labelText} {required ? <span className="text-destructive">*</span> : null}
        </Label>
      ) : null}
      <input type="hidden" name={name} value={joined} />
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="select-none text-muted-foreground">•</span>
            <Textarea
              value={row}
              onChange={(e) => update(index, e.target.value)}
              placeholder={placeholder}
              aria-label={`${labelText || name} item ${index + 1}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={index === 0 ? errorId : undefined}
              className="min-h-11 resize-y py-2"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              aria-label={`Remove ${labelText || name} item ${index + 1}`}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="size-4" />
        Add row
      </Button>
    </div>
  );
}
