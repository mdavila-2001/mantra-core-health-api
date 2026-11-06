/**
 * Picks the tenant whose bell will show a notice to its recipient.
 *
 * @param recipientTenantIds - The recipient's active tenants, oldest first.
 * @param requestTenantId - Tenant of the request that emits the notice, if any.
 * @returns The request tenant when the recipient belongs to it, else their oldest
 *   tenant, or `undefined` for an account with no tenant (its bell has no scope).
 */
export function inboxTenantOf(
  recipientTenantIds: readonly string[],
  requestTenantId: string | undefined,
): string | undefined {
  if (requestTenantId && recipientTenantIds.includes(requestTenantId)) {
    return requestTenantId;
  }
  return recipientTenantIds[0];
}
