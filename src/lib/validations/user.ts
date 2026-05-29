import { z } from "zod";
import { roles } from "@/types";

export const userSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  role: z.enum(roles),
  isActive: z.boolean().default(true),
});

export type UserInput = z.infer<typeof userSchema>;
