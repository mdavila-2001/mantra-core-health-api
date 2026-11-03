/** Una lista de mostrador no está ligada a una aseguradora. */
export function isRetailList(list: {
  readonly insurerTenantId?: string;
}): boolean {
  return !list.insurerTenantId;
}
