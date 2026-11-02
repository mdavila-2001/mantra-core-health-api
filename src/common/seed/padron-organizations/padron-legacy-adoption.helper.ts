import type { EntityManager } from '@mikro-orm/postgresql';
import { Addresses } from '../../../modules/common/entities';
import { PublicProfiles } from '../../../modules/community/entities';
import { Tenants } from '../../../modules/directory/entities';
import { TENANT_TYPE_CONCEPT_BY_CODE } from '../../../modules/directory/directory.concepts';
import { boMunicipalityConceptId } from '../bo-geography.catalog';
import {
  KIND_BY_TIPO,
  LEGACY_CODE_PREFIX,
  normalizeName,
  padronFacilities,
  padronTenantId,
  SANTA_CRUZ_MUNICIPALITY_BY_NAME,
  type PadronFacility,
} from './padron-facility.types';

/** Cached database state read in bulk to avoid per-row queries across deployments. */
export interface KnownState {
  /** Organization UUID mapped by facility code (either native deterministic or adopted). */
  readonly idByCode: Map<string, string>;
  /** Codes of facilities whose organization was adopted from legacy datasets. */
  readonly adopted: Set<string>;
  /** Codes with multiple ambiguous adoption candidates. */
  readonly ambiguous: Set<string>;
  /** Adopted facilities where legacy tenant classification differs. */
  readonly typeMismatch: Set<string>;
  /** Current status concept ID mapped by tenant UUID. */
  readonly tenants: Map<string, string>;
  /** Public showcase headline by organization target UUID. */
  readonly showcaseHeadlines: Map<string, string | undefined>;
  /** Organization UUIDs that already have at least one address registered. */
  readonly withAddress: Set<string>;
}

/**
 * Identifies legacy candidates that match a padron row by normalized name and municipality.
 * When multiple candidates exist, geographical match takes precedence over address-less records.
 */
export function legacyCandidates(
  row: PadronFacility,
  legacy: readonly Tenants[],
  places: ReadonlyMap<string, ReadonlySet<string>>,
  claimed: ReadonlySet<string>,
): Tenants[] {
  const wanted = normalizeName(row.nombre);
  const byName = legacy.filter(
    (t) =>
      !claimed.has(t.id) &&
      normalizeName(t.tradeName ?? t.legalName) === wanted,
  );
  const municipality = normalizeName(row.municipio);
  const ine = SANTA_CRUZ_MUNICIPALITY_BY_NAME.get(municipality);
  const here = byName.filter((t) => {
    const tokens = places.get(t.id);
    return (
      tokens !== undefined &&
      (tokens.has(municipality) ||
        (ine !== undefined && tokens.has(boMunicipalityConceptId(ine))))
    );
  });
  if (here.length > 0) return here;
  return byName.filter((t) => !places.has(t.id));
}

/**
 * Maps known locations for legacy tenants from existing address entries.
 * Returns map of tenant UUID to set of normalized municipality names and concepts.
 */
export async function resolveLegacyPlaces(
  em: EntityManager,
  legacy: readonly Tenants[],
): Promise<Map<string, Set<string>>> {
  const places = new Map<string, Set<string>>();
  if (legacy.length === 0) return places;
  const addresses = await em.find(Addresses, {
    ownerId: { $in: legacy.map((t) => t.id) },
  });
  for (const address of addresses) {
    const tokens = places.get(address.ownerId) ?? new Set<string>();
    if (address.city) tokens.add(normalizeName(address.city));
    if (address.municipalityConceptId) {
      tokens.add(address.municipalityConceptId);
    }
    if (tokens.size > 0) places.set(address.ownerId, tokens);
  }
  return places;
}

/**
 * Resolves organization UUID for each facility row:
 * Finds canonical padron organization or safely adopts a unique legacy record.
 */
export async function resolveFacilityIds(
  em: EntityManager,
  facilities: readonly PadronFacility[] = padronFacilities(),
): Promise<{
  idByCode: Map<string, string>;
  ambiguous: Set<string>;
  fixedIds: Map<string, string>;
  typeMismatch: Set<string>;
}> {
  const fixedIds = new Map(
    facilities.map((row) => [row.code, padronTenantId(row.code)]),
  );
  const owned = await em.find(Tenants, {
    $or: [
      { id: { $in: [...fixedIds.values()] } },
      { code: { $in: [...fixedIds.keys()] } },
    ],
  });
  const idByCode = new Map<string, string>();
  for (const tenant of owned) {
    const row = facilities.find((r) => r.code === tenant.code);
    if (row) idByCode.set(row.code, tenant.id);
  }
  // Also track rows matched strictly by deterministic UUID.
  for (const [code, id] of fixedIds) {
    if (!idByCode.has(code) && owned.some((t) => t.id === id)) {
      idByCode.set(code, id);
    }
  }

  const ambiguous = new Set<string>();
  const typeMismatch = new Set<string>();
  const legacy = await em.find(Tenants, {
    // Escape underscore wildcard for literal SQL LIKE matching.
    code: { $like: `${LEGACY_CODE_PREFIX.replace(/_/g, String.raw`\_`)}%` },
  });
  const places = await resolveLegacyPlaces(em, legacy);
  const claimed = new Set<string>();
  for (const row of facilities) {
    if (idByCode.has(row.code)) continue;
    const kind = KIND_BY_TIPO[row.tipo];
    if (!kind) continue;
    const candidates = legacyCandidates(row, legacy, places, claimed);
    if (candidates.length === 1) {
      const [adopted] = candidates;
      idByCode.set(row.code, adopted.id);
      claimed.add(adopted.id);
      if (
        adopted.tenantTypeConceptId !==
        TENANT_TYPE_CONCEPT_BY_CODE[kind.tenantType]
      ) {
        typeMismatch.add(row.code);
      }
    } else if (candidates.length > 1) {
      ambiguous.add(row.code);
    }
  }
  return { idByCode, ambiguous, fixedIds, typeMismatch };
}

/**
 * Loads baseline system state for all candidate facilities in one optimized query pass.
 */
export async function resolveKnownState(
  em: EntityManager,
  facilities: readonly PadronFacility[],
): Promise<KnownState> {
  const { idByCode, ambiguous, fixedIds, typeMismatch } =
    await resolveFacilityIds(em, facilities);

  const known = [...idByCode.values()];
  const tenants = await em.find(Tenants, { id: { $in: known } });
  const profiles = await em.find(PublicProfiles, {
    targetId: { $in: known },
  });
  const withAddress = await em.find(Addresses, {
    ownerId: { $in: known },
  });
  return {
    idByCode,
    ambiguous,
    adopted: new Set(
      [...idByCode]
        .filter(([code, id]) => id !== fixedIds.get(code))
        .map(([c]) => c),
    ),
    typeMismatch,
    tenants: new Map(tenants.map((t) => [t.id, t.statusConceptId])),
    showcaseHeadlines: new Map(profiles.map((p) => [p.targetId, p.headline])),
    withAddress: new Set(withAddress.map((a) => a.ownerId)),
  };
}
