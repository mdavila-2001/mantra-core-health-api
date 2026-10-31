import {
  SupportAccessReason,
  type UnmetCondition,
} from './support-access.types';
import type { CandidateEval, Run } from './support-access.candidates';
import { compareUnmet } from './support-conditions';
import {
  describeLimitOk,
  describeTraceStep,
  describeUnmet,
} from './support-describe';
import type {
  PolicyTrace,
  PolicyTraceCandidate,
  PolicyTraceLayer,
  PolicyTraceStep,
} from './support-policy-trace';

const R = SupportAccessReason;

/** Clave de trazas de «pasa»: cada clave de condición tiene su código `*_OK`. */
export function passCode(key: string): string {
  if (key.startsWith('patients.')) return 'PATIENTS_OK';
  if (key === 'appointment.window') return 'APPOINTMENT_WINDOW_OK';
  if (key === 'appointment.leadTime') return 'LEAD_TIME_OK';
  if (key === 'appointment.horizon') return 'HORIZON_OK';
  if (key === 'channels') return 'CHANNELS_OK';
  if (key === 'limits') return 'LIMIT_OK';
  return `${key.toUpperCase()}_OK`;
}

/** Quien arma la traza paso a paso. */
export class TraceBuilder {
  readonly steps: PolicyTraceStep[] = [];

  add(
    layer: PolicyTraceLayer,
    passed: boolean,
    code: string,
    message: string | undefined,
    extra: Partial<
      Omit<PolicyTraceStep, 'order' | 'layer' | 'passed' | 'code' | 'message'>
    > = {},
  ): number {
    const order = this.steps.length + 1;
    this.steps.push({
      order,
      layer,
      passed,
      code,
      message: message ?? describeTraceStep(code, passed, {}),
      ...extra,
    });
    return order;
  }

  build(
    candidates: readonly PolicyTraceCandidate[],
    decidedByStep: number,
  ): PolicyTrace {
    return {
      steps: this.steps,
      candidates: [...candidates].sort((a, b) =>
        a.grantId.localeCompare(b.grantId),
      ),
      decidedByStep,
    };
  }
}

/** Pasos de traza de las condiciones evaluadas de la candidata elegida. */
export function addConditionSteps(
  trace: TraceBuilder,
  chosen: CandidateEval,
  grantId: string,
  atom: string,
): { firstFail: number } {
  interface Entry {
    key: string;
    passed: boolean;
    unmet?: UnmetCondition;
    run: Run;
  }
  const entries: Entry[] = [];
  for (const run of chosen.runs) {
    for (const [key, tri] of Object.entries(run.result.predicates)) {
      if (tri === 'T') entries.push({ key, passed: true, run });
    }
    for (const unmet of run.result.unmet)
      entries.push({ key: unmet.key, passed: false, unmet, run });
  }
  const rank = (e: Entry): number =>
    compareUnmet(
      { key: e.key, code: R.ALLOWED, status: 'F' },
      { key: 'time', code: R.ALLOWED, status: 'F' },
    );
  void rank;
  entries.sort((a, b) =>
    compareUnmet(
      {
        key: a.key,
        code: R.ALLOWED,
        status: 'F',
        path: a.unmet?.path ?? a.run.prefix,
      },
      {
        key: b.key,
        code: R.ALLOWED,
        status: 'F',
        path: b.unmet?.path ?? b.run.prefix,
      },
    ),
  );
  let firstFail = 0;
  for (const entry of entries) {
    if (entry.passed) {
      const snapshot =
        entry.key === 'limits'
          ? entry.run.result.readings.find((r) => r.metric !== 'AMOUNT' && r.ok)
          : undefined;
      trace.add(
        'CONDITION',
        true,
        passCode(entry.key),
        entry.key === 'limits' && snapshot
          ? describeLimitOk(atom, snapshot)
          : describeTraceStep(passCode(entry.key), true, {}),
        {
          grantId,
          atom,
          conditionPath: `${entry.run.prefix}.${entry.key.split('.')[0] === 'limits' ? 'limits' : entry.key}`,
          ...(entry.run.ruleId ? { ruleId: entry.run.ruleId } : {}),
          ...(snapshot
            ? {
                details: {
                  used: snapshot.used,
                  max: snapshot.max,
                  per: snapshot.per,
                  resetsAt: snapshot.resetsAt,
                },
              }
            : {}),
        },
      );
    } else if (entry.unmet) {
      const u = entry.unmet;
      const order = trace.add(
        'CONDITION',
        false,
        u.code,
        describeUnmet(u, { atom }),
        {
          grantId,
          atom,
          ...(u.path ? { conditionPath: u.path } : {}),
          ...(u.ruleId ? { ruleId: u.ruleId } : {}),
          ...(u.details ? { details: u.details } : {}),
        },
      );
      if (firstFail === 0) firstFail = order;
    }
  }
  return { firstFail };
}
