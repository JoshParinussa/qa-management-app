import { z } from "zod";

export const weeklyReportSchema = z
  .object({
    projectId: z.uuid(),
    weekStartDate: z.coerce.date(),
    weekEndDate: z.coerce.date(),
    summary: z.string().min(1),
    productionIncidentCount: z.number().int().min(0).default(0),
    productionIncidentNotes: z.string().optional(),
    bugDocumentUrl: z.url().optional().or(z.literal("")),
    testCaseBeTotal: z.number().int().min(0).default(0),
    testCaseBeExecuted: z.number().int().min(0).default(0),
    testCaseFeTotal: z.number().int().min(0).default(0),
    testCaseFeExecuted: z.number().int().min(0).default(0),
    automationBeTotal: z.number().int().min(0).default(0),
    automationFeTotal: z.number().int().min(0).default(0),
    automationPassed: z.number().int().min(0).default(0),
    automationFailed: z.number().int().min(0).default(0),
    blocker: z.string().optional(),
    nextWeekPlan: z.string().min(1),
    notes: z.string().optional(),
  })
  .refine((data) => data.weekStartDate < data.weekEndDate, {
    message: "Week start date must be before week end date",
    path: ["weekEndDate"],
  })
  .refine((data) => data.testCaseBeExecuted <= data.testCaseBeTotal, {
    message: "BE executed test cases cannot exceed BE total",
    path: ["testCaseBeExecuted"],
  })
  .refine((data) => data.testCaseFeExecuted <= data.testCaseFeTotal, {
    message: "FE executed test cases cannot exceed FE total",
    path: ["testCaseFeExecuted"],
  })
  .refine((data) => data.automationBeTotal + data.automationFeTotal <= data.testCaseBeTotal + data.testCaseFeTotal, {
    message: "Automation total cannot exceed total test cases",
    path: ["automationBeTotal"],
  });

export type WeeklyReportInput = z.infer<typeof weeklyReportSchema>;
