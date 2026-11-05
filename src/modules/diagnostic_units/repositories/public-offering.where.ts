import { DUNIT } from '../diagnostic_units.concepts';

/**
 * Offerings the public directory, the coverage search and order booking may
 * show: published (`OFFERING_ACTIVE`) and switched on for today
 * (`available`, the lab portal's "available today" switch).
 */
export const PUBLIC_OFFERING = {
  statusConceptId: DUNIT.OFFERING_ACTIVE,
  available: true,
} as const;
