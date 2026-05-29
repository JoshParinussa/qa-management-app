import { z } from "zod";

export const assignmentRoles = ["QA_MEMBER", "QA_PIC"] as const;

export const assignMemberSchema = z.object({
  userId: z.uuid(),
  assignmentRole: z.enum(assignmentRoles).default("QA_MEMBER"),
});

export type AssignMemberInput = z.infer<typeof assignMemberSchema>;
