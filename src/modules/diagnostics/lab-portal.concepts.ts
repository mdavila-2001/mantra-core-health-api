import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Concepts of the laboratory / imaging-center portal that live outside
 * `diagnostics.concepts.ts` (a frozen file): the performer's own answer to an
 * order it did not issue (`service_request_performer_events.event_type_concept_id`)
 * and the completed state of a performer work order.
 */
export const { seeds: LAB_PORTAL_CONCEPT_SEEDS, ids: LABP } =
  defineModuleConcepts('diagnostics_lab_portal', {
    PERFORMER_CANCELLED: {
      code: 'PERF_CANCELLED',
      display: 'Order cancelled by the performer',
    },
    PERFORMER_REJECTED: {
      code: 'PERF_REJECTED',
      display: 'Order rejected by the performer',
    },
    WORK_ORDER_COMPLETED: {
      code: 'WO_COMPLETED',
      display: 'Work order completed',
    },
  });

/** Event types that end an order on the performer side. */
export const PERFORMER_OUTCOME_CONCEPTS: readonly string[] = [
  LABP.PERFORMER_CANCELLED,
  LABP.PERFORMER_REJECTED,
];
