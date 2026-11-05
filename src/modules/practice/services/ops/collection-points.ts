import type { EntityManager } from '@mikro-orm/postgresql';
import { PRAC } from '../../practice.concepts';

/** Un punto de toma de muestra (§F5b). */
export interface CollectionPointRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly practiceSiteId: string;
  readonly tenantId: string;
  readonly unitId: string | null;
  readonly unitName: string | null;
  /** Ciclo de vida ACTIVE y disponibilidad operativa AVAILABLE (sin bloqueo F2). */
  readonly available: boolean;
}

const SELECT = `
  SELECT c.id, c.code, c.name, c.practice_site_id, c.tenant_id,
         (c.status_concept_id = ? AND (c.valid_to IS NULL OR c.valid_to > now())
           AND (c.operational_status_concept_id IS NULL OR c.operational_status_concept_id = ?)) AS available,
         u.id AS unit_id, u.name AS unit_name
    FROM practice.care_spaces c
    LEFT JOIN LATERAL (
      SELECT cu.id, cu.name FROM practice.space_unit_assignments a
        JOIN practice.clinical_units cu ON cu.id = a.clinical_unit_id
       WHERE a.care_space_id = c.id AND a.valid_from <= now()
         AND (a.valid_to IS NULL OR a.valid_to > now())
       ORDER BY (a.role_concept_id = ?) DESC, a.valid_from LIMIT 1) u ON true
   WHERE c.space_type_concept_id = ?`;

type Row = {
  id: string;
  code: string;
  name: string;
  practice_site_id: string;
  tenant_id: string;
  available: boolean;
  unit_id: string | null;
  unit_name: string | null;
};

const view = (r: Row): CollectionPointRow => ({
  id: r.id,
  code: r.code,
  name: r.name,
  practiceSiteId: r.practice_site_id,
  tenantId: r.tenant_id,
  unitId: r.unit_id,
  unitName: r.unit_name,
  available: !!r.available,
});

const BASE = (): unknown[] => [
  PRAC.SPACE_ACTIVE,
  PRAC.SPACE_OP_AVAILABLE,
  PRAC.SPACE_UNIT_ROLE_OWNER,
  PRAC.SPACE_FN_SAMPLE_COLLECTION,
];

/**
 * Puntos de toma de una sede (función `SPACE_FN_SAMPLE_COLLECTION`), por
 * código. SQL de sólo lectura en el contexto (RLS) del llamador.
 *
 * @param em - Contexto.
 * @param siteId - Sede de práctica.
 */
export async function collectionPointsOfSite(
  em: EntityManager,
  siteId: string,
): Promise<CollectionPointRow[]> {
  const rows = await em.execute<Row[]>(
    `${SELECT} AND c.practice_site_id = ? AND c.status_concept_id <> ? ORDER BY c.code, c.id LIMIT 200`,
    [...BASE(), siteId, PRAC.SPACE_RETIRED],
    'all',
  );
  return rows.map(view);
}

/**
 * Un punto de toma por id, o `null` si el espacio no existe, no se ve (otro
 * tenant bajo RLS) o no es un punto de toma.
 *
 * @param em - Contexto.
 * @param careSpaceId - Espacio.
 */
export async function collectionPoint(
  em: EntityManager,
  careSpaceId: string,
): Promise<CollectionPointRow | null> {
  const [row] = await em.execute<Row[]>(
    `${SELECT} AND c.id = ?`,
    [...BASE(), careSpaceId],
    'all',
  );
  return row ? view(row) : null;
}
