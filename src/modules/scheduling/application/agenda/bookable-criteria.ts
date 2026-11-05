import { CONCEPTS } from '../../../../common';
import { SCHED } from '../../domain/scheduling.concepts';

/**
 * A resource (alias `r`) is bookable when it offers something ahead:
 * - a materialized open slot with free capacity (fixed turns), or
 * - a published, still-valid template with a band that is computed on read:
 *   flexible hours (P36) or services/mixed mode. Those never materialize slots,
 *   so counting only `bookable_slots` hid every practitioner who published them.
 *
 * Shared by the organization list and the practitioner list so both agree on
 * who can be booked. Binds {@link BOOKABLE_RESOURCE_PARAMS}, in order.
 */
export const BOOKABLE_RESOURCE_SQL = `(
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
       )`;

export const BOOKABLE_RESOURCE_PARAMS: readonly string[] = [
  CONCEPTS.SLOT_OPEN,
  CONCEPTS.TEMPLATE_PUBLISHED,
  SCHED.RULE_MODE_SERVICES,
  SCHED.RULE_MODE_MIXED,
];
