import type { SupportScopeGrants } from '../entities';
import {
  PERMISSION_ATOM_BY_ID,
  SUPPORT_ACTION_BY_PERMISSION_ID,
  SUPPORT_CONDITION_SCHEMA_VERSION,
  expandLegacy,
  isEmptySnapshotRow,
  type AtomGrant,
  type ExpansionMode,
  type FixedSnapshot,
  type SupportActionCode,
  type SupportActionInput,
  type SupportCondition,
  type SupportGrantFacts,
  type SupportTargetKind,
} from '../domain';
import { AUTHZ } from '../../authz/authz.concepts';
import { DELEG } from '../delegated_access.concepts';

/**
 * Fila de acción de un permiso tal como la lee la política: el permiso
 * (`authz.permissions`) y, si la trae, su condición propia. Las filas con
 * `supersededAt` fueron reemplazadas por átomos (normalize-legacy) y no se evalúan.
 */
export interface ActionRow {
  /** Id de la fila de `authz.permissions` (alias o átomo). */
  readonly permissionId: string;
  /** Condición ABAC propia de la acción (JSON de la columna). */
  readonly conditionJson?: unknown;
  /** Versión del esquema declarada en la columna. */
  readonly conditionSchemaVersion?: number | null;
  /** Cuándo la reemplazaron átomos; vigente si es nula. */
  readonly supersededAt?: Date | null;
}

/**
 * Condición que ningún motor entiende: marca «ilegible» una condición cuyo JSON
 * está roto o cuya versión no coincide con la de la columna. Con una versión
 * distinta de la soportada el motor no la aplica y falla cerrado
 * (`CONDITION_UNREADABLE`).
 */
const UNREADABLE_CONDITION: SupportCondition = { schemaVersion: -1 };

/** Tipo de objetivo (concepto) → código. */
export const TARGET_KIND_BY_CONCEPT: Readonly<
  Record<string, SupportTargetKind>
> = {
  [DELEG.SUPPORT_TARGET_PRACTITIONER]: 'PRACTITIONER',
  [DELEG.SUPPORT_TARGET_SERVICE]: 'SERVICE',
  [DELEG.SUPPORT_TARGET_LOCATION]: 'LOCATION',
  [DELEG.SUPPORT_TARGET_PRACTITIONER_SERVICE]: 'PRACTITIONER_SERVICE',
  [DELEG.SUPPORT_TARGET_PRACTITIONER_LOCATION]: 'PRACTITIONER_LOCATION',
  [DELEG.SUPPORT_TARGET_SERVICE_LOCATION]: 'SERVICE_LOCATION',
  [DELEG.SUPPORT_TARGET_ALL_PRACTITIONERS]: 'ALL_PRACTITIONERS',
  [DELEG.SUPPORT_TARGET_ALL_SERVICES]: 'ALL_SERVICES',
  [DELEG.SUPPORT_TARGET_ALL_LOCATIONS]: 'ALL_LOCATIONS',
  [DELEG.SUPPORT_TARGET_ALL]: 'ALL',
};

/** Código de tipo de objetivo → concepto. */
export const TARGET_KIND_CONCEPT: Readonly<Record<SupportTargetKind, string>> =
  {
    PRACTITIONER: DELEG.SUPPORT_TARGET_PRACTITIONER,
    SERVICE: DELEG.SUPPORT_TARGET_SERVICE,
    LOCATION: DELEG.SUPPORT_TARGET_LOCATION,
    PRACTITIONER_SERVICE: DELEG.SUPPORT_TARGET_PRACTITIONER_SERVICE,
    PRACTITIONER_LOCATION: DELEG.SUPPORT_TARGET_PRACTITIONER_LOCATION,
    SERVICE_LOCATION: DELEG.SUPPORT_TARGET_SERVICE_LOCATION,
    ALL_PRACTITIONERS: DELEG.SUPPORT_TARGET_ALL_PRACTITIONERS,
    ALL_SERVICES: DELEG.SUPPORT_TARGET_ALL_SERVICES,
    ALL_LOCATIONS: DELEG.SUPPORT_TARGET_ALL_LOCATIONS,
    ALL: DELEG.SUPPORT_TARGET_ALL,
  };

/** Modo de expansión código → concepto. */
export const EXPANSION_CONCEPT: Readonly<Record<ExpansionMode, string>> = {
  DYNAMIC: DELEG.SUPPORT_EXPANSION_DYNAMIC,
  FIXED: DELEG.SUPPORT_EXPANSION_FIXED,
};

/** Códigos de acción de los ids de permiso; ignora los que no son de apoyo. */
export function actionsOfPermissionIds(
  permissionIds: readonly string[],
): SupportActionCode[] {
  const codes = new Set<SupportActionCode>();
  for (const id of permissionIds) {
    const code = SUPPORT_ACTION_BY_PERMISSION_ID.get(id);
    if (code) codes.add(code);
  }
  return [...codes];
}

/**
 * Códigos de acción de los ids de permiso, para la evaluación: un alias antiguo
 * da su código y un átomo del catálogo, el suyo. Ignora los ids desconocidos
 * (como hoy).
 */
export function supportActionInputsOfPermissionIds(
  permissionIds: readonly string[],
): SupportActionInput[] {
  const codes = new Set<SupportActionInput>();
  for (const id of permissionIds) {
    const alias = SUPPORT_ACTION_BY_PERMISSION_ID.get(id);
    if (alias) {
      codes.add(alias);
      continue;
    }
    const atom = PERMISSION_ATOM_BY_ID.get(id);
    if (atom) codes.add(atom.code);
  }
  return [...codes];
}

/**
 * Lee una condición guardada (JSON + versión de la columna). Una condición
 * ausente es «sin condición»; una rota (no es objeto, versión no entera o que no
 * coincide con la columna) se devuelve como ilegible: nunca se interpreta a medias.
 */
export function readCondition(
  json: unknown,
  columnVersion: number | null | undefined,
): { condition?: SupportCondition; broken: boolean } {
  if (json === null || json === undefined) return { broken: false };
  if (typeof json !== 'object' || Array.isArray(json)) {
    return { condition: UNREADABLE_CONDITION, broken: true };
  }
  const version = (json as { schemaVersion?: unknown }).schemaVersion;
  if (
    typeof version !== 'number' ||
    !Number.isInteger(version) ||
    (columnVersion !== null &&
      columnVersion !== undefined &&
      columnVersion !== version)
  ) {
    return { condition: UNREADABLE_CONDITION, broken: true };
  }
  // Una versión que este motor no lee no se aplica: la fila no es candidata.
  return {
    condition: json as SupportCondition,
    broken: version !== SUPPORT_CONDITION_SCHEMA_VERSION,
  };
}

/** Efecto de la concesión: lo desconocido se trata como `DENY` (falla cerrado). */
function effectOf(grant: SupportScopeGrants): 'ALLOW' | 'DENY' {
  const effect = grant.effectConceptId;
  if (effect === undefined || effect === AUTHZ.EFFECT_ALLOW) return 'ALLOW';
  return 'DENY';
}

/**
 * ¿La concesión PERMITE? Solo las `ALLOW` se materializan en
 * `effective_support_access`: una `DENY` jamás puede aparecer como permiso (lo
 * mismo que hace `refresh_effective_support_access` en SQL).
 */
export function isAllowGrant(grant: SupportScopeGrants): boolean {
  return effectOf(grant) === 'ALLOW';
}

/** Lee la foto congelada guardada como JSON (`{"rows":[…]}`). */
export function readSnapshot(raw: unknown): FixedSnapshot | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const rows = (raw as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return undefined;
  const text = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined;
  return {
    rows: rows
      .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
      .map((r) => ({
        practitionerRoleAssignmentId: text(r.practitionerRoleAssignmentId),
        practitionerProfileId: text(r.practitionerProfileId),
        healthcareServiceId: text(r.healthcareServiceId),
        careSpaceId: text(r.careSpaceId),
      }))
      // Una fila sin ninguna dimensión (dato roto) cubriría todo: se descarta.
      .filter((row) => !isEmptySnapshotRow(row)),
  };
}

/**
 * Arma los hechos de un permiso para la evaluación pura.
 *
 * @param grant - Fila del permiso.
 * @param permissionIds - Ids de permiso de sus acciones.
 * @param practitionerProfileId - Perfil del doctor del objetivo, si lo tiene.
 * @param actionRows - Filas de acción con su condición (si el llamador las
 *   cargó); sin ellas rigen `permissionIds`, como siempre. Las `superseded` se
 *   descartan.
 * @returns Los hechos del permiso.
 */
export function toGrantFacts(
  grant: SupportScopeGrants,
  permissionIds: readonly string[],
  practitionerProfileId: string | undefined,
  actionRows?: readonly ActionRow[],
): SupportGrantFacts {
  const knownKind = TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId];
  const effect = effectOf(grant);
  // SEG A-B3: una DENY con tipo de objetivo ilegible NIEGA, y a todo objetivo
  // (denegar todo lo que su lista de acciones nombra): un dato roto no puede
  // volver inerte una prohibición. Una ALLOW con tipo desconocido sigue sin
  // cubrir nada (jamás se infiere `ALL` de un dato roto para CONCEDER).
  const brokenDeny = !knownKind && effect === 'DENY';
  const targetKind = knownKind ?? (brokenDeny ? ('ALL' as const) : undefined);
  const live = actionRows?.filter((row) => !row.supersededAt);
  const ids = live ? live.map((row) => row.permissionId) : permissionIds;
  const own = readCondition(grant.conditionJson, grant.conditionSchemaVersion);
  const atomGrants = live ? atomGrantsOf(live) : [];
  const expansionMode: ExpansionMode =
    !brokenDeny &&
    grant.expansionModeConceptId === DELEG.SUPPORT_EXPANSION_FIXED
      ? 'FIXED'
      : 'DYNAMIC';
  return {
    grantId: grant.id,
    // Un tipo desconocido no cubre nada si CONCEDE; si PROHÍBE, cubre todo.
    targetKind: targetKind ?? 'PRACTITIONER',
    practitionerProfileId: brokenDeny
      ? undefined
      : knownKind
        ? practitionerProfileId
        : undefined,
    healthcareServiceId: brokenDeny ? undefined : grant.healthcareServiceId,
    careSpaceId: brokenDeny ? undefined : grant.careSpaceId,
    practiceSiteId: brokenDeny ? undefined : grant.practiceSiteId,
    expansionMode,
    snapshot: brokenDeny ? undefined : readSnapshot(grant.fixedSnapshotJson),
    active:
      !!targetKind && grant.statusConceptId === DELEG.SUPPORT_GRANT_ACTIVE,
    validFrom: grant.validFrom,
    validTo: grant.validTo,
    actions: supportActionInputsOfPermissionIds(ids),
    effect,
    ...(own.condition ? { condition: own.condition } : {}),
    ...(atomGrants.length > 0 ? { atomGrants } : {}),
    ...(own.broken ? { unreadable: true } : {}),
  };
}

/** Átomos con condición propia: la forma rica que el motor cruza con la del permiso. */
function atomGrantsOf(rows: readonly ActionRow[]): AtomGrant[] {
  const out: AtomGrant[] = [];
  for (const row of rows) {
    const { condition } = readCondition(
      row.conditionJson,
      row.conditionSchemaVersion,
    );
    if (!condition) continue;
    const alias = SUPPORT_ACTION_BY_PERMISSION_ID.get(row.permissionId);
    if (alias) {
      for (const atom of expandLegacy(alias)) {
        out.push({ atom, origin: 'LEGACY', condition });
      }
      continue;
    }
    const atom = PERMISSION_ATOM_BY_ID.get(row.permissionId);
    if (atom) out.push({ atom: atom.code, origin: 'ATOM', condition });
  }
  return out;
}

/** Versión del esquema que entiende el motor (reexportada para quien carga filas). */
export const SUPPORTED_CONDITION_VERSION = SUPPORT_CONDITION_SCHEMA_VERSION;
