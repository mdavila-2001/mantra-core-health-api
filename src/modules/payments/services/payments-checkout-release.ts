import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, touch } from '../../../common';
import type { PaymentFlowRepository } from '../repositories';

/**
 * Libera el checkout de una intención que ya no va a cobrar: sus sesiones abiertas
 * se cierran (`CHECKOUT_EXPIRED`) y la deuda vuelve a `DEBT_PENDING` para poder abrir
 * otra. Sin esto una deuda quedaría en `DEBT_IN_CHECKOUT` para siempre.
 *
 * Si otra intención conserva una sesión abierta sobre la misma deuda, la deuda
 * **sigue en checkout**: liberarla dejaría abrir un tercer checkout encima de un
 * cobro todavía vivo (m6).
 *
 * Orden de bloqueo: sesiones de la intención y luego la deuda, igual que el resto de
 * las rutas (`settleDebt`, la compuerta). La usan el webhook de un cobro fallido y el
 * cierre manual de una reserva.
 */
export async function releaseCheckoutForIntent(
  flowRepo: Pick<
    PaymentFlowRepository,
    | 'findCheckoutSessionsByIntentForUpdate'
    | 'findDebtByIdForUpdate'
    | 'findOpenCheckoutSessionsByDebt'
  >,
  tx: EntityManager,
  intent: { id: string; tenantId: string },
): Promise<void> {
  const sessions = await flowRepo.findCheckoutSessionsByIntentForUpdate(
    tx,
    intent.id,
  );
  const now = new Date();
  const closing = new Set<string>();
  for (const session of sessions) {
    if (session.statusConceptId !== CONCEPTS.CHECKOUT_OPEN) continue;
    session.statusConceptId = CONCEPTS.CHECKOUT_EXPIRED;
    touch(session, undefined, now);
    closing.add(session.id);
    const debt = await flowRepo.findDebtByIdForUpdate(
      tx,
      session.paymentDebtId,
    );
    if (
      debt &&
      debt.tenantId === intent.tenantId &&
      debt.statusConceptId === CONCEPTS.DEBT_IN_CHECKOUT
    ) {
      // Las sesiones que se cierran acá todavía figuran abiertas en la base
      // (no se hizo flush): se excluyen por id.
      const stillOpen = (
        await flowRepo.findOpenCheckoutSessionsByDebt(tx, debt.id)
      ).filter((other) => !closing.has(other.id));
      if (stillOpen.length > 0) continue;
      debt.statusConceptId = CONCEPTS.DEBT_PENDING;
      touch(debt, undefined, now);
    }
  }
}
