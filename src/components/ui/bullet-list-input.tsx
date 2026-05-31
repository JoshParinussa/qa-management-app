"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BulletListInputProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
};

function parseRows(value?: string | null): string[] {
  if (!value) return [""];
  const rows = value
    .split("\n")
    .map((r) => r.replace(/^[-•]\s*/, "").trim())
    .filter((r) => r.length > 0);
  return rows.length > 0 ? rows : [""];
}

export function BulletListInput({ name, label, defaultValue, placeholder }: BulletListInputProps) {
  const [rows, setRows] = useState<string[]>(() => parseRows(defaultValue));

  const joined = rows
    .map((r) => r.trim())
    .filter(Boolean)
    .join("\n");

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
      <Label>{label}</Label>
      <input type="hidden" name={name} value={joined} />
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="select-none text-muted-foreground">•</span>
            <Input
              value={row}
              onChange={(e) => update(index, e.target.value)}
              placeholder={placeholder}
              aria-label={`${label} item ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              aria-label={`Remove ${label} item ${index + 1}`}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="size-4" />
        Add row
      </Button>
    </div>
  );
}
