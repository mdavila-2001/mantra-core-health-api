import { PreconditionFailedException } from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';

/**
 * Tipos de cargo de `POST /procedure-cases/:id/charge-items/post` que son del
 * **espacio** (tiempo de sala) y que, por eso, devenga el sistema solo.
 *
 * Cargarlos a mano además del cargo automático cobraría la sala dos veces.
 */
export const AUTOMATIC_ROOM_CHARGE_TYPES: readonly string[] = ['OR_TIME'];

/**
 * Rechaza (422 `ROOM_CHARGE_IS_AUTOMATIC`) un lote de cargos de quirófano que
 * incluya un cargo de sala.
 *
 * @param items - Cargos del cuerpo del request.
 * @throws PreconditionFailedException si algún ítem es un cargo de sala.
 */
export function assertNoAutomaticRoomCharge(
  items: readonly { readonly chargeType: string }[],
): void {
  const offending = items.filter((item) =>
    AUTOMATIC_ROOM_CHARGE_TYPES.includes(item.chargeType),
  );
  if (offending.length === 0) return;
  throw new PreconditionFailedException(
    'El tiempo de quirófano lo devenga el sistema al completar el caso; no se carga a mano',
    { chargeTypes: [...new Set(offending.map((item) => item.chargeType))] },
    BillingErrorReason.ROOM_CHARGE_IS_AUTOMATIC,
  );
}
