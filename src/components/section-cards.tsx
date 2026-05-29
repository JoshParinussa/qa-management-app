import { IconClipboardCheck, IconClock, IconFolders, IconRotateClockwise } from "@tabler/icons-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardSummary } from "@/lib/dashboard/queries"

export function SectionCards({ summary }: { summary: DashboardSummary }) {
  const cards = [
    { label: "Active Projects", value: summary.activeProjects, icon: IconFolders },
    { label: "Pending Review", value: summary.pendingReview, icon: IconClock },
    { label: "Need Revision", value: summary.needRevision, icon: IconRotateClockwise },
    { label: "Approved", value: summary.approved, icon: IconClipboardCheck },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <card.icon className="size-4" />
              {card.label}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{card.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
