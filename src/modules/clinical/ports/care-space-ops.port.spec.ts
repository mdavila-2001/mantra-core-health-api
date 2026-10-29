import {
  UnavailableCareSpaceOps,
  type CareSpaceOpsPort,
} from './care-space-ops.port';

describe('UnavailableCareSpaceOps (proveedor por omisión del puerto)', () => {
  const port: CareSpaceOpsPort = new UnavailableCareSpaceOps();

  it.each([
    ['getOperationalState', () => (port as any).getOperationalState()],
    ['markDirtyFromSource', () => (port as any).markDirtyFromSource()],
    ['recordOccupancyChange', () => (port as any).recordOccupancyChange()],
  ])(
    '%s falla cerrado con 503 CARE_SPACE_OPS_UNAVAILABLE',
    async (_name, call) => {
      await expect(call()).rejects.toMatchObject({
        reason: 'CARE_SPACE_OPS_UNAVAILABLE',
        status: 503,
      });
    },
  );

  it('no ofrece la reversión opcional de la limpieza', () => {
    expect('revertDirtyFromSource' in port).toBe(false);
  });
});
