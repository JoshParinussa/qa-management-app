# Test Case and Automation Split Design

## Scope

Improve weekly report input and reporting metrics so QA can distinguish total unique test cases from BE/FE-specific coverage. One test case can cover BE, FE, or both, so `Test case total` must be entered separately from `Test case BE total` and `Test case FE total`.

## Form UX

The weekly report form should keep two clear metric cards:

- `Test case` card:
  - `Test case total`
  - `Test case BE total`
  - `Test case FE total`
- `Automation` card:
  - BE group: `Automation BE total`, `BE passed`, `BE failed`
  - FE group: `Automation FE total`, `FE passed`, `FE failed`

The UX should be compact and readable:

- Use grouped sub-sections for BE and FE inside Automation.
- Keep numeric fields blank on new forms with `0` placeholders.
- Preserve submitted values after validation errors.
- Keep labels concise and consistent.

## Data Model

Add persisted fields to `weekly_reports`:

- `test_case_total`
- `automation_be_passed`
- `automation_be_failed`
- `automation_fe_passed`
- `automation_fe_failed`
- `automation_be_coverage`
- `automation_fe_coverage`
- `automation_be_pass_rate`
- `automation_fe_pass_rate`

Keep existing fields for compatibility unless a later cleanup migration removes them:

- `test_case_be_total`
- `test_case_fe_total`
- `automation_be_total`
- `automation_fe_total`
- `automation_passed`
- `automation_failed`
- `automation_coverage`
- `execution_coverage`

## Validation

Weekly report validation should enforce:

- All new numeric fields are non-negative integers.
- `automationBeTotal <= testCaseBeTotal`.
- `automationFeTotal <= testCaseFeTotal`.
- `automationBePassed + automationBeFailed <= automationBeTotal`.
- `automationFePassed + automationFeFailed <= automationFeTotal`.

`testCaseTotal` is informational/aggregate and can be lower than `testCaseBeTotal + testCaseFeTotal` because one test case can cover both BE and FE.

## Metrics

Calculator output should include:

- `totalTestCase = testCaseTotal`
- `beAutomationCoverage = automationBeTotal / testCaseBeTotal`
- `feAutomationCoverage = automationFeTotal / testCaseFeTotal`
- `beAutomationPassRate = automationBePassed / (automationBePassed + automationBeFailed)`
- `feAutomationPassRate = automationFePassed / (automationFePassed + automationFeFailed)`
- `totalAutomation = automationBeTotal + automationFeTotal`
- `totalAutomationRun = automationBePassed + automationBeFailed + automationFePassed + automationFeFailed`

Overall automation coverage can remain as a compatibility metric, but UI should prefer BE/FE split metrics.

## Reporting Output

Weekly detail page should show a clean metric layout:

- Total test case.
- BE test case total and BE automation coverage.
- FE test case total and FE automation coverage.
- BE pass rate and FE pass rate.

Dashboard, monthly summary, and Markdown export should use split BE/FE coverage where applicable. If space is limited, show `BE coverage` and `FE coverage` instead of one generic automation coverage.

## Tests

Add/update tests for:

- Metric calculator split coverage and pass rates.
- Weekly validation for split automation constraints.
- Form state preservation for new fields.
- Monthly summary/export split metrics.

## Non-Goals

This change does not implement per-test-case inventory, unique test case deduplication, or automatic calculation of `Test case total` from individual test case records.
