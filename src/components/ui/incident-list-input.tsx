"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseIncidents, type IncidentItem } from "@/lib/reports/incidents";

export type { IncidentItem };

type IncidentListInputProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
};

export function IncidentListInput({ name, label, defaultValue }: IncidentListInputProps) {
  const [items, setItems] = useState<IncidentItem[]>(() => {
    const parsed = parseIncidents(defaultValue);
    return parsed.length > 0 ? parsed : [{ title: "", description: "" }];
  });

  const cleaned = items
    .map((item) => ({ title: item.title.trim(), description: item.description.trim() }))
    .filter((item) => item.title || item.description);

  function update(index: number, key: keyof IncidentItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { title: "", description: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length <= 1 ? [{ title: "", description: "" }] : prev.filter((_, i) => i !== index)));
  }

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <input type="hidden" name={name} value={cleaned.length > 0 ? JSON.stringify(cleaned) : ""} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={item.title}
                onChange={(e) => update(index, "title", e.target.value)}
                placeholder="Incident title"
                aria-label={`Incident title ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                aria-label={`Remove incident ${index + 1}`}
              >
                <X className="size-4" />
              </Button>
            </div>
            <Textarea
              value={item.description}
              onChange={(e) => update(index, "description", e.target.value)}
              placeholder="Incident description"
              aria-label={`Incident description ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="size-4" />
        Add incident
      </Button>
    </div>
  );
}
