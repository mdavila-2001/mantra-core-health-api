import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { isIP } from 'node:net';
import { PinoLogger } from 'nestjs-pino';
import {
  atomMeta,
  primaryAtomOf,
  type ExplicitObligations,
  type PermissionSensitivity,
  type SupportAccessContext,
  type SupportAccessDecision,
  type UnmetCondition,
  type UsageSnapshot,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { AccessDecisionLogRepository } from '../repositories';
import { applyTenantContext, isRlsEnforced } from './tenant-context';

/** Ventana de deduplicación de `DENY` y `CHALLENGE` repetidos. */
export const DECISION_DEDUP_WINDOW_MS = 60_000;

/** Umbral por defecto de registro obligatorio. */
const DEFAULT_REQUIRED_SENSITIVITY: PermissionSensitivity = 'HIGH';
const SENSITIVITY_ORDER: Readonly<Record<PermissionSensitivity, number>> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Tamaño a partir del cual se barren las entradas vencidas de la deduplicación. */
const DEDUP_SWEEP_SIZE = 5_000;

/** Qué se anota de una decisión. Nunca texto libre ni datos del paciente. */
export interface DecisionRecordInput {
  /** Organización. */
  readonly tenantId: string;
  /** Persona de apoyo a la que se decidió. */
  readonly userId: string;
  /** Acción preguntada (átomo o alias); se anota el átomo. */
  readonly action: string;
  /** Veredicto de la política. */
  readonly decision: SupportAccessDecision;
  /** Objetivo de la decisión. */
  readonly target?: {
    readonly practitionerRoleAssignmentId?: string;
    readonly healthcareServiceId?: string;
    readonly careSpaceId?: string;
  };
  /** Contexto de la acción (de él salen paciente, aprobación, sesión y origen). */
  readonly context?: SupportAccessContext;
  /** Regla de la organización que decidió. */
  readonly ruleId?: string;
  /** Obligaciones que rigieron (motivo, paso extra, aprobación). */
  readonly obligations?: ExplicitObligations;
  /** Lecturas de contadores (para `usage`). */
  readonly readings?: readonly UsageSnapshot[];
  /** Instante del asiento. */
  readonly now: Date;
}

/** Lo que el recorder decide de cada decisión. */
export interface RecordPlan {
  /** ¿Se escribe un asiento? */
  readonly write: boolean;
  /** ¿Es evidencia obligatoria? Si falla, la acción se niega. */
  readonly required: boolean;
}

/**
 * Anota las decisiones de la política en `access_decision_log`, la bitácora
 * WORM del módulo (CONTRATO-GOBIERNO §7.3 tabla 10).
 *
 * ## Qué se escribe
 *
 * Todo `DENY` y `CHALLENGE` (con deduplicación), todo `PERMIT` de un átomo de
 * sensibilidad ≥ ALTA (OBLIGATORIO: si el asiento no se pudo escribir, la
 * política niega con `DECISION_LOG_UNAVAILABLE`) y todo `PERMIT` con una
 * obligación cumplida (mejor esfuerzo). Los `PERMIT` rutinarios no dejan fila:
 * viven en `audit_log` y en `grant_usage_stats`.
 *
 * ## Deduplicación sin UPDATE
 *
 * La tabla es WORM (sin UPDATE ni DELETE), así que un asiento ya escrito nunca se
 * toca: las repeticiones del mismo `DENY`/`CHALLENGE` dentro de 60 s se cuentan
 * en el proceso y se anotan en el asiento SIGUIENTE (`detail.repeat`). Un
 * `PERMIT` nunca se deduplica: cada uno es evidencia.
 *
 * ## Sin PHI
 *
 * `detail` lleva identificadores, códigos y números (`unmet`, `usage`,
 * `obligations`); todo lo demás se descarta. El paciente va solo como id.
 */
@Injectable()
export class AccessDecisionRecorder {
  private readonly recent = new Map<
    string,
    { at: number; suppressed: number }
  >();

  /**
   * @param em - Contexto de persistencia (transacción propia si el llamador no trae una).
   * @param repo - Bitácora de decisiones.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AccessDecisionLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessDecisionRecorder.name);
  }

  /**
   * ¿Se anota esta decisión y es obligatoria?
   *
   * @param action - Acción preguntada (átomo o alias).
   * @param decision - Veredicto.
   * @param obligations - Obligaciones que rigieron.
   * @returns El plan: escribir o no, y si es evidencia obligatoria.
   */
  plan(
    action: string,
    decision: SupportAccessDecision,
    obligations?: ExplicitObligations,
  ): RecordPlan {
    const effect = decision.effect ?? (decision.allowed ? 'PERMIT' : 'DENY');
    if (effect !== 'PERMIT') return { write: true, required: false };
    const atom = primaryAtomOf(action);
    const sensitivity = atom ? atomMeta(atom)?.sensitivity : undefined;
    const required =
      !!sensitivity &&
      SENSITIVITY_ORDER[sensitivity] >=
        SENSITIVITY_ORDER[requiredSensitivity(process.env)];
    const fulfilled =
      !!obligations &&
      (!!obligations.reason || !!obligations.stepUp || !!obligations.approval);
    return { write: required || fulfilled, required };
  }

  /**
   * Escribe el asiento de una decisión. Con una transacción en curso el asiento
   * entra en un punto de guardado (si falla no envenena la del llamador); sin
   * ella abre una transacción corta acotada a la organización.
   *
   * @param em - Contexto del llamador (transacción activa o un fork).
   * @param input - Qué se anota.
   * @param plan - Lo que {@link AccessDecisionRecorder.plan} decidió.
   * @returns `true` si se escribió el asiento; `false` si se omitió por duplicado.
   * @throws Si la base no lo acepta: el llamador decide (obligatorio ⇒ niega).
   */
  async write(
    em: EntityManager,
    input: DecisionRecordInput,
    plan: RecordPlan,
  ): Promise<boolean> {
    const effect =
      input.decision.effect ?? (input.decision.allowed ? 'PERMIT' : 'DENY');
    const repeat = effect === 'PERMIT' ? 0 : this.dedup(input, effect);
    if (repeat < 0) return false;
    const data = this.rowOf(input, effect, repeat);
    const insert = (tx: EntityManager): Promise<string> =>
      this.repo.appendNow(tx, data);
    try {
      if (em.isInTransaction()) {
        await em.transactional(insert);
      } else {
        await em.transactional(async (tx) => {
          if (isRlsEnforced()) await applyTenantContext(tx, input.tenantId);
          return insert(tx);
        });
      }
      return true;
    } catch (err) {
      if (repeat > 0) this.carryRepeats(input, effect, repeat);
      this.logger.error(
        {
          operation: 'delegated_access.decision_log.write',
          tenantId: input.tenantId,
          reason: input.decision.reason,
          required: plan.required,
          err: err instanceof Error ? err.message : String(err),
        },
        'No se pudo escribir el asiento de la decisión',
      );
      throw err;
    }
  }

  /** Cuenta repeticiones: devuelve -1 si se suprime, o las acumuladas a anotar. */
  private dedup(input: DecisionRecordInput, effect: string): number {
    const key = this.dedupKey(input, effect);
    const at = input.now.getTime();
    if (this.recent.size > DEDUP_SWEEP_SIZE) {
      for (const [k, v] of this.recent) {
        if (at - v.at > DECISION_DEDUP_WINDOW_MS) this.recent.delete(k);
      }
    }
    const last = this.recent.get(key);
    if (last && at - last.at < DECISION_DEDUP_WINDOW_MS) {
      last.suppressed += 1;
      return -1;
    }
    this.recent.set(key, { at, suppressed: 0 });
    return last?.suppressed ?? 0;
  }

  /** Si la escritura falló, las repeticiones no se pierden: vuelven al contador. */
  private carryRepeats(
    input: DecisionRecordInput,
    effect: string,
    repeat: number,
  ): void {
    const key = this.dedupKey(input, effect);
    this.recent.set(key, { at: 0, suppressed: repeat });
  }

  private dedupKey(input: DecisionRecordInput, effect: string): string {
    return [
      input.tenantId,
      input.userId,
      primaryAtomOf(input.action) ?? input.action,
      effect,
      input.decision.reason,
      input.target?.practitionerRoleAssignmentId ?? '',
      input.target?.healthcareServiceId ?? '',
      input.target?.careSpaceId ?? '',
      // N-7: sondear pacientes distintos no es «la misma» denegación.
      input.context?.patientProfileId ?? '',
    ].join('|');
  }

  private rowOf(input: DecisionRecordInput, effect: string, repeat: number) {
    const { decision, context } = input;
    const detail = buildDetail(input, repeat);
    const ip = context?.ip && isIP(context.ip) ? context.ip : undefined;
    const sessionId =
      context?.sessionId && UUID.test(context.sessionId)
        ? context.sessionId
        : undefined;
    return {
      tenantId: input.tenantId,
      userId: input.userId,
      permissionCode: primaryAtomOf(input.action) ?? input.action,
      effectConceptId:
        effect === 'PERMIT'
          ? DELEG.DECISION_EFFECT_PERMIT
          : effect === 'CHALLENGE'
            ? DELEG.DECISION_EFFECT_CHALLENGE
            : DELEG.DECISION_EFFECT_DENY,
      reasonCode: decision.reason,
      grantId: decision.grantId,
      ruleId: input.ruleId,
      practitionerRoleAssignmentId: input.target?.practitionerRoleAssignmentId,
      healthcareServiceId: input.target?.healthcareServiceId,
      careSpaceId: input.target?.careSpaceId,
      patientProfileId: context?.patientProfileId,
      approvalId: context?.proof?.approvalId,
      sessionId,
      ip,
      detail,
      recordedAt: input.now,
      recordedByUserId: input.userId,
    };
  }
}

/** Umbral de registro obligatorio (`SUPPORT_DECISION_LOG_REQUIRED_SENSITIVITY`); lo inválido deja el de siempre. */
export function requiredSensitivity(
  env: Readonly<Record<string, string | undefined>>,
): PermissionSensitivity {
  const raw =
    env.SUPPORT_DECISION_LOG_REQUIRED_SENSITIVITY?.trim().toUpperCase();
  if (raw === 'CRITICA' || raw === 'CRITICAL') return 'CRITICAL';
  if (raw === 'ALTA' || raw === 'HIGH') return 'HIGH';
  return DEFAULT_REQUIRED_SENSITIVITY;
}

/** Valores de `details` que pueden salir en un asiento: números, booleanos, instantes y códigos. */
function safeValue(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/.test(value))
      return value;
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value;
    if (/^[A-Z][A-Z0-9_.]{0,39}$/.test(value)) return value;
    if (/^[a-z][a-z0-9_.-]{0,39}$/.test(value)) return value;
  }
  return undefined;
}

function unmetDetail(unmet: UnmetCondition): Record<string, unknown> {
  const details: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(unmet.details ?? {})) {
    const safe = safeValue(v);
    if (safe !== undefined) details[k] = safe;
  }
  return {
    key: unmet.key,
    code: unmet.code,
    status: unmet.status,
    ...(unmet.source ? { source: unmet.source } : {}),
    ...(Object.keys(details).length > 0 ? { details } : {}),
  };
}

/** `detail_json`: identificadores y números; jamás texto libre ni datos del paciente. */
function buildDetail(
  input: DecisionRecordInput,
  repeat: number,
): Record<string, unknown> {
  const { decision, obligations, readings } = input;
  const challenge = decision.challenge
    ? {
        kind: decision.challenge.kind,
        ...Object.fromEntries(
          Object.entries(decision.challenge.details)
            .map(([k, v]) => [k, safeValue(v)] as const)
            .filter(([, v]) => v !== undefined),
        ),
      }
    : undefined;
  const asked = input.action !== (primaryAtomOf(input.action) ?? input.action);
  return {
    ...(asked ? { asked: input.action } : {}),
    ...(decision.unmet?.length
      ? { unmet: decision.unmet.map(unmetDetail) }
      : {}),
    ...(challenge ? { challenge } : {}),
    ...(obligations && Object.keys(obligations).length > 0
      ? {
          obligations: {
            ...(obligations.reason
              ? { reasonMinLength: obligations.reason.minLength }
              : {}),
            ...(obligations.stepUp
              ? { stepUpMaxAgeMinutes: obligations.stepUp.maxAgeMinutes }
              : {}),
            ...(obligations.approval
              ? { approvalBy: obligations.approval.by }
              : {}),
          },
        }
      : {}),
    ...(readings?.length
      ? {
          usage: readings.map((r) => ({
            metric: r.metric,
            per: r.per,
            max: r.max,
            used: r.used,
            ok: r.ok,
          })),
        }
      : {}),
    ...(repeat > 0 ? { repeat } : {}),
  };
}
