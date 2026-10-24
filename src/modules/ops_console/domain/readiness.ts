import { CONCEPTS } from '../../../common/constants/concepts';
import { conceptCode } from '../../../common/constants/concept-code';

/** Códigos derivados del registro de conceptos: nunca cadenas escritas a mano. */
export const CODES = {
  incidentSevere: [
    conceptCode(CONCEPTS.INCIDENT_SEV_CRITICAL)!,
    conceptCode(CONCEPTS.INCIDENT_SEV_HIGH)!,
  ],
  defectSevere: [
    conceptCode(CONCEPTS.DEFECT_SEVERITY_CRITICAL)!,
    conceptCode(CONCEPTS.DEFECT_SEVERITY_HIGH)!,
  ],
  sloFail: conceptCode(CONCEPTS.SLO_FAIL)!,
  deploySucceeded: conceptCode(CONCEPTS.DEPLOY_SUCCEEDED)!,
  deployInFlight: [
    conceptCode(CONCEPTS.DEPLOY_IN_PROGRESS)!,
    conceptCode(CONCEPTS.DEPLOY_PENDING)!,
  ],
} as const;

/**
 * Preparación para producción explicable. Cada control dice su estado, por
 * qué, con qué evidencia y de cuándo es esa evidencia. El veredicto global no
 * promedia: un control bloqueante en FAIL no se compensa con verdes, y uno
 * bloqueante en UNKNOWN también bloquea (no saber no es lo mismo que estar bien).
 */

export type ControlStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type OverallStatus = 'READY' | 'NOT_READY' | 'BLOCKED_BY_UNKNOWN';

export interface Evidence {
  ref: string;
  detail: string;
  at: string | null;
}

export interface Control {
  code: string;
  title: string;
  blocking: boolean;
  status: ControlStatus;
  reason: string;
  evidence: Evidence[];
  /** Fecha de la evidencia más reciente usada. */
  observedAt: string | null;
  /** Pasado este plazo la evidencia ya no sirve para decidir. */
  staleAfterDays: number | null;
}

const DAY_MS = 86_400_000;
const iso = (date: Date | null) => (date ? date.toISOString() : null);
const ageDays = (date: Date, now: Date) =>
  (now.getTime() - date.getTime()) / DAY_MS;

// ---------------------------------------------------------------- restauración

export interface BackupPolicyInput {
  policyId: string;
  rpoSeconds: number;
  rtoSeconds: number;
  testFrequencyDays: number | null;
  lastTest: {
    id: string;
    finishedAt: Date | null;
    outcomePass: boolean;
    integrityPassed: boolean | null;
    measuredRpoSeconds: number | null;
    measuredRtoSeconds: number | null;
  } | null;
}

/** Sin una restauración probada, reciente y dentro de objetivo no hay backup que valga. */
export function restoreControl(
  policies: readonly BackupPolicyInput[],
  now: Date,
): Control {
  const base = {
    code: 'RESTORE_TESTED',
    title: 'Restauración probada, reciente y dentro de RPO/RTO',
    blocking: true,
    staleAfterDays: 90,
  };
  if (policies.length === 0) {
    return {
      ...base,
      status: 'UNKNOWN',
      reason: 'No hay políticas de backup activas',
      evidence: [],
      observedAt: null,
    };
  }
  const evidence: Evidence[] = [];
  const failures: string[] = [];
  const unknown: string[] = [];
  let latest: Date | null = null;
  for (const policy of policies) {
    const test = policy.lastTest;
    const frequency = policy.testFrequencyDays ?? 90;
    if (!test || !test.finishedAt) {
      unknown.push(`${policy.policyId}: sin prueba de restauración`);
      continue;
    }
    if (!latest || test.finishedAt > latest) latest = test.finishedAt;
    const problems: string[] = [];
    if (!test.outcomePass) problems.push('resultado FAIL');
    if (test.integrityPassed === false) problems.push('integridad fallida');
    if (
      test.measuredRpoSeconds !== null &&
      test.measuredRpoSeconds > policy.rpoSeconds
    )
      problems.push('RPO excedido');
    if (
      test.measuredRtoSeconds !== null &&
      test.measuredRtoSeconds > policy.rtoSeconds
    )
      problems.push('RTO excedido');
    if (ageDays(test.finishedAt, now) > frequency)
      problems.push(`prueba de hace más de ${frequency} días`);
    evidence.push({
      ref: `system_ops.restore_test_runs/${test.id}`,
      detail: problems.length ? problems.join(', ') : 'dentro de objetivo',
      at: iso(test.finishedAt),
    });
    if (problems.length)
      failures.push(`${policy.policyId}: ${problems.join(', ')}`);
  }
  const observedAt = iso(latest);
  if (failures.length) {
    return {
      ...base,
      status: 'FAIL',
      reason: failures.join('; '),
      evidence,
      observedAt,
    };
  }
  if (unknown.length) {
    return {
      ...base,
      status: 'UNKNOWN',
      reason: unknown.join('; '),
      evidence,
      observedAt,
    };
  }
  return {
    ...base,
    status: 'PASS',
    reason: `${policies.length} política(s) con restauración vigente`,
    evidence,
    observedAt,
  };
}

// ------------------------------------------------------------------ incidentes

export interface OpenIncidentInput {
  id: string;
  number: string;
  severity: string;
  status: string;
  openedAt: Date | null;
}

export function incidentsControl(open: readonly OpenIncidentInput[]): Control {
  const serious = open.filter((i) => CODES.incidentSevere.includes(i.severity));
  return {
    code: 'NO_OPEN_SEVERE_INCIDENTS',
    title: 'Sin incidentes críticos o altos abiertos',
    blocking: true,
    status: serious.length ? 'FAIL' : 'PASS',
    reason: serious.length
      ? `${serious.length} incidente(s) crítico(s)/alto(s) sin resolver`
      : `Sin incidentes graves abiertos (${open.length} abiertos de menor severidad)`,
    evidence: serious.map((i) => ({
      ref: `platform_ops.health_incidents/${i.id}`,
      detail: `${i.number} · ${i.severity} · ${i.status}`,
      at: iso(i.openedAt),
    })),
    observedAt: null,
    staleAfterDays: null,
  };
}

// ------------------------------------------------------------------------ SLO

export interface SloInput {
  sloId: string;
  target: string;
  lastMeasurement: {
    status: string;
    measuredAt: Date;
    attained: string | null;
  } | null;
}

export function sloControl(slos: readonly SloInput[], now: Date): Control {
  const base = {
    code: 'SLO_ATTAINED',
    title: 'SLO medidos en los últimos 7 días y sin incumplimiento',
    blocking: true,
    staleAfterDays: 7,
  };
  if (slos.length === 0) {
    return {
      ...base,
      status: 'UNKNOWN',
      reason: 'No hay SLO activos: no se puede afirmar nada',
      evidence: [],
      observedAt: null,
    };
  }
  const evidence: Evidence[] = [];
  const failed: string[] = [];
  const unmeasured: string[] = [];
  let latest: Date | null = null;
  for (const slo of slos) {
    const m = slo.lastMeasurement;
    if (!m || ageDays(m.measuredAt, now) > 7) {
      unmeasured.push(slo.sloId);
      continue;
    }
    if (!latest || m.measuredAt > latest) latest = m.measuredAt;
    evidence.push({
      ref: `platform_ops.slo_measurements (slo ${slo.sloId})`,
      detail: `${m.status} · ${m.attained ?? '?'} / objetivo ${slo.target}`,
      at: iso(m.measuredAt),
    });
    if (m.status === CODES.sloFail) failed.push(slo.sloId);
  }
  const observedAt = iso(latest);
  if (failed.length)
    return {
      ...base,
      status: 'FAIL',
      reason: `${failed.length} SLO incumplido(s)`,
      evidence,
      observedAt,
    };
  if (unmeasured.length) {
    return {
      ...base,
      status: 'UNKNOWN',
      reason: `${unmeasured.length} SLO sin medición reciente`,
      evidence,
      observedAt,
    };
  }
  return {
    ...base,
    status: 'PASS',
    reason: `${slos.length} SLO dentro de objetivo`,
    evidence,
    observedAt,
  };
}

// ------------------------------------------------------------------------- QA

export interface SuiteGateInput {
  suiteId: string;
  suiteCode: string;
  lastPlan: { id: string; status: string; finishedAt: Date | null } | null;
}

/** El gate de QA mira el último plan del SERVIDOR por suite, no lo que reportó un navegador. */
export function qaControl(
  suites: readonly SuiteGateInput[],
  now: Date,
): Control {
  const base = {
    code: 'QA_GATE',
    title: 'Último plan de QA del servidor aprobado en cada suite activa',
    blocking: true,
    staleAfterDays: 7,
  };
  if (suites.length === 0) {
    return {
      ...base,
      status: 'NOT_APPLICABLE',
      reason: 'No hay suites activas',
      evidence: [],
      observedAt: null,
    };
  }
  const evidence: Evidence[] = [];
  const failed: string[] = [];
  const unknown: string[] = [];
  let latest: Date | null = null;
  for (const suite of suites) {
    const plan = suite.lastPlan;
    if (!plan || !plan.finishedAt || ageDays(plan.finishedAt, now) > 7) {
      unknown.push(suite.suiteCode);
      continue;
    }
    if (!latest || plan.finishedAt > latest) latest = plan.finishedAt;
    evidence.push({
      ref: `qa_execution.execution_plans/${plan.id}`,
      detail: `${suite.suiteCode}: ${plan.status}`,
      at: iso(plan.finishedAt),
    });
    if (plan.status !== 'PASSED')
      failed.push(`${suite.suiteCode} (${plan.status})`);
  }
  const observedAt = iso(latest);
  if (failed.length)
    return {
      ...base,
      status: 'FAIL',
      reason: `Suites sin aprobar: ${failed.join(', ')}`,
      evidence,
      observedAt,
    };
  if (unknown.length) {
    return {
      ...base,
      status: 'UNKNOWN',
      reason: `Sin plan reciente del servidor: ${unknown.join(', ')}`,
      evidence,
      observedAt,
    };
  }
  return {
    ...base,
    status: 'PASS',
    reason: `${suites.length} suite(s) aprobadas`,
    evidence,
    observedAt,
  };
}

export interface OpenDefectInput {
  id: string;
  number: string;
  severity: string;
  status: string;
}

export function defectsControl(open: readonly OpenDefectInput[]): Control {
  const serious = open.filter((d) => CODES.defectSevere.includes(d.severity));
  return {
    code: 'NO_OPEN_SEVERE_DEFECTS',
    title: 'Sin defectos críticos o altos abiertos',
    blocking: true,
    status: serious.length ? 'FAIL' : 'PASS',
    reason: serious.length
      ? `${serious.length} defecto(s) grave(s) abiertos`
      : 'Sin defectos graves abiertos',
    evidence: serious.map((d) => ({
      ref: `qa_lab.test_defects/${d.id}`,
      detail: `${d.number} · ${d.severity} · ${d.status}`,
      at: null,
    })),
    observedAt: null,
    staleAfterDays: null,
  };
}

// --------------------------------------------------------- informativos (no bloquean)

export function catalogControl(input: {
  hasScan: boolean;
  reviewed: number;
  denominator: number;
}): Control {
  const base = {
    code: 'DATA_CATALOG_REVIEWED',
    title: 'Tablas con justificación aprobada',
    blocking: false,
    evidence: [],
    observedAt: null,
    staleAfterDays: null,
  };
  if (!input.hasScan)
    return {
      ...base,
      status: 'UNKNOWN',
      reason: 'El catálogo no se ha escaneado',
    };
  if (input.denominator === 0)
    return {
      ...base,
      status: 'NOT_APPLICABLE',
      reason: 'Sin objetos observados',
    };
  const ratio = input.reviewed / input.denominator;
  return {
    ...base,
    status: ratio === 1 ? 'PASS' : 'FAIL',
    reason: `${input.reviewed}/${input.denominator} tablas con ficha aprobada vigente`,
  };
}

export function deploymentControl(
  last: {
    id: string;
    number: string;
    status: string;
    finishedAt: Date | null;
  } | null,
): Control {
  const base = {
    code: 'LAST_PRODUCTION_DEPLOYMENT',
    title: 'Último despliegue a producción',
    blocking: false,
    staleAfterDays: null,
  };
  if (!last)
    return {
      ...base,
      status: 'UNKNOWN',
      reason: 'No hay despliegues a producción registrados',
      evidence: [],
      observedAt: null,
    };
  return {
    ...base,
    status:
      last.status === CODES.deploySucceeded
        ? 'PASS'
        : CODES.deployInFlight.includes(last.status)
          ? 'UNKNOWN'
          : 'FAIL',
    reason: `${last.number}: ${last.status}`,
    evidence: [
      {
        ref: `platform_ops.deployments/${last.id}`,
        detail: last.status,
        at: iso(last.finishedAt),
      },
    ],
    observedAt: iso(last.finishedAt),
  };
}

// ------------------------------------------------------------------- veredicto

export function overallStatus(controls: readonly Control[]): {
  status: OverallStatus;
  blockingFailures: string[];
  blockingUnknown: string[];
} {
  const blocking = controls.filter((c) => c.blocking);
  const blockingFailures = blocking
    .filter((c) => c.status === 'FAIL')
    .map((c) => c.code);
  const blockingUnknown = blocking
    .filter((c) => c.status === 'UNKNOWN')
    .map((c) => c.code);
  const status: OverallStatus = blockingFailures.length
    ? 'NOT_READY'
    : blockingUnknown.length
      ? 'BLOCKED_BY_UNKNOWN'
      : 'READY';
  return { status, blockingFailures, blockingUnknown };
}
