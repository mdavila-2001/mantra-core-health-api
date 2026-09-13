import { CONCEPTS } from '../../common/constants/concepts';
import { DUNIT } from '../diagnostic_units/diagnostic_units.concepts';
import { PHARM } from '../pharmacy/pharmacy.concepts';
import { PINV } from '../pharmacy_inventory/pharmacy_inventory.concepts';

const CURRENCY_CODE_BY_CONCEPT_ID: ReadonlyMap<string, string> = new Map([
  [CONCEPTS.CURRENCY_BOB, 'BOB'],
  [CONCEPTS.CURRENCY_USD, 'USD'],
  [DUNIT.CURRENCY_BOB, 'BOB'],
  [PHARM.CURRENCY_USD, 'USD'],
  [PINV.CURRENCY_USD, 'USD'],
]);

/** Resuelve identidades monetarias conocidas sin inferir monedas por el texto. */
export function resolveInsuranceCurrencyCode(
  conceptId: string | null | undefined,
  registeredCode: string | null | undefined,
): string | null {
  if (!registeredCode?.trim()) return null;
  return (
    (conceptId ? CURRENCY_CODE_BY_CONCEPT_ID.get(conceptId) : undefined) ??
    registeredCode
  );
}
