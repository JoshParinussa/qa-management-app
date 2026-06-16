import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type StatCard = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
};

export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="gap-3 py-5 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pb-0">
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="px-5">
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{card.value}</p>
              {card.subtitle ? (
                <p className="mt-1.5 text-xs text-muted-foreground">{card.subtitle}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
