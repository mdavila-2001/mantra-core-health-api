import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Runs a patient's order-booking work in its own transaction under the RLS
 * system context (`app.system_context`), the mechanism the membership
 * invitations and the patient's cross-organization booking list use.
 *
 * Booking spans three tenants: the order sits in its custodian's tenant (the
 * hospital), the appointment is written with the center's `tenant_id`, and the
 * patient's session is bound to neither. With `RLS_ENFORCE=true` that session
 * can neither read the order nor insert the booking.
 *
 * Callers must prove the order is the patient's own first
 * (`OrderBookingAccessService.ownOrder`) as the first step of `work`:
 * RLS no longer restricts the rest, so the patient profile id does. The setting
 * is `is_local`, so it ends with the transaction and never reaches the pool.
 */
export function inPatientCustodyContext<T>(
  em: EntityManager,
  work: (tx: EntityManager) => Promise<T>,
): Promise<T> {
  // Own connection: a joined transaction would keep `system_context` alive for
  // the rest of the request.
  const ownFork = em.fork({ keepTransactionContext: false });
  return ownFork.transactional(async (tx) => {
    await tx.execute("select set_config('app.system_context', 'true', true)");
    return work(tx);
  });
}
