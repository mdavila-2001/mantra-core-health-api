import {
  SUPPORT_TEMPLATE_CODES,
  type SupportTemplateCode,
} from './support-actions';
import {
  PERMISSION_ATOM_BY_CODE,
  atomMatchesPattern,
  atomsOfAction,
  expandAtomPattern,
  type SupportAtomCode,
} from './support-permission-catalog';
import { TEMPLATE_CEILINGS } from './support-template-packages';

/**
 * Barandillas de plataforma (L0) y techos por plantilla (CONTRATO-GOBIERNO §4).
 * Constantes y validaciones puras: lo que aquí se decide no se puede relajar
 * sin un despliegue.
 */

export { TEMPLATE_CEILINGS };

/** Códigos estables de las barandillas (422 o 403 según el caso). */
export const GUARDRAIL_CODES = [
  'GUARDRAIL_NOT_DELEGABLE',
  'GUARDRAIL_CEILING_EXCEEDED',
  'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM',
  'GUARDRAIL_CRITICAL_REQUIRES_EXPIRY',
  'GUARDRAIL_SELF_SUPERVISION',
  'GUARDRAIL_RULE_LOOSENS_PLATFORM',
  'GUARDRAIL_SELF_ADMIN',
  'GUARDRAIL_PEER_ADMIN',
  'BREAK_GLASS_NOT_FOR_SUPPORT',
] as const;

/** Código de una barandilla. */
export type GuardrailCode = (typeof GUARDRAIL_CODES)[number];

/** Una barandilla de plataforma (L0), con su efecto. */
export interface PlatformGuardrail {
  readonly id: string;
  /** Código del error que da al escribir o decidir (`null` si es estructural). */
  readonly code: GuardrailCode | null;
  readonly httpStatus: 403 | 422 | null;
  /** Qué prohíbe, en lenguaje simple. */
  readonly description: string;
}

/** GP-1…GP-9 (§4.2): lista exacta. */
export const PLATFORM_GUARDRAILS: readonly PlatformGuardrail[] = [
  {
    id: 'GP-1',
    code: 'GUARDRAIL_NOT_DELEGABLE',
    httpStatus: 422,
    description:
      'Los cuatro permisos de administración de seguridad no se dan a personal de apoyo por ninguna plantilla ni concesión.',
  },
  {
    id: 'GP-2',
    code: 'GUARDRAIL_CEILING_EXCEEDED',
    httpStatus: 422,
    description:
      'Una concesión solo puede contener los permisos del techo de la plantilla de la persona.',
  },
  {
    id: 'GP-3',
    code: null,
    httpStatus: null,
    description:
      'Nada clínico directo: el apoyo solo ve el motivo de la cita y puede pedir un acceso temporal que decide el doctor.',
  },
  {
    id: 'GP-4',
    code: 'BREAK_GLASS_NOT_FOR_SUPPORT',
    httpStatus: 403,
    description:
      'El acceso de emergencia (break-glass) no existe para el personal de apoyo.',
  },
  {
    id: 'GP-5',
    code: 'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM',
    httpStatus: 422,
    description:
      'Un administrador delegado no puede dar permisos de equipo, auditoría, anulaciones, devoluciones, descuentos, cierre de caja, corrección de datos verificados, mensajes masivos ni exportaciones.',
  },
  {
    id: 'GP-6',
    code: 'GUARDRAIL_SELF_ADMIN',
    httpStatus: 403,
    description:
      'Nadie otorga, aprueba, certifica ni revoca permisos propios, ni gestiona a otro administrador delegado o de seguridad.',
  },
  {
    id: 'GP-7',
    code: 'GUARDRAIL_CRITICAL_REQUIRES_EXPIRY',
    httpStatus: 422,
    description:
      'Todo permiso con un átomo de sensibilidad crítica exige fecha de fin y dura como máximo 90 días.',
  },
  {
    id: 'GP-8',
    code: 'GUARDRAIL_SELF_SUPERVISION',
    httpStatus: 422,
    description:
      'Una persona de apoyo no puede supervisarse a sí misma ni ser el doctor aceptante de su propia agenda.',
  },
  {
    id: 'GP-9',
    code: null,
    httpStatus: null,
    description:
      'Los permisos fijos y las denegaciones mantienen sus restricciones de base de datos.',
  },
];

/** Máximo de días de un permiso con un átomo CRÍTICA (GP-7). */
export const CRITICAL_GRANT_MAX_DAYS = 90;

/**
 * Patrones de átomos que un administrador delegado nunca otorga (GP-5). Se suman
 * siempre a su `forbidAtoms`.
 */
export const DELEGATED_ADMIN_FORBIDDEN_ATOMS: readonly string[] = [
  'team.*',
  'audit.*',
  'billing.receipt.void',
  'billing.payment.refund',
  'billing.discount.apply',
  'billing.cashbox.close',
  'patients.profile.edit_verified',
  'messages.broadcast.send',
  'reports.*.export',
];

/** ¿El átomo está en la lista de lo que un delegado no puede dar? */
export function isDelegatedAdminForbidden(atom: string): boolean {
  return DELEGATED_ADMIN_FORBIDDEN_ATOMS.some((p) =>
    atomMatchesPattern(atom, p),
  );
}

/** Una regla `CEILING` de la organización (L1): quita un patrón del techo. */
export interface OrgCeilingRule {
  readonly id: string;
  /** Plantilla a la que aplica (obligatoria en el contrato). */
  readonly roleTemplateCode?: string | null;
  readonly permissionPattern: string;
  readonly message?: string;
}

/** Una concesión a validar. */
export interface GuardrailGrantInput {
  /** Átomos o alias que incluye. */
  readonly atoms: readonly string[];
  readonly validTo?: Date;
  readonly effect?: 'ALLOW' | 'DENY';
}

/** Una violación de barandilla. */
export interface GuardrailViolation {
  readonly code: GuardrailCode;
  readonly guardrailId: string;
  readonly httpStatus: 403 | 422;
  readonly atom?: string;
  /** Índice de la concesión en la lista de entrada. */
  readonly grantIndex: number;
  readonly ruleId?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/** Entrada de `validateGrantsAgainstGuardrails`. */
export interface GuardrailValidationInput {
  readonly templateCode: string;
  readonly grants: readonly GuardrailGrantInput[];
  readonly now: Date;
  /** Reglas `CEILING` de la organización. */
  readonly orgCeilingRules?: readonly OrgCeilingRule[];
  /** Quien escribe; un delegado queda además bajo GP-5. */
  readonly actor?: { readonly delegatedAdmin?: boolean };
  /** Techo de una plantilla PROPIA de la organización (átomos); sin él no hay techo de plantilla. */
  readonly templateCeiling?: readonly string[];
}

const DAY_MS = 86_400_000;

function ceilingOf(
  templateCode: string,
  ownCeiling?: readonly string[],
): ReadonlySet<string> | undefined {
  if ((SUPPORT_TEMPLATE_CODES as readonly string[]).includes(templateCode)) {
    return new Set(TEMPLATE_CEILINGS[templateCode as SupportTemplateCode]);
  }
  // Plantilla propia de la organización (SEG A-M7): su techo lo trae quien
  // valida (`inheritedTemplateCeiling`); sin él, como siempre, sin techo propio.
  return ownCeiling ? new Set(ownCeiling) : undefined;
}

/**
 * Techo que heredan las plantillas PROPIAS de una organización (SEG A-M7). GP-2
 * no se relaja creando una plantilla: la propia hereda el techo MÁS restrictivo
 * de plataforma que alcance a cubrir sus acciones por defecto (el más chico en
 * número de permisos; a igualdad, por código). Si ninguno las cubre todas, se
 * rechaza.
 *
 * @param defaultActions - Acciones por defecto de la plantilla (átomos o alias).
 * @returns El techo y la plantilla de plataforma en que se basa, o los átomos que ningún techo admite.
 */
export function inheritedTemplateCeiling(defaultActions: readonly string[]):
  | {
      readonly ok: true;
      readonly ceiling: readonly SupportAtomCode[];
      readonly basedOn: SupportTemplateCode;
    }
  | { readonly ok: false; readonly offendingAtoms: readonly string[] } {
  const wanted = [
    ...new Set(
      defaultActions.flatMap((a) => atomsOfAction(a).map((x) => x.atom)),
    ),
  ];
  const candidates = [...SUPPORT_TEMPLATE_CODES]
    .map((code) => ({ code, atoms: new Set<string>(TEMPLATE_CEILINGS[code]) }))
    .sort(
      (a, b) => a.atoms.size - b.atoms.size || a.code.localeCompare(b.code),
    );
  const fit = candidates.find((c) => wanted.every((a) => c.atoms.has(a)));
  if (fit) {
    return {
      ok: true,
      ceiling: [...TEMPLATE_CEILINGS[fit.code]],
      basedOn: fit.code,
    };
  }
  const best = candidates.reduce((acc, c) =>
    wanted.filter((a) => !c.atoms.has(a)).length <
    wanted.filter((a) => !acc.atoms.has(a)).length
      ? c
      : acc,
  );
  return {
    ok: false,
    offendingAtoms: wanted.filter((a) => !best.atoms.has(a)).sort(),
  };
}

/**
 * Techo de una plantilla propia que aún no tiene uno guardado ni acciones por
 * defecto legibles: lo que TODAS las plantillas de plataforma tienen en común
 * (lo más restrictivo; falla cerrado).
 */
export function mostRestrictiveTemplateCeiling(): SupportAtomCode[] {
  const lists = SUPPORT_TEMPLATE_CODES.map(
    (code) => new Set<string>(TEMPLATE_CEILINGS[code]),
  );
  return [...TEMPLATE_CEILINGS[SUPPORT_TEMPLATE_CODES[0]]].filter((a) =>
    lists.every((l) => l.has(a)),
  );
}

/**
 * Valida concesiones contra GP-1, GP-2, GP-5 y GP-7 y las reglas `CEILING` de
 * la organización. Un alias se valida por los átomos de su paquete. Un código
 * desconocido se ignora, como hoy. Devuelve TODAS las violaciones, en orden de
 * concesión y de átomo.
 *
 * @param input - Plantilla de la persona, concesiones, reloj y reglas.
 * @returns Las violaciones; vacío si todo cabe.
 */
export function validateGrantsAgainstGuardrails(
  input: GuardrailValidationInput,
): GuardrailViolation[] {
  const out: GuardrailViolation[] = [];
  const ceiling = ceilingOf(input.templateCode, input.templateCeiling);
  const rules = (input.orgCeilingRules ?? []).filter(
    (r) => !r.roleTemplateCode || r.roleTemplateCode === input.templateCode,
  );
  input.grants.forEach((grant, grantIndex) => {
    const atoms = [
      ...new Set(
        grant.atoms.flatMap((a) => atomsOfAction(a).map((x) => x.atom)),
      ),
    ];
    if (grant.effect === 'DENY') return;
    let hasCritical = false;
    for (const atom of atoms) {
      const meta = PERMISSION_ATOM_BY_CODE.get(atom);
      if (!meta) continue;
      const push = (
        code: GuardrailCode,
        guardrailId: string,
        extra: Partial<GuardrailViolation> = {},
      ): void => {
        const rail = PLATFORM_GUARDRAILS.find((g) => g.id === guardrailId);
        out.push({
          code,
          guardrailId,
          httpStatus: rail?.httpStatus ?? 422,
          atom,
          grantIndex,
          ...extra,
        });
      };
      if (!meta.supportAssignable) {
        push('GUARDRAIL_NOT_DELEGABLE', 'GP-1');
        continue;
      }
      if (ceiling && !ceiling.has(atom)) {
        push('GUARDRAIL_CEILING_EXCEEDED', 'GP-2');
      } else {
        const rule = rules.find((r) =>
          atomMatchesPattern(atom, r.permissionPattern),
        );
        if (rule) {
          push('GUARDRAIL_CEILING_EXCEEDED', 'GP-2', {
            ruleId: rule.id,
            ...(rule.message ? { details: { message: rule.message } } : {}),
          });
        }
      }
      if (input.actor?.delegatedAdmin && isDelegatedAdminForbidden(atom)) {
        push('GUARDRAIL_DELEGATED_FORBIDDEN_ATOM', 'GP-5');
      }
      if (meta.sensitivity === 'CRITICAL') hasCritical = true;
    }
    if (hasCritical) {
      const limit = input.now.getTime() + CRITICAL_GRANT_MAX_DAYS * DAY_MS;
      const to = grant.validTo?.getTime();
      if (to === undefined || to <= input.now.getTime() || to > limit) {
        const atom = atoms.find(
          (a) => PERMISSION_ATOM_BY_CODE.get(a)?.sensitivity === 'CRITICAL',
        );
        out.push({
          code: 'GUARDRAIL_CRITICAL_REQUIRES_EXPIRY',
          guardrailId: 'GP-7',
          httpStatus: 422,
          atom,
          grantIndex,
          details: { maxDays: CRITICAL_GRANT_MAX_DAYS },
        });
      }
    }
  });
  return out;
}

/** GP-6: nadie administra permisos propios. */
export function checkSelfAdmin(
  actorUserId: string,
  subjectUserId: string,
): GuardrailViolation | undefined {
  return actorUserId === subjectUserId
    ? {
        code: 'GUARDRAIL_SELF_ADMIN',
        guardrailId: 'GP-6',
        httpStatus: 403,
        grantIndex: -1,
      }
    : undefined;
}

/** GP-6: un delegado no gestiona a otro delegado ni a un administrador de seguridad. */
export function checkPeerAdmin(input: {
  readonly subjectIsDelegatedAdmin: boolean;
  readonly subjectIsSecurityAdmin: boolean;
  readonly actorIsSecurityAdmin: boolean;
}): GuardrailViolation | undefined {
  if (input.actorIsSecurityAdmin) return undefined;
  return input.subjectIsDelegatedAdmin || input.subjectIsSecurityAdmin
    ? {
        code: 'GUARDRAIL_PEER_ADMIN',
        guardrailId: 'GP-6',
        httpStatus: 403,
        grantIndex: -1,
      }
    : undefined;
}

/** GP-8: nadie se supervisa a sí mismo. */
export function checkSelfSupervision(
  supervisorUserId: string | undefined,
  userId: string,
): GuardrailViolation | undefined {
  return supervisorUserId !== undefined && supervisorUserId === userId
    ? {
        code: 'GUARDRAIL_SELF_SUPERVISION',
        guardrailId: 'GP-8',
        httpStatus: 422,
        grantIndex: -1,
      }
    : undefined;
}

/** Átomos que cubre un patrón `forbidAtoms` expandido (utilidad del validador). */
export function atomsMatchingPatterns(
  patterns: readonly string[],
): ReadonlySet<SupportAtomCode> {
  return new Set(patterns.flatMap((p) => expandAtomPattern(p)));
}
