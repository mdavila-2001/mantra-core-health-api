import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';
import type { BookableOrganizationsResponseDto } from '../../presentation/dto';

/**
 * A resource is bookable when it offers something ahead:
 * - a materialized open slot with free capacity (fixed turns), or
 * - a published, still-valid template with a band that is computed on read:
 *   flexible hours (P36) or services/mixed mode. Those never materialize slots,
 *   so counting only `bookable_slots` hid every practitioner who published them.
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
   AND (
         EXISTS (SELECT 1 FROM scheduling.bookable_slots s
                  WHERE s.resource_id = r.id
                    AND s.status_concept_id = ?
                    AND s.remaining_capacity > 0
                    AND s.start_at > now())
      OR EXISTS (SELECT 1 FROM scheduling.schedule_templates st
                   JOIN scheduling.schedule_rules sr ON sr.schedule_template_id = st.id
                  WHERE st.resource_id = r.id
                    AND st.status_concept_id = ?
                    AND (st.valid_to IS NULL OR st.valid_to >= current_date)
                    AND (sr.valid_to IS NULL OR sr.valid_to >= current_date)
                    AND (st.flexible_hours OR sr.flexible_hours
                         OR sr.booking_mode_concept_id IN (?, ?)))
       )
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
      CONCEPTS.SLOT_OPEN,
      CONCEPTS.TEMPLATE_PUBLISHED,
      SCHED.RULE_MODE_SERVICES,
      SCHED.RULE_MODE_MIXED,
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
