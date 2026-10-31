import { effectiveAtoms, type AtomHoldingGrant } from './support-grant-targets';
import {
  PERMISSION_ATOM_BY_CODE,
  SENSITIVITY_WEIGHT,
  atomsOfAction,
  type PermissionSensitivity,
  type SupportAtomCode,
} from './support-permission-catalog';
import { SUPPORT_TEMPLATE_DEFAULTS_V2 } from './support-template-packages';
import { SUPPORT_TEMPLATE_CODES } from './support-actions';

/**
 * Puntaje de privilegios y deriva (CONTRATO-GOBIERNO §6.6, decisión D-20):
 * `puntaje = Σ peso(sensibilidad)` por átomo efectivo distinto (BAJA 1, MEDIA 2,
 * ALTA 5, CRÍTICA 10) y `deriva = puntaje − puntaje del paquete v2 de su
 * plantilla`.
 */

/** Umbral de deriva por defecto (ajuste `creepThreshold`, D-20). */
export const DEFAULT_CREEP_THRESHOLD = 15;
/** Concesiones sin revisión desde la última certificación que también marcan. */
export const DEFAULT_UNREVIEWED_GRANTS_THRESHOLD = 2;

/** Átomos distintos que da una lista de átomos o alias (lo desconocido se ignora). */
function distinctAtoms(codes: Iterable<string>): Set<SupportAtomCode> {
  const out = new Set<SupportAtomCode>();
  for (const code of codes) {
    for (const x of atomsOfAction(code)) out.add(x.atom);
  }
  return out;
}

/**
 * Puntaje de privilegios de un conjunto de átomos. Los alias se expanden, los
 * repetidos cuentan una vez y lo desconocido vale cero.
 *
 * @param atoms - Átomos (o alias heredados).
 */
export function privilegeScore(atoms: Iterable<string>): number {
  let total = 0;
  for (const atom of distinctAtoms(atoms)) {
    const meta = PERMISSION_ATOM_BY_CODE.get(atom);
    if (meta) total += SENSITIVITY_WEIGHT[meta.sensitivity];
  }
  return total;
}

/** Puntaje de lo que una persona tiene hoy: sus permisos `ALLOW` vivos. */
export function privilegeScoreOfGrants(
  grants: readonly AtomHoldingGrant[],
  now: Date,
): number {
  return privilegeScore(effectiveAtoms(grants, now));
}

/**
 * Puntaje del paquete v2 por defecto de una plantilla de plataforma.
 *
 * @returns El puntaje; `undefined` si la plantilla no es de plataforma.
 */
export function templateBaselineScore(
  templateCode: string,
): number | undefined {
  return (SUPPORT_TEMPLATE_CODES as readonly string[]).includes(templateCode)
    ? privilegeScore(
        SUPPORT_TEMPLATE_DEFAULTS_V2[
          templateCode as keyof typeof SUPPORT_TEMPLATE_DEFAULTS_V2
        ],
      )
    : undefined;
}

/** Por qué se marca una acumulación. */
export type CreepReason = 'DRIFT' | 'UNREVIEWED_GRANTS';

/** Resultado de `privilegeCreep`. */
export interface PrivilegeCreepResult {
  readonly score: number;
  /** Puntaje del paquete de su plantilla; `null` si no se conoce. */
  readonly baseline: number | null;
  /** `score − baseline`; `null` sin línea base. Puede ser negativa. */
  readonly drift: number | null;
  readonly threshold: number;
  readonly flaggedByDrift: boolean;
  readonly grantsSinceCertification: number;
  readonly flaggedByUnreviewed: boolean;
  readonly flagged: boolean;
  readonly reasons: readonly CreepReason[];
}

/**
 * Acumulación de privilegios: marca si la deriva llega al umbral o si se le
 * agregaron al menos 2 concesiones desde su última certificación sin pasar por
 * revisión.
 *
 * @param input.atoms - Átomos efectivos de la persona.
 * @param input.templateCode - Plantilla de la persona (da la línea base).
 * @param input.baselineScore - Línea base explícita (plantillas propias de la organización).
 * @param input.threshold - Umbral de deriva (`creepThreshold`); por defecto 15.
 * @param input.grantsSinceCertification - Ver `countGrantsSinceCertification`.
 * @param input.unreviewedGrantsThreshold - Por defecto 2.
 */
export function privilegeCreep(input: {
  readonly atoms: Iterable<string>;
  readonly templateCode?: string | null;
  readonly baselineScore?: number;
  readonly threshold?: number;
  readonly grantsSinceCertification?: number;
  readonly unreviewedGrantsThreshold?: number;
}): PrivilegeCreepResult {
  const score = privilegeScore(input.atoms);
  const baseline =
    input.baselineScore ??
    (input.templateCode
      ? templateBaselineScore(input.templateCode)
      : undefined) ??
    null;
  const threshold = input.threshold ?? DEFAULT_CREEP_THRESHOLD;
  const drift = baseline === null ? null : score - baseline;
  const since = input.grantsSinceCertification ?? 0;
  const flaggedByDrift = drift !== null && drift >= threshold;
  const flaggedByUnreviewed =
    since >=
    (input.unreviewedGrantsThreshold ?? DEFAULT_UNREVIEWED_GRANTS_THRESHOLD);
  const reasons: CreepReason[] = [];
  if (flaggedByDrift) reasons.push('DRIFT');
  if (flaggedByUnreviewed) reasons.push('UNREVIEWED_GRANTS');
  return {
    score,
    baseline,
    drift,
    threshold,
    flaggedByDrift,
    grantsSinceCertification: since,
    flaggedByUnreviewed,
    flagged: reasons.length > 0,
    reasons,
  };
}

/**
 * Concesiones agregadas desde la última certificación sin pasar por revisión:
 * las `ALLOW` creadas después de la certificación (o, si nunca la hubo, después
 * de nacer el vínculo, de modo que lo inicial no cuenta) y no marcadas como
 * revisadas (por un «mover» o una campaña).
 */
export function countGrantsSinceCertification(input: {
  readonly grants: ReadonlyArray<{
    readonly createdAt: Date;
    readonly reviewed?: boolean;
    readonly effect?: 'ALLOW' | 'DENY';
  }>;
  readonly lastCertifiedAt?: Date | null;
  readonly engagementCreatedAt: Date;
}): number {
  const since = (input.lastCertifiedAt ?? input.engagementCreatedAt).getTime();
  return input.grants.filter(
    (g) =>
      g.effect !== 'DENY' &&
      g.reviewed !== true &&
      g.createdAt.getTime() > since,
  ).length;
}

/** Cambio de privilegios entre dos conjuntos de átomos. */
export interface PrivilegeDelta {
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  /** Átomos que no tenía y ahora sí. */
  readonly newAtoms: readonly SupportAtomCode[];
  /** De los nuevos, los de sensibilidad ALTA o CRÍTICA. */
  readonly newHighAtoms: readonly SupportAtomCode[];
}

const HIGH_OR_ABOVE: ReadonlySet<PermissionSensitivity> = new Set([
  'HIGH',
  'CRITICAL',
]);

/** Puntaje antes y después de un cambio y los átomos nuevos (insumo del «mover»). */
export function privilegeDelta(
  before: Iterable<string>,
  after: Iterable<string>,
): PrivilegeDelta {
  const had = distinctAtoms(before);
  const has = distinctAtoms(after);
  const newAtoms = [...has].filter((a) => !had.has(a)).sort();
  return {
    before: privilegeScore(had),
    after: privilegeScore(has),
    delta: privilegeScore(has) - privilegeScore(had),
    newAtoms,
    newHighAtoms: newAtoms.filter((a) => {
      const s = PERMISSION_ATOM_BY_CODE.get(a)?.sensitivity;
      return s !== undefined && HIGH_OR_ABOVE.has(s);
    }),
  };
}
