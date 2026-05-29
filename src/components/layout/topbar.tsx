"use client";

import { ChevronRight, PanelLeft } from "lucide-react";

export function Topbar() {
  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("qa-sidebar-toggle"));
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 px-4 lg:px-5">
      <button className="inline-flex size-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100" type="button" aria-label="Toggle sidebar" onClick={toggleSidebar}>
        <PanelLeft className="size-4" />
      </button>
      <div className="h-4 w-px bg-slate-200" />
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Build your application</span>
        <ChevronRight className="size-4 text-slate-400" />
        <span className="font-medium text-slate-950">Dashboard</span>
      </nav>
    </header>
  );
}
