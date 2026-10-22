import { createHash } from 'node:crypto';
import {
  buildCaseUrl,
  urlViolations,
  type GuardViolation,
  type TargetAllowlist,
} from './target-guard';

/**
 * Plan de ejecución: qué se va a llamar, contra qué destino, con qué límites.
 * Su hash es la identidad de lo aprobado: cambiar destino, método, ruta,
 * cuerpo o límites cambia el hash y la aprobación anterior deja de valer.
 */

export const PLAN_STATUSES = [
  'PENDING_APPROVAL',
  'QUEUED',
  'RUNNING',
  'PASSED',
  'FAILED',
  'TIMED_OUT',
  'CANCELLED',
  'INFRA_ERROR',
  'REJECTED',
] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];
export const PLAN_TERMINAL: readonly PlanStatus[] = [
  'PASSED',
  'FAILED',
  'TIMED_OUT',
  'CANCELLED',
  'INFRA_ERROR',
  'REJECTED',
];

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export const MUTATING: readonly HttpMethod[] = [
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];
export type EnvironmentKind = 'DEV' | 'STAGING' | 'PRODUCTION';

export interface Limits {
  maxRequests: number;
  maxDurationSeconds: number;
  requestTimeoutMs: number;
  /** Separación mínima entre peticiones: el runner es secuencial (concurrencia 1). */
  minIntervalMs: number;
}

/** Presupuesto seguro por defecto (dev): 5 req/s, 60 s, 300 peticiones. */
export const DEFAULT_LIMITS: Limits = {
  maxRequests: 300,
  maxDurationSeconds: 60,
  requestTimeoutMs: 10_000,
  minIntervalMs: 200,
};

export interface CaseInput {
  caseId: string;
  code: string;
  method: HttpMethod | null;
  requestPath: string | null;
  body: unknown;
}

export interface PlanStep {
  caseId: string;
  code: string;
  method: HttpMethod;
  url: string;
  mutating: boolean;
  bodyHash: string;
}

export interface PlanInput {
  suiteId: string;
  suiteVersion: number;
  environmentId: string;
  environmentKind: EnvironmentKind;
  target: TargetAllowlist & { allowMutations: boolean };
  targetMax: Limits;
  requested?: Partial<Limits>;
  cases: CaseInput[];
}

export interface PlanResult {
  steps: PlanStep[];
  limits: Limits;
  hash: string;
  requiresApproval: boolean;
  approvalReasons: string[];
  violations: Array<GuardViolation & { caseCode?: string }>;
  /** Lo que el servidor recortó de lo pedido; nunca eleva. */
  clamped: Array<keyof Limits>;
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * Límites efectivos: lo pedido, recortado al máximo del destino. Un valor
 * pedido por encima del máximo no se rechaza, se recorta y se informa.
 */
export function clampLimits(
  targetMax: Limits,
  requested: Partial<Limits> = {},
): { limits: Limits; clamped: Array<keyof Limits> } {
  const clamped: Array<keyof Limits> = [];
  const pick = (key: keyof Limits, isMin = false) => {
    const wanted = requested[key];
    const cap = targetMax[key];
    if (wanted === undefined) return cap;
    // El intervalo mínimo funciona al revés: el destino fija el piso.
    if (isMin ? wanted < cap : wanted > cap) {
      clamped.push(key);
      return cap;
    }
    return wanted;
  };
  return {
    limits: {
      maxRequests: pick('maxRequests'),
      maxDurationSeconds: pick('maxDurationSeconds'),
      requestTimeoutMs: pick('requestTimeoutMs'),
      minIntervalMs: pick('minIntervalMs', true),
    },
    clamped,
  };
}

/** Construye el plan y todo lo que lo invalida o lo hace necesitar aprobación. */
export function buildPlan(input: PlanInput): PlanResult {
  const violations: PlanResult['violations'] = [];
  const steps: PlanStep[] = [];
  for (const item of input.cases) {
    if (!item.method || !item.requestPath) {
      violations.push({
        code: 'CASE_NOT_EXECUTABLE',
        message:
          'El caso no declara método y ruta: no es ejecutable por el runner',
        caseCode: item.code,
      });
      continue;
    }
    const url = buildCaseUrl(input.target, item.requestPath);
    for (const violation of urlViolations(url, input.target)) {
      violations.push({ ...violation, caseCode: item.code });
    }
    const mutating = MUTATING.includes(item.method);
    if (mutating && input.environmentKind === 'PRODUCTION') {
      violations.push({
        code: 'MUTATION_IN_PRODUCTION',
        message: 'Las mutaciones contra producción están deshabilitadas',
        caseCode: item.code,
      });
    } else if (mutating && !input.target.allowMutations) {
      violations.push({
        code: 'MUTATION_NOT_ALLOWED',
        message: 'El destino no admite peticiones que modifican estado',
        caseCode: item.code,
      });
    }
    steps.push({
      caseId: item.caseId,
      code: item.code,
      method: item.method,
      url,
      mutating,
      bodyHash: sha256(item.body ?? null),
    });
  }
  if (input.cases.length === 0) {
    violations.push({
      code: 'NO_CASES',
      message: 'La suite no tiene casos activos',
    });
  }

  const { limits, clamped } = clampLimits(input.targetMax, input.requested);
  if (steps.length > limits.maxRequests) {
    violations.push({
      code: 'BUDGET_TOO_SMALL',
      message: `El plan tiene ${steps.length} peticiones y el presupuesto admite ${limits.maxRequests}`,
    });
  }

  const approvalReasons: string[] = [];
  if (input.environmentKind === 'PRODUCTION')
    approvalReasons.push('ENVIRONMENT_PRODUCTION');
  if (steps.some((step) => step.mutating))
    approvalReasons.push('MUTATING_REQUESTS');
  if (input.target.allowPrivateNetwork)
    approvalReasons.push('PRIVATE_NETWORK_TARGET');

  const hash = sha256({
    suiteId: input.suiteId,
    suiteVersion: input.suiteVersion,
    environmentId: input.environmentId,
    target: {
      scheme: input.target.scheme,
      host: input.target.host.toLowerCase(),
      port: input.target.port,
      allowedPathPrefixes: [...input.target.allowedPathPrefixes].sort(),
      allowPrivateNetwork: input.target.allowPrivateNetwork,
      allowMutations: input.target.allowMutations,
    },
    steps: steps.map((step) => [
      step.caseId,
      step.method,
      step.url,
      step.bodyHash,
    ]),
    limits,
  });

  return {
    steps,
    limits,
    hash,
    requiresApproval: approvalReasons.length > 0,
    approvalReasons,
    violations,
    clamped,
  };
}

export interface ApprovalCheck {
  planHash: string;
  requesterId: string | null;
  approval: {
    planHash: string;
    approverId: string;
    decision: 'APPROVED' | 'REJECTED';
    expiresAt: Date;
  } | null;
  now: Date;
}

/**
 * ¿Hay una aprobación válida para ejecutar ESTE plan ahora? Un texto de ticket
 * no cuenta: tiene que existir un registro, del mismo hash, sin vencer, de
 * alguien distinto de quien lo pidió.
 */
export function approvalViolation(check: ApprovalCheck): GuardViolation | null {
  const { approval } = check;
  if (!approval)
    return { code: 'APPROVAL_MISSING', message: 'El plan requiere aprobación' };
  if (approval.decision !== 'APPROVED') {
    return { code: 'APPROVAL_REJECTED', message: 'El plan fue rechazado' };
  }
  if (approval.planHash !== check.planHash) {
    return {
      code: 'APPROVAL_STALE',
      message: 'La aprobación es de otra versión del plan',
    };
  }
  if (approval.expiresAt.getTime() <= check.now.getTime()) {
    return { code: 'APPROVAL_EXPIRED', message: 'La aprobación venció' };
  }
  if (check.requesterId && approval.approverId === check.requesterId) {
    return {
      code: 'SELF_APPROVAL',
      message: 'Quien pidió el plan no puede aprobarlo',
    };
  }
  return null;
}

/** Estado final del plan a partir de lo que pasó durante la ejecución. */
export function finalPlanStatus(outcome: {
  cancelled: boolean;
  timedOut: boolean;
  infraErrors: number;
  failed: number;
  executed: number;
}): PlanStatus {
  if (outcome.cancelled) return 'CANCELLED';
  if (outcome.timedOut) return 'TIMED_OUT';
  // Una caída de infraestructura no es un defecto del producto.
  if (outcome.infraErrors > 0) return 'INFRA_ERROR';
  if (outcome.executed === 0) return 'INFRA_ERROR';
  return outcome.failed > 0 ? 'FAILED' : 'PASSED';
}
