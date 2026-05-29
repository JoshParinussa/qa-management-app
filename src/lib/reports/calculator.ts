type ReportMetricsInput = {
  testCaseBeTotal: number;
  testCaseFeTotal: number;
  testCaseBeExecuted: number;
  testCaseFeExecuted: number;
  automationBeTotal: number;
  automationFeTotal: number;
  automationPassed: number;
  automationFailed: number;
};

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

export function calculateReportMetrics(input: ReportMetricsInput) {
  const totalTestCase = input.testCaseBeTotal + input.testCaseFeTotal;
  const totalExecutedTestCase = input.testCaseBeExecuted + input.testCaseFeExecuted;
  const totalAutomation = input.automationBeTotal + input.automationFeTotal;
  const totalAutomationRun = input.automationPassed + input.automationFailed;

  return {
    totalTestCase,
    totalExecutedTestCase,
    totalAutomation,
    totalAutomationRun,
    automationCoverage: percent(totalAutomation, totalTestCase),
    executionCoverage: percent(totalExecutedTestCase, totalTestCase),
    automationPassRate: percent(input.automationPassed, totalAutomationRun),
  };
}
