import { z } from "zod";
import { projectStatuses, weeklyReportDisabledReasons } from "@/types";

export const projectSchema = z
  .object({
    name: z.string().min(2).max(160),
    code: z.string().min(2).max(24).regex(/^[A-Z0-9_-]+$/),
    description: z.string().max(1000).optional(),
    status: z.enum(projectStatuses).default("ACTIVE"),
    weeklyReportRequired: z.boolean().default(true),
    weeklyReportDisabledReason: z.enum(weeklyReportDisabledReasons).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.weeklyReportRequired) {
      data.weeklyReportDisabledReason = undefined;
      return;
    }

    if (!data.weeklyReportDisabledReason) {
      ctx.addIssue({
        code: "custom",
        path: ["weeklyReportDisabledReason"],
        message: "Reason wajib dipilih jika weekly report tidak diwajibkan.",
      });
    }
  });

export type ProjectInput = z.infer<typeof projectSchema>;
