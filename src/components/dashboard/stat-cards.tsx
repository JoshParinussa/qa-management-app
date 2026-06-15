import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type StatCard = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: "blue" | "amber" | "red" | "green" | "slate";
  subtitle?: string;
};

const colorClasses = {
  blue: "text-blue-600 bg-blue-50",
  amber: "text-amber-600 bg-amber-50",
  red: "text-red-600 bg-red-50",
  green: "text-green-600 bg-green-50",
  slate: "text-slate-600 bg-slate-50",
};

export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const color = card.color ?? "slate";
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              <div className={`flex size-8 items-center justify-center rounded-lg ${colorClasses[color]}`}>
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{card.value}</p>
              {card.subtitle ? (
                <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
