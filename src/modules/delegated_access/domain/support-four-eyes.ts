import { canonicalJson, sha256Hex } from './support-canonical-json';
import type { ApprovalBy } from './support-conditions';
import { targetWithin, type GrantTargetFacts } from './support-grant-targets';
import type {
  PermissionApprovalMode,
  PermissionSensitivity,
} from './support-permission-catalog';
import type { AdminScope } from './support-reviewer-resolver';

/**
 * Aprobaciones de cuatro ojos (CONTRATO-GOBIERNO §6.5), parte pura: quién puede
 * aprobar, la máquina de estados, el TTL, el consumo único y el hash del cuerpo.
 * El servicio solo orquesta persistencia y notificaciones.
 */

/** Para qué se pide (`delegated_access:FOUR_EYES_KIND_*` sin el prefijo). */
export const FOUR_EYES_KINDS = [
  'ACTION',
  'GRANT_CHANGE',
  'SOD_EXCEPTION',
  'REACTIVATION',
  'ENGAGEMENT_MOVE',
] as const;
export type FourEyesKind = (typeof FOUR_EYES_KINDS)[number];

/** Estado (`delegated_access:FOUR_EYES_*` sin el prefijo). */
export const FOUR_EYES_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'EXECUTED',
] as const;
export type FourEyesStatus = (typeof FOUR_EYES_STATUSES)[number];

/** Clase de aprobador (`authz:APPROVAL_*` sin el prefijo); misma lista que la condición `approval.by`. */
export type FourEyesApproverKind = ApprovalBy;

/** Razones de falla estables (409/403) y las internas que traduce el llamador. */
export type FourEyesFailure =
  | 'FOUR_EYES_SELF_APPROVAL'
  | 'FOUR_EYES_NOT_ELIGIBLE'
  | 'FOUR_EYES_NOT_PENDING'
  | 'FOUR_EYES_EXPIRED'
  | 'FOUR_EYES_PAYLOAD_CHANGED'
  | 'FOUR_EYES_ALREADY_CONSUMED'
  /** Interna: 404 uniforme para quien no es el dueño de la solicitud. */
  | 'NOT_FOUND'
  /** Interna: la solicitud no está aprobada; la política responde `APPROVAL_REQUIRED`. */
  | 'NOT_APPROVED'
  /** Interna: rechazar exige comentario (422). */
  | 'COMMENT_REQUIRED';

/** Valores por defecto (ajustes y `obligations.approval.ttlMinutes`). */
export const FOUR_EYES_DEFAULTS = {
  /** Pendiente de una acción del día: 24 h. */
  pendingActionHours: 24,
  /** Pendiente de un cambio administrativo: 7 días. */
  pendingAdminDays: 7,
  /** Vigencia de una acción aprobada, en minutos. */
  actionTtlMinutes: 60,
  /** Largo mínimo del comentario al rechazar. */
  rejectCommentMinLength: 5,
} as const;

/** Estado de una solicitud (fila de `four_eyes_requests` que la lógica necesita). */
export interface FourEyesRequestState {
  readonly id: string;
  readonly kind: FourEyesKind;
  readonly status: FourEyesStatus;
  readonly requesterUserId: string;
  /** Beneficiario (la persona a quien afecta); `null` si no hay. */
  readonly subjectUserId?: string | null;
  readonly approverKind: FourEyesApproverKind;
  readonly permissionCode?: string | null;
  /** SHA-256 del cuerpo canónico. */
  readonly payloadHash: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly decidedAt?: Date;
  readonly decidedByUserId?: string;
  readonly decisionComment?: string;
  readonly approvedUntil?: Date;
  readonly consumedAt?: Date;
  readonly executedAt?: Date;
}

const TRANSITIONS: Readonly<Record<FourEyesStatus, readonly FourEyesStatus[]>> =
  {
    PENDING: ['APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
    APPROVED: ['EXECUTED', 'EXPIRED'],
    REJECTED: [],
    EXPIRED: [],
    CANCELLED: [],
    EXECUTED: [],
  };

/** ¿Existe la transición `from → to`? (`PENDING → APPROVED → EXECUTED`, o `REJECTED`, `EXPIRED`, `CANCELLED`). */
export function canTransition(
  from: FourEyesStatus,
  to: FourEyesStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Hash del cuerpo: SHA-256 sobre JSON canónico (claves ordenadas), 64 hex en
 * minúscula. Es lo que se compara al ejecutar para detectar que el cuerpo cambió.
 */
export function hashPayload(payload: unknown): string {
  return sha256Hex(canonicalJson(payload));
}

/** ¿El cuerpo coincide con el hash guardado? */
export function payloadMatches(payloadHash: string, payload: unknown): boolean {
  return hashPayload(payload) === payloadHash;
}

/** Lo que identifica una acción aprobada: átomo, objetivo, paciente y hora de la cita. */
export interface ActionPayloadInput {
  readonly atom: string;
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly patientProfileId?: string;
  readonly appointmentStartAt?: Date;
}

/**
 * Cuerpo canónico de una acción (`ACTION`): lo ausente no existe y la hora va
 * en ISO UTC. Se firma con `hashPayload` al pedir y se vuelve a calcular al usar.
 */
export function actionPayload(
  input: ActionPayloadInput,
): Record<string, string> {
  const out: Record<string, string> = { atom: input.atom };
  if (input.practitionerRoleAssignmentId)
    out.practitionerRoleAssignmentId = input.practitionerRoleAssignmentId;
  if (input.healthcareServiceId)
    out.healthcareServiceId = input.healthcareServiceId;
  if (input.careSpaceId) out.careSpaceId = input.careSpaceId;
  if (input.patientProfileId) out.patientProfileId = input.patientProfileId;
  if (input.appointmentStartAt)
    out.appointmentStartAt = input.appointmentStartAt.toISOString();
  return out;
}

/** Vencimiento de lo pendiente: 24 h (`ACTION`) o 7 días (administrativas). */
export function pendingExpiryFor(kind: FourEyesKind, createdAt: Date): Date {
  const ms =
    kind === 'ACTION'
      ? FOUR_EYES_DEFAULTS.pendingActionHours * 3_600_000
      : FOUR_EYES_DEFAULTS.pendingAdminDays * 86_400_000;
  return new Date(createdAt.getTime() + ms);
}

/**
 * Hasta cuándo se puede usar una acción aprobada: decisión + TTL (60 min por
 * defecto). Solo `ACTION`; las administrativas se ejecutan al aprobarse.
 */
export function approvedUntilFor(
  kind: FourEyesKind,
  decidedAt: Date,
  ttlMinutes?: number,
): Date | undefined {
  if (kind !== 'ACTION') return undefined;
  const ttl =
    ttlMinutes !== undefined && Number.isFinite(ttlMinutes) && ttlMinutes > 0
      ? ttlMinutes
      : FOUR_EYES_DEFAULTS.actionTtlMinutes;
  return new Date(decidedAt.getTime() + ttl * 60_000);
}

/** Motivo de suspensión (para reactivar). */
export type SuspensionReasonCode =
  | 'MANUAL'
  | 'LEAVE'
  | 'INVESTIGATION'
  | 'INACTIVITY'
  | 'RECERTIFICATION_LAPSED';

/** Qué aprobación se necesita. */
export interface ApprovalNeed {
  readonly kind: FourEyesKind;
  /** Clase pedida (por el átomo o por el tipo de cambio). */
  readonly approverKind: FourEyesApproverKind;
  readonly requesterUserId: string;
  /** Beneficiario. */
  readonly subjectUserId?: string | null;
  /** Quienes otorgaron o aprobaron la misma concesión (parentesco de cadena). */
  readonly chainUserIds?: ReadonlyArray<string | null | undefined>;
  /** `CRITICAL` limita a `SECURITY_ADMIN` con paso extra. */
  readonly sensitivity?: PermissionSensitivity;
  /** Objetivo de la acción o de lo gestionado (para el jefe de servicio). */
  readonly target?: GrantTargetFacts;
  /** `REACTIVATION`: por investigación solo `SECURITY_ADMIN`. */
  readonly suspensionReason?: SuspensionReasonCode;
}

/** Quién existe para aprobar (con membresía viva: el llamador ya filtró). */
export interface ApproverDirectory {
  readonly securityAdminUserIds: readonly string[];
  /** Cuentas del doctor titular de la agenda de la acción. */
  readonly doctorUserIds: readonly string[];
  /** Alcance de los administradores delegados. */
  readonly serviceHeadScopes: readonly AdminScope[];
}

/** Aprobadores elegibles de una solicitud. */
export interface EligibleApprovers {
  /** Clase efectiva (puede diferir de la pedida si cayó a segundo aprobador). */
  readonly approverKind: FourEyesApproverKind;
  readonly userIds: readonly string[];
  /** ¿Cayó a segundo aprobador por no haber de la clase pedida? */
  readonly fellBack: boolean;
  /** ¿Quien apruebe necesita paso extra? (CRÍTICA). */
  readonly requiresStepUp: boolean;
  /** Candidatos descartados (pedido, beneficiario, cadena). */
  readonly excludedUserIds: readonly string[];
}

/** Modo de aprobación del catálogo → clase de aprobador. */
export function approverKindForAtom(
  mode: PermissionApprovalMode | null,
): FourEyesApproverKind | null {
  return mode;
}

const sortedUnique = (ids: Iterable<string>): string[] =>
  [...new Set(ids)].sort();

function heads(need: ApprovalNeed, directory: ApproverDirectory): string[] {
  const target = need.target;
  if (!target) return [];
  return directory.serviceHeadScopes
    .filter((s) => targetWithin(target, s.target))
    .map((s) => s.adminUserId);
}

/**
 * Quién puede aprobar (calculado al decidir): `DOCTOR` → el titular de la
 * agenda; `SERVICE_HEAD` → administrador delegado cuyo alcance contiene el
 * objetivo; `SECOND_APPROVER` → otro `SECURITY_ADMIN`. Siempre: aprobador ≠ quien
 * pide ≠ beneficiario y sin parentesco de cadena. Sin aprobador de la clase
 * pedida cae a segundo aprobador. CRÍTICA, y reactivar por investigación, solo
 * `SECURITY_ADMIN`; CRÍTICA además exige paso extra.
 */
export function eligibleApprovers(
  need: ApprovalNeed,
  directory: ApproverDirectory,
): EligibleApprovers {
  const excluded = new Set<string>([need.requesterUserId]);
  if (need.subjectUserId) excluded.add(need.subjectUserId);
  for (const id of need.chainUserIds ?? []) if (id) excluded.add(id);

  const critical = need.sensitivity === 'CRITICAL';
  const securityOnly =
    critical ||
    (need.kind === 'REACTIVATION' && need.suspensionReason === 'INVESTIGATION');
  const admins = sortedUnique(directory.securityAdminUserIds);

  let kind: FourEyesApproverKind = securityOnly
    ? 'SECOND_APPROVER'
    : need.approverKind;
  let pool: string[];
  if (need.kind === 'REACTIVATION' && !securityOnly) {
    kind = 'SECOND_APPROVER';
    pool = sortedUnique([...admins, ...heads(need, directory)]);
  } else if (kind === 'DOCTOR') {
    pool = sortedUnique(directory.doctorUserIds);
  } else if (kind === 'SERVICE_HEAD') {
    pool = sortedUnique(heads(need, directory));
  } else {
    pool = admins;
  }
  let userIds = pool.filter((id) => !excluded.has(id));
  let fellBack = false;
  if (userIds.length === 0 && kind !== 'SECOND_APPROVER') {
    fellBack = true;
    kind = 'SECOND_APPROVER';
    pool = admins;
    userIds = pool.filter((id) => !excluded.has(id));
  }
  return {
    approverKind: kind,
    userIds,
    fellBack,
    requiresStepUp: critical,
    excludedUserIds: pool.filter((id) => excluded.has(id)),
  };
}

/** ¿Esta persona puede aprobar? Distingue el autoaprobarse del no ser elegible. */
export function checkApproverEligibility(
  need: ApprovalNeed,
  approverUserId: string,
  directory: ApproverDirectory,
):
  | { readonly eligible: true }
  | {
      readonly eligible: false;
      readonly reason: 'FOUR_EYES_SELF_APPROVAL' | 'FOUR_EYES_NOT_ELIGIBLE';
    } {
  if (
    approverUserId === need.requesterUserId ||
    (!!need.subjectUserId && approverUserId === need.subjectUserId)
  ) {
    return { eligible: false, reason: 'FOUR_EYES_SELF_APPROVAL' };
  }
  return eligibleApprovers(need, directory).userIds.includes(approverUserId)
    ? { eligible: true }
    : { eligible: false, reason: 'FOUR_EYES_NOT_ELIGIBLE' };
}

/** Resultado de una operación sobre una solicitud. */
export type FourEyesResult =
  | { readonly ok: true; readonly request: FourEyesRequestState }
  | {
      readonly ok: false;
      readonly reason: FourEyesFailure;
      readonly shouldMarkExpired?: boolean;
    };

/**
 * Decide una solicitud pendiente. Orden de las verificaciones: debe estar
 * `PENDING`; no vencida; quien decide no es quien pide ni el beneficiario; es
 * elegible; rechazar exige comentario. Aprobar una `ACTION` fija
 * `approved_until` y `expires_at` a decisión + TTL; las administrativas
 * conservan su vencimiento (se ejecutan en la misma transacción).
 */
export function decideFourEyes(input: {
  readonly request: FourEyesRequestState;
  readonly decision: 'APPROVE' | 'REJECT';
  readonly approverUserId: string;
  readonly comment?: string;
  readonly now: Date;
  readonly need: ApprovalNeed;
  readonly directory: ApproverDirectory;
  readonly ttlMinutes?: number;
}): FourEyesResult {
  const { request, now } = input;
  if (request.status !== 'PENDING')
    return { ok: false, reason: 'FOUR_EYES_NOT_PENDING' };
  if (now.getTime() >= request.expiresAt.getTime()) {
    return { ok: false, reason: 'FOUR_EYES_EXPIRED', shouldMarkExpired: true };
  }
  const eligibility = checkApproverEligibility(
    input.need,
    input.approverUserId,
    input.directory,
  );
  if (!eligibility.eligible) return { ok: false, reason: eligibility.reason };
  const comment = (input.comment ?? '').trim();
  if (input.decision === 'REJECT') {
    if (comment.length < FOUR_EYES_DEFAULTS.rejectCommentMinLength) {
      return { ok: false, reason: 'COMMENT_REQUIRED' };
    }
    return {
      ok: true,
      request: {
        ...request,
        status: 'REJECTED',
        decidedAt: now,
        decidedByUserId: input.approverUserId,
        decisionComment: comment,
      },
    };
  }
  const approvedUntil = approvedUntilFor(request.kind, now, input.ttlMinutes);
  return {
    ok: true,
    request: {
      ...request,
      status: 'APPROVED',
      decidedAt: now,
      decidedByUserId: input.approverUserId,
      ...(comment ? { decisionComment: comment } : {}),
      ...(approvedUntil ? { approvedUntil, expiresAt: approvedUntil } : {}),
    },
  };
}

/**
 * Consume la aprobación de una `ACTION`: una sola vez, vigente, con el mismo
 * solicitante y el mismo cuerpo (átomo, objetivo, paciente, hora). El servicio
 * lo respalda con `UPDATE … SET consumed_at = now() WHERE id = ? AND consumed_at IS NULL`;
 * esta función es el modelo de esa comparación y fijación.
 */
export function consumeFourEyes(input: {
  readonly request: FourEyesRequestState;
  readonly requesterUserId: string;
  readonly payload: unknown;
  readonly now: Date;
}): FourEyesResult {
  const { request, now } = input;
  if (request.requesterUserId !== input.requesterUserId)
    return { ok: false, reason: 'NOT_FOUND' };
  if (request.consumedAt)
    return { ok: false, reason: 'FOUR_EYES_ALREADY_CONSUMED' };
  if (request.kind !== 'ACTION') return { ok: false, reason: 'NOT_APPROVED' };
  if (request.status === 'EXPIRED')
    return { ok: false, reason: 'FOUR_EYES_EXPIRED' };
  if (request.status !== 'APPROVED')
    return { ok: false, reason: 'NOT_APPROVED' };
  const until = request.approvedUntil ?? request.expiresAt;
  if (now.getTime() >= until.getTime()) {
    return { ok: false, reason: 'FOUR_EYES_EXPIRED', shouldMarkExpired: true };
  }
  if (!payloadMatches(request.payloadHash, input.payload)) {
    return { ok: false, reason: 'FOUR_EYES_PAYLOAD_CHANGED' };
  }
  return {
    ok: true,
    request: {
      ...request,
      status: 'EXECUTED',
      consumedAt: now,
      executedAt: now,
    },
  };
}

/** Qué hace el barrido con una solicitud: `EXPIRE` o nada. */
export function sweepAction(
  request: FourEyesRequestState,
  now: Date,
): 'EXPIRE' | null {
  const t = now.getTime();
  if (request.status === 'PENDING')
    return t >= request.expiresAt.getTime() ? 'EXPIRE' : null;
  if (request.status === 'APPROVED' && !request.consumedAt) {
    return t >= (request.approvedUntil ?? request.expiresAt).getTime()
      ? 'EXPIRE'
      : null;
  }
  return null;
}

/** La solicitud ya vencida (`EXPIRED`), o `undefined` si todavía no corresponde. */
export function expireFourEyes(
  request: FourEyesRequestState,
  now: Date,
): FourEyesRequestState | undefined {
  return sweepAction(request, now) === 'EXPIRE'
    ? { ...request, status: 'EXPIRED' }
    : undefined;
}

/** Cancela una solicitud pendiente; solo quien la pidió. */
export function cancelFourEyes(input: {
  readonly request: FourEyesRequestState;
  readonly byUserId: string;
  readonly now: Date;
}): FourEyesResult {
  if (input.request.requesterUserId !== input.byUserId)
    return { ok: false, reason: 'NOT_FOUND' };
  if (input.request.status !== 'PENDING')
    return { ok: false, reason: 'FOUR_EYES_NOT_PENDING' };
  return { ok: true, request: { ...input.request, status: 'CANCELLED' } };
}

/**
 * ¿Ya hay una solicitud pendiente igual? (`FOUR_EYES_DUPLICATE_PENDING`; misma
 * clave que el índice único: tipo, solicitante, permiso y hash del cuerpo).
 */
export function isDuplicatePending(
  existing: readonly FourEyesRequestState[],
  candidate: {
    readonly kind: FourEyesKind;
    readonly requesterUserId: string;
    readonly permissionCode?: string | null;
    readonly payloadHash: string;
  },
): boolean {
  return existing.some(
    (r) =>
      r.status === 'PENDING' &&
      r.kind === candidate.kind &&
      r.requesterUserId === candidate.requesterUserId &&
      (r.permissionCode ?? '') === (candidate.permissionCode ?? '') &&
      r.payloadHash === candidate.payloadHash,
  );
}
