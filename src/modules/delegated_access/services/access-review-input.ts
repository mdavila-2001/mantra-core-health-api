import { normalizeSensitivity } from '../domain';
import type { CampaignFilters, CampaignScope } from '../domain';

/** Versión del esquema de `scope_json`. */
export const CAMPAIGN_SCOPE_SCHEMA_VERSION = 1;

function ids(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((v): v is string => typeof v === 'string'))]
    : [];
}

/**
 * Alcance de una campaña desde el cuerpo. Un alcance sin objetivos
 * (`SERVICE` sin servicios, etc.) o de un tipo desconocido es «vacío»: `undefined`.
 *
 * @param raw - Alcance tal como llegó (validado en forma por el DTO).
 * @returns El alcance del dominio o `undefined` si no apunta a nada.
 */
export function parseCampaignScope(raw: unknown): CampaignScope | undefined {
  if (raw === null || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  switch (r.kind) {
    case 'ORGANIZATION':
      return { kind: 'ORGANIZATION' };
    case 'PRACTITIONER': {
      const list = ids(r.practitionerRoleAssignmentIds);
      return list.length > 0
        ? { kind: 'PRACTITIONER', practitionerRoleAssignmentIds: list }
        : undefined;
    }
    case 'SERVICE': {
      const list = ids(r.healthcareServiceIds);
      return list.length > 0
        ? { kind: 'SERVICE', healthcareServiceIds: list }
        : undefined;
    }
    case 'LOCATION': {
      const spaces = ids(r.careSpaceIds);
      const sites = ids(r.practiceSiteIds);
      return spaces.length + sites.length > 0
        ? { kind: 'LOCATION', careSpaceIds: spaces, practiceSiteIds: sites }
        : undefined;
    }
    case 'TEMPLATE': {
      const list = ids(r.templateCodes);
      return list.length > 0
        ? { kind: 'TEMPLATE', templateCodes: list }
        : undefined;
    }
    default:
      return undefined;
  }
}

/**
 * Filtros de una campaña desde el cuerpo. Una sensibilidad que no se reconoce
 * se descarta (no filtra): el filtro nunca amplía lo que se revisa porque
 * todos se cruzan con «y».
 *
 * @param raw - Filtros tal como llegaron.
 * @returns Los filtros normalizados, o `undefined` si no hay ninguno.
 */
export function parseCampaignFilters(
  raw: unknown,
): CampaignFilters | undefined {
  if (raw === null || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const out: {
    -readonly [K in keyof CampaignFilters]: CampaignFilters[K];
  } = {};
  if (
    typeof r.minSensitivity === 'string' &&
    normalizeSensitivity(r.minSensitivity)
  )
    out.minSensitivity = r.minSensitivity.trim().toUpperCase();
  if (typeof r.unusedDays === 'number' && r.unusedDays > 0)
    out.unusedDays = r.unusedDays;
  if (r.onlyAboveCeiling === true) out.onlyAboveCeiling = true;
  if (r.onlySodFindings === true) out.onlySodFindings = true;
  if (r.includeSuspended === true) out.includeSuspended = true;
  return Object.keys(out).length > 0 ? out : undefined;
}
