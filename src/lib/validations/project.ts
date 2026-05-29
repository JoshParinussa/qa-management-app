import { z } from "zod";
import { projectStatuses } from "@/types";

export const projectSchema = z
  .object({
    name: z.string().min(2).max(160),
    code: z.string().min(2).max(24).regex(/^[A-Z0-9_-]+$/),
    description: z.string().max(1000).optional(),
    status: z.enum(projectStatuses).default("ACTIVE"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type ProjectInput = z.infer<typeof projectSchema>;
