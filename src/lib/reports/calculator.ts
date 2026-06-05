type ReportMetricsInput = {
  testCaseTotal?: number | null;
  testCaseBeTotal: number;
  testCaseFeTotal: number;
  testCaseBeExecuted: number;
  testCaseFeExecuted: number;
  automationBeTotal: number;
  automationFeTotal: number;
  automationBePassed?: number | null;
  automationBeFailed?: number | null;
  automationFePassed?: number | null;
  automationFeFailed?: number | null;
  automationPassed: number;
  automationFailed: number;
};

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

export function calculateReportMetrics(input: ReportMetricsInput) {
  const legacyTotalTestCase = input.testCaseBeTotal + input.testCaseFeTotal;
  const totalTestCase = input.testCaseTotal !== undefined && input.testCaseTotal !== null ? input.testCaseTotal : legacyTotalTestCase;
  const totalExecutedTestCase = input.testCaseBeExecuted + input.testCaseFeExecuted;
  const totalAutomation = input.automationBeTotal + input.automationFeTotal;
  const automationBePassed = input.automationBePassed ?? 0;
  const automationBeFailed = input.automationBeFailed ?? 0;
  const automationFePassed = input.automationFePassed ?? 0;
  const automationFeFailed = input.automationFeFailed ?? 0;
  const hasSplitAutomationRun =
    (input.automationBePassed !== undefined && input.automationBePassed !== null) ||
    (input.automationBeFailed !== undefined && input.automationBeFailed !== null) ||
    (input.automationFePassed !== undefined && input.automationFePassed !== null) ||
    (input.automationFeFailed !== undefined && input.automationFeFailed !== null);
  const splitAutomationRun = automationBePassed + automationBeFailed + automationFePassed + automationFeFailed;
  const totalAutomationRun = hasSplitAutomationRun ? splitAutomationRun : input.automationPassed + input.automationFailed;
  const automationPassed = hasSplitAutomationRun ? automationBePassed + automationFePassed : input.automationPassed;

  return {
    totalTestCase,
    totalExecutedTestCase,
    totalAutomation,
    totalAutomationRun,
    automationCoverage: percent(totalAutomation, totalTestCase),
    executionCoverage: percent(totalExecutedTestCase, legacyTotalTestCase),
    automationPassRate: percent(automationPassed, totalAutomationRun),
    automationBeCoverage: percent(input.automationBeTotal, input.testCaseBeTotal),
    automationFeCoverage: percent(input.automationFeTotal, input.testCaseFeTotal),
    automationBePassRate: percent(automationBePassed, automationBePassed + automationBeFailed),
    automationFePassRate: percent(automationFePassed, automationFePassed + automationFeFailed),
  };
}
