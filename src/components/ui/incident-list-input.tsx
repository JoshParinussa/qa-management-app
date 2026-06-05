"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseIncidents, syncIncidentItemsToCount, type IncidentItem } from "@/lib/reports/incidents";

export type { IncidentItem };

type IncidentListInputProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  count?: number;
  onCountChange?: (count: number) => void;
  error?: string;
  rowErrors?: Record<string, string>;
};

export function IncidentListInput({ name, label, defaultValue, count, onCountChange, error, rowErrors }: IncidentListInputProps) {
  const [items, setItems] = useState<IncidentItem[]>(() => {
    const parsed = parseIncidents(defaultValue);
    if (count !== undefined) return syncIncidentItemsToCount(parsed, count);
    return parsed.length > 0 ? parsed : [{ title: "", description: "", relatedTestCaseId: "" }];
  });

  const hasIncidentError =
    Boolean(error) || Object.keys(rowErrors ?? {}).some((key) => key.startsWith(`${name}.`));

  const visibleItems = count === undefined ? items : syncIncidentItemsToCount(items, count);

  const cleaned = visibleItems
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      relatedTestCaseId: item.relatedTestCaseId.trim(),
    }))
    .filter((item) => item.title || item.description || item.relatedTestCaseId);

  function update(index: number, key: keyof IncidentItem, value: string) {
    setItems((prev) => {
      const base = count === undefined ? prev : syncIncidentItemsToCount(prev, count);
      return base.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    });
  }

  function addItem() {
    setItems((prev) => {
      const base = count === undefined ? prev : syncIncidentItemsToCount(prev, count);
      const next = [...base, { title: "", description: "", relatedTestCaseId: "" }];
      onCountChange?.(next.length);
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => {
      const base = count === undefined ? prev : syncIncidentItemsToCount(prev, count);
      const next = base.filter((_, i) => i !== index);
      onCountChange?.(next.length);
      return count === undefined && next.length === 0 ? [{ title: "", description: "", relatedTestCaseId: "" }] : next;
    });
  }

  function RequiredMark() {
    return <span className="text-destructive">*</span>;
  }

  const isMissing = (value: string) => hasIncidentError && !value.trim();

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <input type="hidden" name={name} value={cleaned.length > 0 ? JSON.stringify(cleaned) : ""} />
      {hasIncidentError ? (
        <p className="text-xs text-destructive">
          {error ?? "Lengkapi title, description, dan related test case ID untuk tiap incident yang ditandai."}
        </p>
      ) : null}
      <div className="space-y-3">
        {visibleItems.map((item, index) => {
          const rowInvalid = hasIncidentError && (!item.title.trim() || !item.description.trim() || !item.relatedTestCaseId.trim());
          return (
          <div key={index} className={rowInvalid ? "space-y-2 rounded-lg border border-destructive/60 bg-destructive/5 p-3" : "space-y-2 rounded-lg border border-border p-3"}>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor={`incidentTitle${index}`}>Incident title <RequiredMark /></Label>
                <Input
                  id={`incidentTitle${index}`}
                  value={item.title}
                  onChange={(e) => update(index, "title", e.target.value)}
                  placeholder="Incident title"
                  aria-label={`Incident title ${index + 1}`}
                  aria-invalid={isMissing(item.title) ? true : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`incidentRelatedTestCase${index}`}>Related test case ID <RequiredMark /></Label>
                <Input
                  id={`incidentRelatedTestCase${index}`}
                  value={item.relatedTestCaseId}
                  onChange={(e) => update(index, "relatedTestCaseId", e.target.value)}
                  placeholder="TC-001"
                  aria-label={`Related test case ID ${index + 1}`}
                  aria-invalid={isMissing(item.relatedTestCaseId) ? true : undefined}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end"
                onClick={() => removeItem(index)}
                aria-label={`Remove incident ${index + 1}`}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`incidentDescription${index}`}>Incident description <RequiredMark /></Label>
              <Textarea
                id={`incidentDescription${index}`}
                value={item.description}
                onChange={(e) => update(index, "description", e.target.value)}
                placeholder="Incident description"
                aria-label={`Incident description ${index + 1}`}
                aria-invalid={isMissing(item.description) ? true : undefined}
              />
            </div>
          </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="size-4" />
        Add incident
      </Button>
    </div>
  );
}
