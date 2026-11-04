import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../../../../common';
import type { BookableOrganizationsResponseDto } from '../../presentation/dto';
import {
  BOOKABLE_RESOURCE_PARAMS,
  BOOKABLE_RESOURCE_SQL,
} from './bookable-criteria';

/**
 * Bookable means what `bookable-criteria.ts` says.
 *
 * The seed's default tenant is technical, not a real organization: it is left out.
 * GROUP BY names the tenant columns: a bare `name` resolves to the input column
 * `r.name` before the output alias, which returned one row per practitioner.
 */
const SQL = `
SELECT t.id AS tenant_id,
       coalesce(nullif(t.trade_name, ''), t.legal_name) AS name,
       count(DISTINCT r.id) FILTER (WHERE r.resource_type_concept_id = ?) AS practitioner_count,
       count(DISTINCT r.id) FILTER (WHERE r.resource_type_concept_id = ?) AS room_count
  FROM directory.tenants t
  JOIN scheduling.schedulable_resources r
    ON r.tenant_id = t.id AND r.state_concept_id = ?
 WHERE t.status_concept_id = ?
   AND t.id <> ?
   AND r.resource_type_concept_id IN (?, ?)
   AND ${BOOKABLE_RESOURCE_SQL}
 GROUP BY t.id, t.trade_name, t.legal_name
 ORDER BY name`;

type Row = {
  tenant_id: string;
  name: string;
  practitioner_count: string;
  room_count: string;
};

/**
 * Organizations a patient can book with today, across tenants. Runs in system
 * context because RLS scopes every read to the account's tenant, which is
 * exactly what this question must skip. Only id, name and counts leave here.
 */
export async function findBookableOrganizations(
  em: EntityManager,
): Promise<BookableOrganizationsResponseDto> {
  const rows = await em.transactional(async (tx) => {
    await tx.execute("select set_config('app.system_context', 'true', true)");
    return tx.execute<Row[]>(SQL, [
      CONCEPTS.RESOURCE_PRACTITIONER,
      CONCEPTS.RESOURCE_ROOM,
      CONCEPTS.STATE_ACTIVE,
      CONCEPTS.TENANT_ACTIVE,
      SEED.tenantId,
      CONCEPTS.RESOURCE_PRACTITIONER,
      CONCEPTS.RESOURCE_ROOM,
      ...BOOKABLE_RESOURCE_PARAMS,
    ]);
  });
  const items = rows.map((row) => ({
    tenantId: row.tenant_id,
    name: row.name,
    practitionerCount: Number(row.practitioner_count),
    roomCount: Number(row.room_count),
  }));
  return { items, count: items.length };
}
