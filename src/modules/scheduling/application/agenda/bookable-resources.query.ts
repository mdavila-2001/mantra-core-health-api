import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../../../../common';
import { PRACTITIONER_PROFILE_TABLES } from '../../domain/resource/practitioner-profile-tables';
import type {
  BookableResourcesQueryDto,
  BookableResourcesResponseDto,
} from '../../presentation/dto';
import {
  BOOKABLE_RESOURCE_PARAMS,
  BOOKABLE_RESOURCE_SQL,
} from './bookable-criteria';

const DEFAULT_LIMIT = 20;
const PLATFORM_NAME = 'AloVida';

/**
 * Case- and accent-insensitive form of a text, so «munoz» finds «Muñoz».
 * Plain SQL on purpose: the `unaccent` extension is not installed everywhere.
 */
const fold = (expr: string) =>
  `translate(lower(${expr}), 'áéíóúüñ', 'aeiouun')`;

/**
 * One row per person (or room) per organization. The person's name comes from
 * `profiles.persons` (`resource_ref_id` is the person id) and falls back to the
 * resource name. The seed tenant is the platform's own: it reads «AloVida».
 */
const MATCHES = `
WITH m AS (
  SELECT r.tenant_id,
         CASE WHEN t.id = ? THEN '${PLATFORM_NAME}'
              ELSE coalesce(nullif(t.trade_name, ''), t.legal_name) END AS organization_name,
         min(r.id::text) AS resource_id,
         r.resource_ref_type,
         r.resource_ref_id,
         min(coalesce(nullif(p.display_name, ''),
                      nullif(trim(concat_ws(' ', p.name, p.middle_name, p.last_name, p.mother_last_name)), ''),
                      r.name)) AS label
    FROM scheduling.schedulable_resources r
    JOIN directory.tenants t ON t.id = r.tenant_id
    LEFT JOIN profiles.persons p
      ON p.id = r.resource_ref_id AND r.resource_ref_type IN (?, ?)
   WHERE t.status_concept_id = ?
     AND r.state_concept_id = ?
     AND r.resource_type_concept_id = ?
     AND ${BOOKABLE_RESOURCE_SQL}
   GROUP BY r.tenant_id, t.id, t.trade_name, t.legal_name, r.resource_ref_type, r.resource_ref_id
)
SELECT * FROM m
 WHERE CAST(? AS text) IS NULL
    OR ${fold('label')} LIKE ${fold('?')}
    OR ${fold('organization_name')} LIKE ${fold('?')}`;

const PAGE = `SELECT * FROM (${MATCHES}) f
 ORDER BY label, organization_name, resource_ref_id
 LIMIT ? OFFSET ?`;

const TOTAL = `SELECT count(*) AS total FROM (${MATCHES}) f`;

type Row = {
  tenant_id: string;
  organization_name: string;
  resource_id: string;
  resource_ref_type: string;
  resource_ref_id: string;
  label: string;
};

/** `%term%` for LIKE, with the wildcards the patient typed taken literally. */
function likePattern(q: string | undefined): string | null {
  const term = q?.trim() ?? '';
  return term === '' ? null : `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}

/**
 * Practitioners (or laboratories) a patient can book with today, across every
 * organization, paged and searchable. Runs in system context for the same
 * reason as `findBookableOrganizations`: RLS would scope it to the patient's
 * own tenant. Only ids and display names leave here.
 */
export async function findBookableResources(
  em: EntityManager,
  query: BookableResourcesQueryDto,
): Promise<BookableResourcesResponseDto> {
  const pattern = likePattern(query.q);
  const params = [
    SEED.tenantId,
    ...PRACTITIONER_PROFILE_TABLES,
    CONCEPTS.TENANT_ACTIVE,
    CONCEPTS.STATE_ACTIVE,
    query.resourceType === 'ROOM'
      ? CONCEPTS.RESOURCE_ROOM
      : CONCEPTS.RESOURCE_PRACTITIONER,
    ...BOOKABLE_RESOURCE_PARAMS,
    pattern,
    pattern,
    pattern,
  ];
  const limit = query.limit ?? DEFAULT_LIMIT;
  const offset = query.offset ?? 0;

  const [rows, totals] = await em.transactional(async (tx) => {
    await tx.execute("select set_config('app.system_context', 'true', true)");
    const page = await tx.execute<Row[]>(PAGE, [...params, limit, offset]);
    const total = await tx.execute<{ total: string }[]>(TOTAL, params);
    return [page, total] as const;
  });

  const items = rows.map((row) => ({
    tenantId: row.tenant_id,
    organizationName: row.organization_name,
    resourceId: row.resource_id,
    resourceRefType: row.resource_ref_type,
    resourceRefId: row.resource_ref_id,
    name: row.label,
  }));
  return { items, count: items.length, total: Number(totals[0]?.total ?? 0) };
}
