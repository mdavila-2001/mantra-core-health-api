/** La dirección en una línea, o null si no tiene ninguna parte con texto. */
export function addressText(address: {
  readonly lines?: string;
  readonly city?: string;
  readonly postalCode?: string;
}): string | null {
  const parts = [address.lines, address.city, address.postalCode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length === 0 ? null : parts.join(', ');
}
