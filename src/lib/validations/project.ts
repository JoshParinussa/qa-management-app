import { z } from "zod";
import { projectStatuses } from "@/types";

export const projectSchema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().min(2).max(24).regex(/^[A-Z0-9_-]+$/),
  description: z.string().max(1000).optional(),
  status: z.enum(projectStatuses).default("ACTIVE"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
