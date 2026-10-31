import type {
  FieldVisibility,
  SupportAccessReason,
  SupportChallengeKind,
  SupportDecisionEffect,
} from './support-access.types';
import type { SupportAccessContext } from './support-access-context';
import type {
  ExplicitObligations,
  SupportCondition,
} from './support-conditions';
import type { PolicyTraceLayer, PolicyTraceStep } from './support-policy-trace';

/**
 * Contratos de «explicar» y «simular» como tipos (CONTRATO-GOBIERNO §5.2 y
 * §5.3). Los servicios y los DTO de `POST /org/access/explain|simulate` se
 * apoyan en estos tipos; el motor es el mismo que decide
 * (`evaluateSupportAccessV2`), por eso lo que explica es lo que decide.
 */

/** Escenarios que el servidor agrega solo (`autoScenarios`). */
export const AUTO_SCENARIOS_MAX = 200;
/** Tope total de escenarios de una simulación (422 `SIMULATION_TOO_LARGE`). */
export const SIMULATION_MAX_SCENARIOS = 400;

/** «¿Y si…?»: cada bandera reemplaza el atributo real SOLO en este cálculo. */
export interface ExplainAssumptions {
  readonly stepUpFresh?: boolean;
  readonly doctorOnline?: boolean;
  readonly reasonProvided?: boolean;
  readonly approvalGranted?: boolean;
  /** Evalúa los permisos aunque decida una denegación de las capas 1-3. */
  readonly forceFull?: boolean;
}

/** Entrada de `POST /org/access/explain` (una de `engagementId` o `userId`). */
export interface ExplainRequest {
  readonly engagementId?: string;
  readonly userId?: string;
  /** Átomo o código antiguo; la respuesta informa el átomo evaluado. */
  readonly action: string;
  readonly practitionerRoleAssignmentId?: string | null;
  readonly healthcareServiceId?: string | null;
  readonly careSpaceId?: string | null;
  readonly patientProfileId?: string;
  readonly appointmentStartAt?: string;
  /** Instante de la evaluación; por defecto «ahora». */
  readonly at?: string;
  readonly assume?: ExplainAssumptions;
}

/** Lo que la persona puede hacer para que la acción se permita. */
export interface ExplainMissing {
  readonly kind:
    'APPROVAL' | 'REASON' | 'STEP_UP' | 'WAIT' | 'NETWORK' | 'DEVICE';
  readonly by?: string;
  /** Lenguaje simple, de usted. */
  readonly message: string;
  readonly fix: { readonly type: string } & Readonly<Record<string, unknown>>;
}

/** Lo que un administrador puede cambiar (agregar átomo, relajar condición…). */
export interface ExplainAdminFix {
  readonly type:
    | 'ADD_ATOM'
    | 'WIDEN_COVERAGE'
    | 'RELAX_CONDITION'
    | 'ACCEPT_DOCTOR'
    | 'REMOVE_DENY';
  readonly grantId?: string;
  readonly conditionPath?: string;
  readonly message: string;
}

/** Uso de un contador (`ACTIONS/DAY/agenda.appointment.cancel`: 3 de 20). */
export interface ExplainUsage {
  readonly key: string;
  readonly used: number;
  readonly max: number;
  readonly resetsAt?: string;
}

/** Decisión tal como la devuelven explicar y simular. */
export interface ScenarioDecision {
  readonly effect: SupportDecisionEffect;
  readonly allowed: boolean;
  readonly reason: SupportAccessReason | string;
  readonly atom?: string;
  readonly grantId?: string;
  readonly unmet?: readonly string[];
}

/** Salida de `POST /org/access/explain`. */
export interface ExplainResponse {
  readonly decision: ScenarioDecision;
  /** Una frase de resumen en lenguaje simple. */
  readonly summary: string;
  readonly decidedBy: {
    readonly layer: PolicyTraceLayer;
    readonly step: number;
    readonly grantId?: string;
    readonly atom?: string;
    readonly conditionPath?: string;
  };
  /** Pasos de la traza, también los que pasaron. */
  readonly reasons: readonly PolicyTraceStep[];
  readonly missing: readonly ExplainMissing[];
  readonly adminFixes: readonly ExplainAdminFix[];
  readonly obligations: ExplicitObligations | Readonly<Record<string, never>>;
  readonly visibleFields: Readonly<Record<string, FieldVisibility>>;
  readonly usage: readonly ExplainUsage[];
  readonly challenge?: { readonly kind: SupportChallengeKind };
  readonly evaluatedAt: string;
  readonly correlationId: string;
}

/** Una concesión del borrador de una simulación. */
export interface DraftGrant {
  /** Con `id` reemplaza esa concesión; sin `id` es nueva. */
  readonly id?: string;
  readonly effect: 'ALLOW' | 'DENY';
  /** Átomos o códigos antiguos. */
  readonly actions: readonly string[];
  readonly condition?: SupportCondition;
  readonly actionConditions?: Readonly<Record<string, SupportCondition>>;
  readonly targetKind?: string;
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly practiceSiteId?: string;
  readonly expansionMode?: 'DYNAMIC' | 'FIXED';
}

/** Borrador: `PATCH` mezcla con lo actual; `REPLACE` es el conjunto completo. */
export interface SimulationDraft {
  readonly mode: 'PATCH' | 'REPLACE';
  /** Simula el cambio de plantilla (mover). */
  readonly templateCode?: string | null;
  readonly grants: readonly DraftGrant[];
  readonly removeGrantIds: readonly string[];
}

/** Un escenario de la simulación. */
export interface SimulationScenario {
  readonly label: string;
  readonly action: string;
  readonly practitionerRoleAssignmentId?: string | null;
  readonly healthcareServiceId?: string | null;
  readonly careSpaceId?: string | null;
  readonly patientProfileId?: string;
  readonly appointmentStartAt?: string;
  readonly at?: string;
  readonly amount?: NonNullable<SupportAccessContext['amount']>;
}

/** Entrada de `POST /org/access/simulate`. */
export interface SimulateRequest {
  readonly engagementId: string;
  readonly draft: SimulationDraft;
  readonly scenarios: readonly SimulationScenario[];
  /** Por defecto `true`: hasta 200 escenarios representativos. */
  readonly autoScenarios?: boolean;
}

/** Un error o aviso de validación del borrador (viaja en `validation`, no como 4xx). */
export interface ValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

/** Cómo cambió un escenario entre el estado actual y el borrador (mira el efecto). */
export type ScenarioChange =
  'SAME' | 'NEWLY_ALLOWED' | 'NEWLY_DENIED' | 'NEWLY_CHALLENGED';

/** Resultado de un escenario. */
export interface ScenarioResult {
  readonly label: string;
  readonly change: ScenarioChange;
  readonly before: ScenarioDecision;
  readonly after: ScenarioDecision;
}

/** Conteo de impacto de una simulación. */
export interface SimulationImpactCounts {
  readonly newlyAllowed: number;
  readonly newlyDenied: number;
  readonly unchanged: number;
  readonly challengesNew: number;
}

/** Salida de `POST /org/access/simulate`. */
export interface SimulateResponse {
  /** `false` si hay cualquier error: la pantalla no deja guardar. */
  readonly valid: boolean;
  readonly validation: {
    readonly errors: readonly ValidationIssue[];
    readonly warnings: readonly ValidationIssue[];
  };
  readonly governance: {
    readonly sodFindings: readonly {
      readonly ruleCode: string;
      readonly action: string;
      readonly atoms: readonly string[];
      readonly message: string;
    }[];
    readonly needsFourEyes: {
      readonly required: boolean;
      readonly reasons: readonly string[];
    };
    readonly privilegeScore: {
      readonly before: number;
      readonly after: number;
      readonly delta: number;
    };
  };
  readonly summary: {
    readonly plain: readonly string[];
    readonly changes: readonly string[];
  };
  readonly scenarios: readonly ScenarioResult[];
  readonly impact: SimulationImpactCounts & {
    readonly doctorsCovered: {
      readonly before: number;
      readonly after: number;
    };
    readonly servicesCovered: {
      readonly before: number;
      readonly after: number;
    };
    readonly spacesCovered: { readonly before: number; readonly after: number };
    readonly effectiveAtoms: {
      readonly added: readonly string[];
      readonly removed: readonly string[];
    };
  };
  /** Huella opaca (10 min) del borrador validado: `SIMULATION_STALE` si cambia. */
  readonly simulationToken: string;
  readonly limits: {
    readonly scenarioCount: number;
    readonly truncated: boolean;
  };
  readonly evaluatedAt: string;
}

/** Qué tan abierto es un efecto: PERMIT > CHALLENGE > DENY. */
const OPENNESS: Readonly<Record<SupportDecisionEffect, number>> = {
  DENY: 0,
  CHALLENGE: 1,
  PERMIT: 2,
};

/**
 * Cómo cambió una decisión entre el estado actual y el borrador. Mira SOLO el
 * efecto (en el ejemplo «Cobrar un sábado» del contrato, `DENY` por otro motivo
 * sigue siendo `SAME`).
 *
 * @param before - Decisión con las concesiones actuales.
 * @param after - Decisión con el borrador.
 * @returns El cambio del escenario.
 */
export function classifyChange(
  before: Pick<ScenarioDecision, 'effect'>,
  after: Pick<ScenarioDecision, 'effect'>,
): ScenarioChange {
  if (before.effect === after.effect) return 'SAME';
  if (after.effect === 'PERMIT') return 'NEWLY_ALLOWED';
  if (
    after.effect === 'CHALLENGE' &&
    OPENNESS[after.effect] !== OPENNESS[before.effect]
  ) {
    return 'NEWLY_CHALLENGED';
  }
  return 'NEWLY_DENIED';
}

/** Suma los cambios de los escenarios en los cuatro conteos del impacto. */
export function summarizeImpact(
  changes: readonly ScenarioChange[],
): SimulationImpactCounts {
  return {
    newlyAllowed: changes.filter((c) => c === 'NEWLY_ALLOWED').length,
    newlyDenied: changes.filter((c) => c === 'NEWLY_DENIED').length,
    unchanged: changes.filter((c) => c === 'SAME').length,
    challengesNew: changes.filter((c) => c === 'NEWLY_CHALLENGED').length,
  };
}
