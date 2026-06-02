import { z } from "zod";
import { parseIncidents } from "@/lib/reports/incidents";

export const weeklyReportSchema = z
  .object({
    projectId: z.uuid(),
    weekStartDate: z.coerce.date(),
    weekEndDate: z.coerce.date(),
    summary: z.string().min(1),
    productionIncidentCount: z.number().int().min(0).default(0),
    productionIncidentNotes: z.string().optional(),
    bugDocumentUrl: z.url().optional().or(z.literal("")),
    testCaseTotal: z.number().int().min(0).optional(),
    testCaseBeTotal: z.number().int().min(0).default(0),
    testCaseBeExecuted: z.number().int().min(0).default(0),
    testCaseFeTotal: z.number().int().min(0).default(0),
    testCaseFeExecuted: z.number().int().min(0).default(0),
    automationBeTotal: z.number().int().min(0).default(0),
    automationFeTotal: z.number().int().min(0).default(0),
    automationBePassed: z.number().int().min(0).optional(),
    automationBeFailed: z.number().int().min(0).optional(),
    automationFePassed: z.number().int().min(0).optional(),
    automationFeFailed: z.number().int().min(0).optional(),
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
  .refine((data) => data.automationBeTotal <= data.testCaseBeTotal, {
    message: "BE automation total cannot exceed BE total test cases",
    path: ["automationBeTotal"],
  })
  .refine((data) => data.automationFeTotal <= data.testCaseFeTotal, {
    message: "FE automation total cannot exceed FE total test cases",
    path: ["automationFeTotal"],
  })
  .refine((data) => (data.automationBePassed ?? 0) + (data.automationBeFailed ?? 0) <= data.automationBeTotal, {
    message: "BE automation passed and failed runs cannot exceed BE automation total",
    path: ["automationBePassed"],
  })
  .refine((data) => (data.automationFePassed ?? 0) + (data.automationFeFailed ?? 0) <= data.automationFeTotal, {
    message: "FE automation passed and failed runs cannot exceed FE automation total",
    path: ["automationFePassed"],
  })
  .refine((data) => data.automationPassed + data.automationFailed <= data.automationBeTotal + data.automationFeTotal, {
    message: "Automation passed and failed runs cannot exceed automation total",
    path: ["automationPassed"],
  })
  .superRefine((data, ctx) => {
    if (data.productionIncidentCount <= 0) return;

    const incidents = parseIncidents(data.productionIncidentNotes);

    if (incidents.length < data.productionIncidentCount) {
      ctx.addIssue({
        code: "custom",
        path: ["productionIncidentNotes"],
        message: "Incident detail wajib diisi sesuai jumlah production incident.",
      });
      return;
    }

    incidents.slice(0, data.productionIncidentCount).forEach((incident, index) => {
      if (!incident.title || !incident.description || !incident.relatedTestCaseId) {
        ctx.addIssue({
          code: "custom",
          path: ["productionIncidentNotes", index],
          message: "Title, description, dan related test case ID wajib diisi untuk setiap incident.",
        });
      }
    });
  });

export type WeeklyReportInput = z.infer<typeof weeklyReportSchema>;
