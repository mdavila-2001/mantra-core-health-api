import { inboxTenantOf } from './inbox-tenant';

describe('inboxTenantOf', () => {
  it('keeps the request tenant when the recipient belongs to it', () => {
    expect(inboxTenantOf(['clinic', 'lab'], 'lab')).toBe('lab');
  });

  it("uses the recipient's oldest tenant when they do not belong to the request tenant", () => {
    expect(inboxTenantOf(['clinic', 'lab'], 'pharmacy')).toBe('clinic');
  });

  it("uses the recipient's oldest tenant when the request has none", () => {
    expect(inboxTenantOf(['clinic'], undefined)).toBe('clinic');
  });

  it('leaves it empty for an account with no tenant', () => {
    expect(inboxTenantOf([], 'pharmacy')).toBeUndefined();
  });
});
