import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as actions from "aws-cdk-lib/aws-cloudwatch-actions";
import type * as sns from "aws-cdk-lib/aws-sns";
import type { Construct } from "constructs";

export interface AlarmSpec {
  metric: cloudwatch.IMetric;
  threshold: number;
  comparison?: cloudwatch.ComparisonOperator;
  /** Consecutive periods breaching before the alarm fires. */
  evaluationPeriods?: number;
  missingData?: cloudwatch.TreatMissingData;
  description: string;
}

/** Creates an alarm that emails the environment's alert topic on ALARM and on recovery. */
export function addAlarm(
  scope: Construct,
  id: string,
  prefix: string,
  topic: sns.ITopic,
  spec: AlarmSpec,
): cloudwatch.Alarm {
  const alarm = new cloudwatch.Alarm(scope, id, {
    alarmName: `${prefix}-${id}`,
    alarmDescription: `${spec.description} Runbook: docs/runbooks/incident-response.md`,
    metric: spec.metric,
    threshold: spec.threshold,
    comparisonOperator:
      spec.comparison ?? cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    evaluationPeriods: spec.evaluationPeriods ?? 1,
    treatMissingData: spec.missingData ?? cloudwatch.TreatMissingData.NOT_BREACHING,
  });
  const action = new actions.SnsAction(topic);
  alarm.addAlarmAction(action);
  alarm.addOkAction(action);
  return alarm;
}
