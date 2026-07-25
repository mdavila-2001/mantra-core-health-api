import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GovernanceCatalogController } from './governance-catalog.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = {
    catalogEntity: mockFn(),
    createWritePolicy: mockFn(),
    applyWritePolicy: mockFn(),
    createRetentionPolicy: mockFn(),
    applyRetention: mockFn(),
    createAnonymizationRule: mockFn(),
    updateField: mockFn(),
  };
  return { controller: new GovernanceCatalogController(service as any), service };
}

describe('GovernanceCatalogController', () => {
  it('delegates catalogEntity (UC-11-01)', async () => {
    const d = build();
    const dto = { schemaName: 's' };
    await d.controller.catalogEntity(dto as any, actor);
    expect(d.service.catalogEntity).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createWritePolicy (UC-11-02)', async () => {
    const d = build();
    await d.controller.createWritePolicy({ code: 'w' } as any, actor);
    expect(d.service.createWritePolicy).toHaveBeenCalledWith({ code: 'w' }, actor);
  });

  it('delegates applyWritePolicy (UC-11-02)', async () => {
    const d = build();
    await d.controller.applyWritePolicy('e1', { writePolicyId: 'w1' } as any, actor);
    expect(d.service.applyWritePolicy).toHaveBeenCalledWith('e1', { writePolicyId: 'w1' }, actor);
  });

  it('delegates createRetentionPolicy (UC-11-03)', async () => {
    const d = build();
    await d.controller.createRetentionPolicy({ code: 'r' } as any, actor);
    expect(d.service.createRetentionPolicy).toHaveBeenCalledWith({ code: 'r' }, actor);
  });

  it('delegates applyRetention (UC-11-03)', async () => {
    const d = build();
    await d.controller.applyRetention('e1', { retentionPolicyId: 'r1', reason: 'x' } as any, actor);
    expect(d.service.applyRetention).toHaveBeenCalledWith('e1', { retentionPolicyId: 'r1', reason: 'x' }, actor);
  });

  it('delegates createAnonymizationRule (UC-11-04)', async () => {
    const d = build();
    await d.controller.createAnonymizationRule({ code: 'a' } as any, actor);
    expect(d.service.createAnonymizationRule).toHaveBeenCalledWith({ code: 'a' }, actor);
  });

  it('delegates updateField (UC-11-04)', async () => {
    const d = build();
    await d.controller.updateField('f1', { isPii: true } as any, actor);
    expect(d.service.updateField).toHaveBeenCalledWith('f1', { isPii: true }, actor);
  });
});
