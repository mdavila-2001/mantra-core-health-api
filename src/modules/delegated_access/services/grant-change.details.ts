import {
  PERMISSION_ATOM_BY_CODE,
  atomsOfAction,
  describeCondition,
  type SupportCondition,
  type SupportTargetKind,
} from '../domain';
import type { GrantChangeDetailsDto, GrantChangeAtomViewDto } from '../dto';
import type { GrantChangePayload } from './support-engagements.service';

/** Nombres de personal y lugares (nunca de pacientes) que ve quien aprueba. */
export interface GrantChangeNames {
  /** Doctor por su asignación de rol. */
  readonly doctors: ReadonlyMap<string, string>;
  /** Servicio por id. */
  readonly services: ReadonlyMap<string, string>;
  /** Espacio o sede por id. */
  readonly locations: ReadonlyMap<string, string>;
}

/** El permiso tal como está HOY (solo en `UPDATE`: el cambio se aplica sobre él). */
export interface CurrentGrantFacts {
  readonly targetKind: SupportTargetKind;
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly practiceSiteId?: string;
  readonly expansionMode: 'DYNAMIC' | 'FIXED';
  /** Átomos o alias del permiso. */
  readonly actions: readonly string[];
  readonly validFrom?: Date;
  readonly validTo?: Date;
  readonly condition?: unknown;
  readonly actionConditions?: Readonly<Record<string, unknown>>;
}

const UNREADABLE = 'Tiene una condición que el sistema no puede leer.';

/** Un átomo con su nombre simple y si es CRÍTICA. */
function atomView(code: string): GrantChangeAtomViewDto {
  const meta = PERMISSION_ATOM_BY_CODE.get(code);
  return {
    code,
    name: meta?.name ?? code,
    critical: meta?.sensitivity === 'CRITICAL',
  };
}

/** Frase de una condición; una ilegible o vacía no inventa nada. */
function conditionText(condition: unknown, atom?: string): string {
  if (condition === undefined || condition === null) return '';
  try {
    if (typeof condition !== 'object' || Array.isArray(condition)) {
      return UNREADABLE;
    }
    return describeCondition(condition as SupportCondition, atom);
  } catch {
    return UNREADABLE;
  }
}

const iso = (value: Date | string | undefined): string | undefined =>
  value === undefined ? undefined : new Date(value).toISOString();

/**
 * Lo que ve quien aprueba un `GRANT_CHANGE` (N-1): TODOS los permisos del
 * permiso resultante con los críticos marcados, a qué doctor, servicio o espacio
 * apunta, hasta cuándo vale y bajo qué condiciones. Reúne solo lo que se
 * ejecutará con la aprobación (lo firmado en el cuerpo, más el permiso actual en
 * una edición): sin datos de pacientes.
 *
 * @param payload - Cuerpo firmado.
 * @param current - Permiso actual (edición); sin él, una edición solo muestra lo que cambia.
 * @param names - Nombres de doctores, servicios y espacios.
 * @returns El detalle para la pantalla de aprobación.
 */
export function grantChangeDetails(
  payload: GrantChangePayload,
  current: CurrentGrantFacts | undefined,
  names: GrantChangeNames,
): GrantChangeDetailsDto {
  const change =
    payload.op === 'UPDATE'
      ? (payload.change as {
          actions?: string[];
          validTo?: string;
          expansionMode?: 'DYNAMIC' | 'FIXED';
          condition?: unknown;
          actionConditions?: Record<string, unknown>;
        })
      : {};
  const base =
    payload.op === 'ADD'
      ? {
          targetKind: payload.grant.targetKind,
          practitionerRoleAssignmentId:
            payload.grant.practitionerRoleAssignmentId,
          healthcareServiceId: payload.grant.healthcareServiceId,
          careSpaceId: payload.grant.careSpaceId,
          practiceSiteId: payload.grant.practiceSiteId,
          expansionMode: payload.grant.expansionMode,
          actions: payload.grant.actions,
          validFrom: payload.grant.validFrom
            ? new Date(payload.grant.validFrom)
            : undefined,
          validTo: payload.grant.validTo
            ? new Date(payload.grant.validTo)
            : undefined,
          condition: payload.grant.condition,
          actionConditions: payload.grant.actionConditions,
        }
      : current;
  const actions = change.actions ?? base?.actions ?? [];
  const codes = [
    ...new Set(actions.flatMap((a) => atomsOfAction(a).map((x) => x.atom))),
  ].sort();
  const atoms = codes.map(atomView);
  const condition =
    change.condition !== undefined ? change.condition : base?.condition;
  const actionConditions =
    change.actionConditions !== undefined
      ? change.actionConditions
      : base?.actionConditions;
  const conditions: string[] = [];
  const whole = conditionText(condition);
  if (whole) conditions.push(whole);
  for (const [atom, value] of Object.entries(actionConditions ?? {})) {
    const text = conditionText(value, atom);
    if (text) conditions.push(`${atomView(atom).name}: ${text}`);
  }
  const roleId = base?.practitionerRoleAssignmentId;
  const serviceId = base?.healthcareServiceId;
  const locationId = base?.careSpaceId ?? base?.practiceSiteId;
  const validTo = change.validTo !== undefined ? change.validTo : base?.validTo;
  return {
    op: payload.op,
    reasons: [...(payload.reasons ?? [])],
    atoms,
    criticalAtoms: atoms.filter((a) => a.critical),
    target: {
      kind: base?.targetKind ?? 'ALL',
      expansionMode: change.expansionMode ?? base?.expansionMode ?? 'DYNAMIC',
      ...(roleId && names.doctors.get(roleId)
        ? { practitionerName: names.doctors.get(roleId) }
        : {}),
      ...(serviceId && names.services.get(serviceId)
        ? { serviceName: names.services.get(serviceId) }
        : {}),
      ...(locationId && names.locations.get(locationId)
        ? { locationName: names.locations.get(locationId) }
        : {}),
    },
    ...(base?.validFrom ? { validFrom: iso(base.validFrom) } : {}),
    ...(validTo ? { validTo: iso(validTo) } : {}),
    conditions,
    ...(payload.op === 'UPDATE'
      ? { changes: Object.keys(payload.change).sort() }
      : {}),
  };
}

/** Texto de resumen de un `GRANT_CHANGE` con los NOMBRES de todos sus átomos críticos. */
export function grantChangeSummary(payload: unknown): string {
  const critical = (payload as { criticalAtoms?: unknown } | undefined)
    ?.criticalAtoms;
  const names = Array.isArray(critical)
    ? critical
        .filter((c): c is string => typeof c === 'string')
        .map((c) => atomView(c).name)
    : [];
  return names.length > 0
    ? `Cambio de permisos con permisos críticos: ${names.join(', ')}.`
    : 'Cambio de permisos por encima del techo o con permisos críticos.';
}
