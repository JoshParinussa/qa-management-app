"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getBreadcrumbItems } from "@/lib/navigation/breadcrumbs";

export function Topbar() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbItems(pathname);

  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("qa-sidebar-toggle"));
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 px-4 lg:px-5">
      <button className="inline-flex size-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100" type="button" aria-label="Toggle sidebar" onClick={toggleSidebar}>
        <PanelLeft className="size-4" />
      </button>
      <div className="h-4 w-px bg-slate-200" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <Fragment key={item.href}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {item.current ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
