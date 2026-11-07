import type { EntityManager } from '@mikro-orm/postgresql';
import { DUNIT } from '../../diagnostic_units.concepts';

/** One active site (branch) of a diagnostic unit, with its address. */
export interface SiteRow {
  unit_id: string;
  /** `diagnostic_unit_sites.id`: the branch of the center. */
  site_id: string;
  site_name: string;
  is_primary: boolean;
  time_zone: string | null;
  address_text: string | null;
  latitude: string | null;
  longitude: string | null;
}

const uuidArray = (ids: readonly string[]): string => `{${ids.join(',')}}`;

/** Every active site of the units, primary first, then by creation. */
export function findUnitSites(
  em: EntityManager,
  unitIds: readonly string[],
): Promise<SiteRow[]> {
  if (unitIds.length === 0) return Promise.resolve([]);
  return em.execute<SiteRow[]>(
    `SELECT s.diagnostic_unit_id AS unit_id, s.id AS site_id,
            ps.name AS site_name, coalesce(s.site_role_concept_id = ?, false) AS is_primary,
            coalesce(ps.time_zone, p.time_zone) AS time_zone,
            nullif(concat_ws(', ', nullif(trim(a.lines), ''), nullif(trim(a.city), '')), '') AS address_text,
            a.latitude::text AS latitude, a.longitude::text AS longitude
       FROM diagnostic_units.diagnostic_unit_sites s
       JOIN practice.practice_sites ps ON ps.id = s.practice_site_id
       LEFT JOIN practice.practices p ON p.id = ps.practice_id
       LEFT JOIN common.addresses a ON a.id = ps.address_id
      WHERE s.diagnostic_unit_id = ANY(?::uuid[]) AND s.status_concept_id = ?
      ORDER BY s.diagnostic_unit_id, (s.site_role_concept_id = ?) DESC, s.created_at, s.id`,
    [
      DUNIT.SITE_ROLE_PRIMARY,
      uuidArray(unitIds),
      DUNIT.SITE_ACTIVE,
      DUNIT.SITE_ROLE_PRIMARY,
    ],
    'all',
  );
}
