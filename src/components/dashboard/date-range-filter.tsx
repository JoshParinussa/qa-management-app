"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";

type DateRange = {
  start: string;
  end: string;
};

export function DateRangeFilter() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: "",
    end: "",
  });

  return (
    <div className="flex items-center gap-2">
      <Calendar className="size-4 text-slate-500" />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm"
        />
        <span className="text-sm text-slate-500">to</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm"
        />
      </div>
    </div>
  );
}
