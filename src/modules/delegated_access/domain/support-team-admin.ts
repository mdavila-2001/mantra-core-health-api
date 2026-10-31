import {
  SUPPORT_TEMPLATE_CODES,
  type SupportTemplateCode,
} from './support-actions';
import { DELEGATED_ADMIN_FORBIDDEN_ATOMS } from './support-guardrails';
import { targetWithin, type GrantTargetFacts } from './support-grant-targets';
import {
  atomsOfAction,
  expandAtomPattern,
  type SupportAtomCode,
} from './support-permission-catalog';
import { TEMPLATE_CEILINGS } from './support-template-packages';

/**
 * Administración delegada con techo (CONTRATO-GOBIERNO §6.4), parte pura de
 * `TeamAdminPolicy`: techo efectivo, validación de lo que otorga un jefe de
 * servicio o de piso y alcance sobre toda la persona.
 */

const DAY_MS = 86_400_000;

/** `delegationCeiling` de la concesión `team.grants.assign` de un delegado. */
export interface DelegationCeilingInput {
  readonly allowAtoms?: readonly string[];
  readonly forbidAtoms?: readonly string[];
  readonly templates?: readonly string[];
  readonly maxValidDays?: number;
}

/** Techo del preajuste «Jefe de servicio» (`TEAM_ADMIN_PRESET`, D-10). */
export const TEAM_ADMIN_PRESET_CEILING: Required<DelegationCeilingInput> = {
  allowAtoms: [
    'agenda.*',
    'patients.search.exact',
    'patients.profile.view_basic',
    'messages.inbox.view',
    'messages.conversation.reply_on_behalf',
    'messages.template.use',
  ],
  forbidAtoms: [],
  templates: [
    'SECRETARY',
    'MEDICAL_ASSISTANT',
    'NURSING',
    'FRONT_DESK',
    'CALL_CENTER',
  ],
  maxValidDays: 180,
};

/** Regla de la organización que recorta el techo (`DENY_PERMISSION` o `CEILING`). */
export interface TeamAdminOrgRule {
  readonly kind: 'DENY_PERMISSION' | 'CEILING';
  /** Plantilla a la que aplica; ausente = todas (`CEILING` la exige en el contrato). */
  readonly roleTemplateCode?: string | null;
  readonly permissionPattern: string;
}

/**
 * Techo efectivo del delegado para una persona: `(allowAtoms ∩ techo de la
 * plantilla de la persona) − forbidAtoms − átomos prohibidos al delegado (GP-5)
 * − reglas `CEILING`/`DENY_PERMISSION` de la organización`. La plantilla de la
 * persona debe estar en `templates` (si el techo la lista) y ser de plataforma;
 * si no, no hay átomos.
 *
 * @returns Los átomos, en orden alfabético.
 */
export function effectiveDelegationCeiling(input: {
  readonly ceiling: DelegationCeilingInput;
  readonly subjectTemplateCode: string;
  readonly orgRules?: readonly TeamAdminOrgRule[];
}): SupportAtomCode[] {
  const { ceiling, subjectTemplateCode } = input;
  if (
    !(SUPPORT_TEMPLATE_CODES as readonly string[]).includes(subjectTemplateCode)
  )
    return [];
  if (ceiling.templates && !ceiling.templates.includes(subjectTemplateCode))
    return [];
  const templateAtoms = new Set<SupportAtomCode>(
    TEMPLATE_CEILINGS[subjectTemplateCode as SupportTemplateCode],
  );
  const removed = new Set<SupportAtomCode>();
  const remove = (patterns: readonly string[]): void => {
    for (const p of patterns)
      for (const a of expandAtomPattern(p)) removed.add(a);
  };
  remove(ceiling.forbidAtoms ?? []);
  remove(DELEGATED_ADMIN_FORBIDDEN_ATOMS);
  for (const rule of input.orgRules ?? []) {
    if (
      !rule.roleTemplateCode ||
      rule.roleTemplateCode === subjectTemplateCode
    ) {
      remove([rule.permissionPattern]);
    }
  }
  const allowed = new Set<SupportAtomCode>(
    (ceiling.allowAtoms ?? []).flatMap((p) => expandAtomPattern(p)),
  );
  return [...allowed]
    .filter((a) => templateAtoms.has(a) && !removed.has(a))
    .sort();
}

/** Por qué se rebasa el techo. */
export type CeilingBreach = 'ATOMS' | 'TEMPLATE_NOT_ALLOWED' | 'MAX_VALID_DAYS';

/** Resultado de validar lo que un delegado quiere otorgar. */
export type DelegatedGrantCheck =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: 'ADMIN_SCOPE_EXCEEDED' | 'ADMIN_CEILING_EXCEEDED';
      readonly httpStatus: 403;
      readonly reason?: CeilingBreach;
      /** Átomos que el techo no permite. */
      readonly offendingAtoms?: readonly string[];
      readonly maxValidDays?: number;
    };

/**
 * Valida una concesión que propone un delegado (§6.4 «Otorgar»), en este orden:
 * objetivo dentro de su alcance (403 `ADMIN_SCOPE_EXCEEDED`); plantilla de la
 * persona en el techo; átomos dentro del techo efectivo; `valid_to` ≤ hoy +
 * `maxValidDays` (y obligatorio si el techo lo limita). Fuera del techo no hay
 * aprobación que lo salte: lo hace un `SECURITY_ADMIN` (403 `ADMIN_CEILING_EXCEEDED`).
 *
 * @param input.adminTargets - Objetivos de las concesiones `team.grants.assign` del delegado.
 */
export function checkDelegatedGrant(input: {
  readonly adminTargets: readonly GrantTargetFacts[];
  readonly ceiling: DelegationCeilingInput;
  readonly subjectTemplateCode: string;
  readonly proposed: {
    readonly target: GrantTargetFacts;
    readonly atoms: readonly string[];
    readonly validTo?: Date;
  };
  readonly now: Date;
  readonly orgRules?: readonly TeamAdminOrgRule[];
}): DelegatedGrantCheck {
  const { proposed, ceiling } = input;
  if (!input.adminTargets.some((t) => targetWithin(proposed.target, t))) {
    return { ok: false, code: 'ADMIN_SCOPE_EXCEEDED', httpStatus: 403 };
  }
  if (
    ceiling.templates &&
    !ceiling.templates.includes(input.subjectTemplateCode)
  ) {
    return {
      ok: false,
      code: 'ADMIN_CEILING_EXCEEDED',
      httpStatus: 403,
      reason: 'TEMPLATE_NOT_ALLOWED',
    };
  }
  const allowed = new Set<string>(
    effectiveDelegationCeiling({
      ceiling,
      subjectTemplateCode: input.subjectTemplateCode,
      orgRules: input.orgRules,
    }),
  );
  const offending = new Set<string>();
  for (const code of proposed.atoms) {
    const expanded = atomsOfAction(code);
    if (expanded.length === 0) offending.add(code);
    for (const { atom } of expanded)
      if (!allowed.has(atom)) offending.add(atom);
  }
  if (offending.size > 0) {
    return {
      ok: false,
      code: 'ADMIN_CEILING_EXCEEDED',
      httpStatus: 403,
      reason: 'ATOMS',
      offendingAtoms: [...offending].sort(),
    };
  }
  if (ceiling.maxValidDays !== undefined) {
    const limit = input.now.getTime() + ceiling.maxValidDays * DAY_MS;
    if (!proposed.validTo || proposed.validTo.getTime() > limit) {
      return {
        ok: false,
        code: 'ADMIN_CEILING_EXCEEDED',
        httpStatus: 403,
        reason: 'MAX_VALID_DAYS',
        maxValidDays: ceiling.maxValidDays,
      };
    }
  }
  return { ok: true };
}

/** Concesiones de una persona repartidas según el alcance del delegado. */
export interface ScopePartition {
  /** Las que están dentro (las únicas que el delegado ve con detalle). */
  readonly inScope: readonly GrantTargetFacts[];
  /** «Otras funciones de esta persona: N». */
  readonly outOfScopeCount: number;
  /** Tiene alguna concesión dentro del alcance: es población administrable. */
  readonly administrable: boolean;
}

/** Separa las concesiones de una persona en las del alcance del delegado y las demás. */
export function partitionByScope(
  personGrants: readonly GrantTargetFacts[],
  adminTargets: readonly GrantTargetFacts[],
): ScopePartition {
  const inScope = personGrants.filter((g) =>
    adminTargets.some((t) => targetWithin(g, t)),
  );
  return {
    inScope,
    outOfScopeCount: personGrants.length - inScope.length,
    administrable: inScope.length > 0,
  };
}

/**
 * Suspender, dar de baja o trasladar afecta a TODA la persona: todas sus
 * concesiones vivas deben estar dentro del alcance; si no, 403
 * `ADMIN_SCOPE_EXCEEDED` con la cantidad fuera de alcance (puede «quitarla de mi
 * servicio» con `team.grants.revoke`).
 */
export function checkWholePersonScope(input: {
  readonly personGrants: readonly GrantTargetFacts[];
  readonly adminTargets: readonly GrantTargetFacts[];
}):
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: 'ADMIN_SCOPE_EXCEEDED';
      readonly httpStatus: 403;
      readonly outOfScope: number;
    } {
  const { outOfScopeCount } = partitionByScope(
    input.personGrants,
    input.adminTargets,
  );
  return outOfScopeCount === 0
    ? { ok: true }
    : {
        ok: false,
        code: 'ADMIN_SCOPE_EXCEEDED',
        httpStatus: 403,
        outOfScope: outOfScopeCount,
      };
}
