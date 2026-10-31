/**
 * Traza de una decisión (CONTRATO-GOBIERNO §5.1): lo que explica es lo que
 * decide, porque sale del mismo motor.
 */

/** Capa de la política a la que pertenece un paso. */
export type PolicyTraceLayer =
  | 'ENGAGEMENT'
  | 'GUARDRAIL'
  | 'ORG_RULE'
  | 'EXPLICIT_DENY'
  | 'GRANT_COVERAGE'
  | 'CONDITION'
  | 'OBLIGATION';

/** Un paso de la evaluación, en el orden real. */
export interface PolicyTraceStep {
  /** 1..n, el orden real de evaluación. */
  readonly order: number;
  readonly layer: PolicyTraceLayer;
  /** ¿Este paso dejó pasar? */
  readonly passed: boolean;
  /** `SupportAccessReason` o código de condición (Anexo C). */
  readonly code: string;
  /** Lenguaje simple, es-BO, de usted. */
  readonly message: string;
  readonly grantId?: string;
  readonly ruleId?: string;
  readonly atom?: string;
  /** Ruta en la condición, p. ej. `actionConditions.agenda.appointment.cancel.appointment.leadTime`. */
  readonly conditionPath?: string;
  /** Números reales: `minHours`, `hoursLeft`, `used`, `max`, `resetsAt`… */
  readonly details?: Readonly<Record<string, unknown>>;
}

/** Una concesión candidata y si resultó aplicable. */
export interface PolicyTraceCandidate {
  readonly grantId: string;
  readonly applicable: boolean;
  /** Claves de condición no cumplidas. */
  readonly unmet: readonly string[];
}

/** Traza completa de una decisión. */
export interface PolicyTrace {
  readonly steps: readonly PolicyTraceStep[];
  readonly candidates: readonly PolicyTraceCandidate[];
  /** Orden del paso que decidió. */
  readonly decidedByStep: number;
}
