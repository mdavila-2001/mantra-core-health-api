import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { loadAuthEnv } from '../../../common/auth/auth.env';
import {
  PERMISSION_ATOM_BY_CODE,
  atomMeta,
  atomsOfAction,
  canonicalJson,
  checkActionConditionKeys,
  deviceCookieEnabledFromEnv,
  validateCondition,
  validateGrantsAgainstGuardrails,
  type ConditionError,
  type DraftGrant,
  type ExplainAdminFix,
  type ExplainMissing,
  type ExplainResponse,
  type ExplainUsage,
  type OrgCeilingRule,
  type PolicyTraceStep,
  type SimulationDraft,
  type SupportEvaluationResult,
  type SupportGrantFacts,
  type SupportTargetKind,
  type ValidationIssue,
} from '../domain';

/** Concesión del borrador con su fin de vigencia (el dominio no lo declara; el borrador sí lo trae). */
export type DraftGrantWithEnd = DraftGrant & { readonly validTo?: string };
/** Borrador cuyas concesiones traen fin de vigencia. */
export type DraftWithEnd = Omit<SimulationDraft, 'grants'> & {
  readonly grants: readonly DraftGrantWithEnd[];
};

/** Vida del token de simulación: 10 minutos. */
export const SIMULATION_TOKEN_TTL_MS = 10 * 60_000;

/**
 * Borrador reducido a lo que importa para la decisión (y con orden estable): lo
 * que se firma. Los campos que no cambian lo que la persona puede hacer
 * (`expansionMode`, formato de las fechas) no cuentan, y un tipo de objetivo
 * omitido se infiere de sus referencias, como al guardar.
 */
function normalizeDraft(
  draft: DraftWithEnd | Record<string, unknown>,
): unknown {
  const d = draft as unknown as DraftWithEnd;
  const grants = (d.grants ?? []).map((g): unknown =>
    JSON.parse(
      JSON.stringify({
        id: g.id,
        effect: g.effect ?? 'ALLOW',
        actions: [...new Set(g.actions ?? [])].sort(),
        condition: g.condition,
        actionConditions: g.actionConditions,
        targetKind: g.targetKind ?? inferTargetKind(g),
        practitionerRoleAssignmentId: g.practitionerRoleAssignmentId,
        healthcareServiceId: g.healthcareServiceId,
        careSpaceId: g.careSpaceId,
        practiceSiteId: g.practiceSiteId,
        validTo: g.validTo ? new Date(g.validTo).toISOString() : undefined,
      }),
    ),
  );
  grants.sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b)));
  return {
    mode: d.mode,
    templateCode: d.templateCode ?? null,
    grants,
    removeGrantIds: [...(d.removeGrantIds ?? [])].sort(),
  };
}

/**
 * Clave de firma del token de simulación: derivada del secreto de la API con
 * separación de dominio (el mismo patrón que el cursor de las proyecciones).
 */
function simulationKey(): Buffer {
  return createHmac('sha256', loadAuthEnv().secret)
    .update('delegated_access.simulation.token')
    .digest();
}

/** Firma (HMAC-SHA256, 32 hex) del vínculo, el borrador normalizado y el instante emitido. */
function simulationMac(
  engagementId: string,
  draft: DraftWithEnd | Record<string, unknown>,
  issuedAt36: string,
): string {
  return createHmac('sha256', simulationKey())
    .update(
      canonicalJson({
        engagementId,
        draft: normalizeDraft(draft),
        issuedAt: issuedAt36,
      }),
    )
    .digest('hex')
    .slice(0, 32);
}

/**
 * Token firmado del borrador VALIDADO (`simulationToken`): vale 10 minutos y solo
 * para ESE borrador de ESE vínculo («vi una cosa y guardé otra»). SEG B-B5: la
 * huella es un HMAC con el secreto de la aplicación (antes un SHA-256 de datos
 * públicos que cualquiera podía calcular sin simular) e incluye el instante de
 * emisión, que ya no se puede reescribir para alargar la vigencia.
 *
 * @param engagementId - Vínculo simulado.
 * @param draft - Borrador simulado.
 * @param at - Instante de la simulación.
 * @returns El token `sim_<instante>_<firma>`.
 */
export function simulationTokenOf(
  engagementId: string,
  draft: DraftWithEnd | Record<string, unknown>,
  at: Date,
): string {
  const issued = at.getTime().toString(36);
  return `sim_${issued}_${simulationMac(engagementId, draft, issued)}`;
}

/**
 * Verifica un token contra lo que se quiere guardar (firma HMAC, comparación en
 * tiempo constante).
 *
 * @param token - Token recibido.
 * @param engagementId - Vínculo donde se guarda.
 * @param draft - Lo que se guarda, en la forma del borrador.
 * @param now - Reloj.
 * @returns `OK`, `EXPIRED` (pasaron más de 10 minutos) o `MISMATCH` (no es lo simulado, la firma no es de esta aplicación o no es un token).
 */
export function verifySimulationToken(
  token: string,
  engagementId: string,
  draft: DraftWithEnd | Record<string, unknown>,
  now: Date,
): 'OK' | 'EXPIRED' | 'MISMATCH' {
  const match = /^sim_([0-9a-z]+)_([0-9a-f]{32})$/.exec(token);
  if (!match) return 'MISMATCH';
  const expected = Buffer.from(simulationMac(engagementId, draft, match[1]));
  const received = Buffer.from(match[2]);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return 'MISMATCH';
  }
  const issuedAt = parseInt(match[1], 36);
  return now.getTime() - issuedAt > SIMULATION_TOKEN_TTL_MS ? 'EXPIRED' : 'OK';
}

/** Tipo de objetivo que sale de las referencias del borrador. */
export function inferTargetKind(
  g: Pick<
    DraftGrant,
    | 'practitionerRoleAssignmentId'
    | 'healthcareServiceId'
    | 'careSpaceId'
    | 'practiceSiteId'
  >,
): SupportTargetKind {
  const location = !!g.careSpaceId || !!g.practiceSiteId;
  if (g.practitionerRoleAssignmentId && g.healthcareServiceId)
    return 'PRACTITIONER_SERVICE';
  if (g.practitionerRoleAssignmentId && location)
    return 'PRACTITIONER_LOCATION';
  if (g.practitionerRoleAssignmentId) return 'PRACTITIONER';
  if (g.healthcareServiceId && location) return 'SERVICE_LOCATION';
  if (g.healthcareServiceId) return 'SERVICE';
  if (location) return 'LOCATION';
  return 'ALL';
}

/** Concesión del borrador como hechos del motor (átomos con condición propia incluidos). */
export function grantFactsOfDraft(
  g: DraftGrantWithEnd,
  index: number,
  profileOfRole: (roleId: string) => string | undefined,
): SupportGrantFacts {
  const atomGrants = Object.entries(g.actionConditions ?? {}).map(
    ([atom, condition]) => ({
      atom: atom as never,
      origin: 'ATOM' as const,
      condition,
    }),
  );
  return {
    grantId: g.id ?? `draft:${index}`,
    targetKind:
      (g.targetKind as SupportTargetKind | undefined) ?? inferTargetKind(g),
    practitionerProfileId: g.practitionerRoleAssignmentId
      ? profileOfRole(g.practitionerRoleAssignmentId)
      : undefined,
    healthcareServiceId: g.healthcareServiceId,
    careSpaceId: g.careSpaceId,
    practiceSiteId: g.practiceSiteId,
    expansionMode: g.expansionMode ?? 'DYNAMIC',
    active: true,
    ...(g.validTo ? { validTo: new Date(g.validTo) } : {}),
    actions: g.actions as never,
    effect: g.effect,
    ...(g.condition ? { condition: g.condition } : {}),
    ...(atomGrants.length > 0 ? { atomGrants } : {}),
  };
}

/** Texto del aprobador para «pida la aprobación del …». */
function approverText(by: string | undefined): string {
  if (by === 'DOCTOR') return 'del doctor';
  if (by === 'SERVICE_HEAD') return 'del jefe de servicio';
  return 'de otro administrador';
}

/** Lo que la persona puede hacer para abrir la acción (solo cosas suyas). */
export function missingOf(
  result: SupportEvaluationResult,
  input: { atom?: string; reasonProvided: boolean; stepUpFresh: boolean },
): ExplainMissing[] {
  const { decision } = result;
  if (decision.allowed) return [];
  const out: ExplainMissing[] = [];
  const meta = input.atom ? atomMeta(input.atom) : undefined;
  const challenge = decision.challenge;
  const details = (challenge?.details ?? {}) as Record<string, unknown>;
  if (challenge?.kind === 'APPROVAL') {
    const by =
      typeof details.approverKind === 'string'
        ? details.approverKind
        : (meta?.approvalMode ?? 'SECOND_APPROVER');
    const ttl = Number(
      result.obligations.approval?.ttlMinutes ?? details.ttlMinutes ?? 60,
    );
    out.push({
      kind: 'APPROVAL',
      by,
      message: `Pida la aprobación ${approverText(by)} (queda vigente ${ttl} minutos).`,
      fix: { type: 'REQUEST_APPROVAL', approverKind: by },
    });
  }
  const needsReason =
    challenge?.kind === 'REASON' ||
    (!input.reasonProvided &&
      (meta?.requiresReason || !!result.obligations.reason));
  if (needsReason) {
    const min = Number(
      result.obligations.reason?.minLength ?? details.minLength ?? 10,
    );
    out.push({
      kind: 'REASON',
      message: `Escriba el motivo (al menos ${min} caracteres).`,
      fix: { type: 'PROVIDE_REASON', minLength: min },
    });
  }
  if (
    challenge?.kind === 'STEP_UP' ||
    challenge?.kind === 'STEP_UP_ENROLL' ||
    (!input.stepUpFresh &&
      (meta?.requiresStepUp || !!result.obligations.stepUp))
  ) {
    out.push({
      kind: 'STEP_UP',
      message:
        'Confirme su identidad con el código de su aplicación de verificación.',
      fix: {
        type: 'STEP_UP',
        maxAgeMinutes: Number(
          result.obligations.stepUp?.maxAgeMinutes ??
            details.maxAgeMinutes ??
            10,
        ),
      },
    });
  }
  const reason = String(decision.reason);
  if (reason === 'NETWORK_NOT_ALLOWED') {
    out.push({
      kind: 'NETWORK',
      message: 'Conéctese desde la red de la organización.',
      fix: { type: 'USE_ORG_NETWORK' },
    });
  } else if (reason === 'DEVICE_NOT_TRUSTED') {
    out.push({
      kind: 'DEVICE',
      message: 'Use un equipo de confianza de la organización.',
      fix: { type: 'USE_TRUSTED_DEVICE' },
    });
  } else if (reason === 'TIME_WINDOW' || reason === 'LIMIT_EXCEEDED') {
    out.push({
      kind: 'WAIT',
      message:
        reason === 'TIME_WINDOW'
          ? 'Vuelva a intentarlo dentro del horario permitido.'
          : 'Vuelva a intentarlo cuando se renueve el tope.',
      fix: { type: 'WAIT' },
    });
  }
  return out;
}

/** Lo que un administrador puede cambiar para abrir la acción. */
export function adminFixesOf(
  result: SupportEvaluationResult,
  atom: string | undefined,
): ExplainAdminFix[] {
  const { decision, trace } = result;
  if (decision.allowed) return [];
  const out: ExplainAdminFix[] = [];
  const reason = String(decision.reason);
  const name = atom
    ? (PERMISSION_ATOM_BY_CODE.get(atom)?.name ?? atom)
    : 'el permiso';
  if (reason === 'ACTION_NOT_GRANTED') {
    out.push({ type: 'ADD_ATOM', message: `Agregar el permiso «${name}».` });
  } else if (reason === 'NO_COVERING_GRANT') {
    out.push({
      type: 'WIDEN_COVERAGE',
      message:
        'Ampliar la cobertura del permiso al doctor, servicio o consultorio.',
    });
  } else if (reason === 'DOCTOR_NOT_ACCEPTED') {
    out.push({
      type: 'ACCEPT_DOCTOR',
      message: 'El doctor debe aceptar a la persona.',
    });
  } else if (reason === 'EXPLICIT_DENY') {
    out.push({
      type: 'REMOVE_DENY',
      grantId: decision.grantId,
      message: 'Quitar la prohibición expresa.',
    });
  }
  for (const step of trace.steps) {
    if (step.passed || step.layer !== 'CONDITION' || !step.conditionPath)
      continue;
    out.push({
      type: 'RELAX_CONDITION',
      ...(step.grantId ? { grantId: step.grantId } : {}),
      conditionPath: step.conditionPath,
      message: 'Aflojar o quitar esa condición del permiso.',
    });
  }
  return out;
}

/** Contadores que la decisión leyó (`3 de 20`). */
export function usageOfResult(
  result: SupportEvaluationResult,
  atom: string | undefined,
): ExplainUsage[] {
  return result.usage.readings.map((r) => ({
    key: `${r.metric}/${r.per}/${atom ?? ''}`,
    used: r.used,
    max: r.max,
    ...(r.resetsAt ? { resetsAt: r.resetsAt } : {}),
  }));
}

/** Qué paso decidió, en la forma del contrato. */
function decidedByOf(
  result: SupportEvaluationResult,
): ExplainResponse['decidedBy'] {
  const steps = result.trace.steps;
  const step: PolicyTraceStep | undefined =
    steps.find((s) => s.order === result.trace.decidedByStep) ??
    steps[steps.length - 1];
  return {
    layer: step?.layer ?? 'ENGAGEMENT',
    step: step?.order ?? 0,
    ...(step?.grantId ? { grantId: step.grantId } : {}),
    ...(step?.atom ? { atom: step.atom } : {}),
    ...(step?.conditionPath ? { conditionPath: step.conditionPath } : {}),
  };
}

/** Una oración que resume la decisión para quien no lee la traza. */
function summaryOf(result: SupportEvaluationResult, who: string): string {
  const { decision, trace } = result;
  const decided =
    trace.steps.find((s) => s.order === trace.decidedByStep) ??
    trace.steps.at(-1);
  if (decision.allowed) return `${who} puede hacer esto.`;
  const why = decided?.message ?? 'La política no lo permite.';
  return decision.effect === 'CHALLENGE'
    ? `${who} no puede hacerlo por sí sola: ${why}`
    : `${who} no puede hacer esto: ${why}`;
}

/** Respuesta de «explicar» desde el resultado del motor. */
export function buildExplainResponse(
  result: SupportEvaluationResult,
  input: {
    who: string;
    at: Date;
    atom?: string;
    reasonProvided: boolean;
    stepUpFresh: boolean;
  },
): ExplainResponse {
  const { decision } = result;
  return {
    decision: {
      effect: decision.effect ?? (decision.allowed ? 'PERMIT' : 'DENY'),
      allowed: decision.allowed,
      reason: decision.reason,
      ...(decision.atom ? { atom: decision.atom } : {}),
      ...(decision.grantId ? { grantId: decision.grantId } : {}),
    },
    summary: summaryOf(result, input.who),
    decidedBy: decidedByOf(result),
    reasons: result.trace.steps,
    missing: missingOf(result, input),
    adminFixes: adminFixesOf(result, input.atom),
    obligations: result.obligations ?? {},
    visibleFields: decision.visibleFields ?? {},
    usage: usageOfResult(result, input.atom),
    ...(decision.challenge
      ? { challenge: { kind: decision.challenge.kind } }
      : {}),
    evaluatedAt: input.at.toISOString(),
    correlationId: randomUUID(),
  };
}

/** Un error de condición con la ruta del borrador. */
function conditionIssue(prefix: string, e: ConditionError): ValidationIssue {
  return {
    code: e.code,
    path: e.path ? `${prefix}.${e.path}` : prefix,
    message: e.message,
  };
}

/**
 * Valida un borrador (guardarraíles de plataforma y de la organización,
 * condiciones). Devuelve los errores del BORRADOR con la ruta de cada uno; nunca
 * lanza (el borrador malo viaja en `validation`, no como 4xx).
 *
 * @param draft - Borrador a validar.
 * @param input - Plantilla de la persona, reloj, techos de la organización y quién lo guarda.
 * @returns Los errores.
 */
export function validateDraft(
  draft: DraftWithEnd,
  input: {
    templateCode: string;
    now: Date;
    orgCeilingRules: readonly OrgCeilingRule[];
    delegatedAdmin: boolean;
  },
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const violations = validateGrantsAgainstGuardrails({
    templateCode: input.templateCode,
    grants: draft.grants.map((g) => ({
      atoms: g.actions,
      effect: g.effect,
      ...(g.validTo ? { validTo: new Date(g.validTo) } : {}),
    })),
    now: input.now,
    orgCeilingRules: input.orgCeilingRules,
    actor: { delegatedAdmin: input.delegatedAdmin },
  });
  for (const v of violations) {
    const grant = draft.grants[v.grantIndex];
    const actionIndex = grant.actions.findIndex((a) =>
      atomsOfAction(a).some((x) => x.atom === v.atom),
    );
    const name = v.atom
      ? (PERMISSION_ATOM_BY_CODE.get(v.atom)?.name ?? v.atom)
      : '';
    const orgMessage = (v.details as { message?: string } | undefined)?.message;
    errors.push({
      code: v.code,
      path:
        actionIndex >= 0
          ? `grants[${v.grantIndex}].actions[${actionIndex}]`
          : `grants[${v.grantIndex}]`,
      message: guardrailMessage(v.code, name, input.templateCode, orgMessage),
    });
  }
  draft.grants.forEach((g, i) => {
    if (g.condition) {
      for (const e of validateCondition(g.condition, {
        effect: g.effect,
        grantAtoms: g.actions,
        deviceCookieEnabled: deviceCookieEnabledFromEnv(process.env),
      })) {
        errors.push(conditionIssue(`grants[${i}].condition`, e));
      }
    }
    // Primero las claves: un tope y el primer error (no uno por clave inventada).
    const keyError = checkActionConditionKeys(
      Object.keys(g.actionConditions ?? {}),
    );
    if (keyError) {
      errors.push(conditionIssue(`grants[${i}]`, keyError));
      return;
    }
    for (const [atom, condition] of Object.entries(g.actionConditions ?? {})) {
      for (const e of validateCondition(condition, {
        atom,
        effect: g.effect,
        grantAtoms: g.actions,
        deviceCookieEnabled: deviceCookieEnabledFromEnv(process.env),
      })) {
        errors.push(conditionIssue(`grants[${i}].actionConditions.${atom}`, e));
      }
    }
  });
  return errors;
}

export function guardrailMessage(
  code: string,
  atomName: string,
  templateCode: string,
  orgMessage?: string,
): string {
  switch (code) {
    case 'GUARDRAIL_NOT_DELEGABLE':
      return `«${atomName}» no se puede dar al personal de apoyo.`;
    case 'GUARDRAIL_CEILING_EXCEEDED':
      return orgMessage
        ? `«${atomName}» no cabe en el techo de la plantilla (regla de la organización: «${orgMessage}»).`
        : `«${atomName}» no cabe en el techo de la plantilla «${templateCode}».`;
    case 'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM':
      return `Un administrador delegado no puede dar «${atomName}».`;
    case 'GUARDRAIL_CRITICAL_REQUIRES_EXPIRY':
      return 'Un permiso crítico necesita fecha de fin y dura como máximo 90 días.';
    default:
      return 'El permiso no cumple una regla de la plataforma.';
  }
}
