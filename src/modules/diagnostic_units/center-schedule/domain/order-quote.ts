/** One component of a lab's panel offering, priced when published. */
export interface QuotedPart {
  readonly conceptId: string;
  readonly amount: number | null;
}

/**
 * What the patient pays at one center for an order (proceso 4.2.d: only the
 * items the order asks for).
 *
 * - No components picked, the whole panel picked, or a center that only sells
 *   the panel: the panel price.
 * - Some components: the sum of those components at that center; `null`
 *   (no quote) when one of them is not offered or has no price.
 */
export function quoteOrder(
  panelPrice: number | null,
  ordered: readonly string[],
  parts: readonly QuotedPart[],
): number | null {
  const picked = new Set(ordered);
  const whole =
    picked.size === 0 ||
    parts.length === 0 ||
    parts.every((p) => picked.has(p.conceptId));
  if (whole) return panelPrice;
  let cents = 0;
  for (const conceptId of picked) {
    const amount = parts.find((p) => p.conceptId === conceptId)?.amount;
    if (amount === null || amount === undefined) return null;
    cents += Math.round(amount * 100);
  }
  return cents / 100;
}
