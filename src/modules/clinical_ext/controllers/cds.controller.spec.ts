import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CdsController } from './cds.controller';

const actor = { id: 'gov-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const cdsService = {
    createRule: mockFn(),
    publishVersion: mockFn(),
    rollbackVersion: mockFn(),
    evaluate: mockFn(),
    checkInteractions: mockFn(),
    createDrugInteraction: mockFn(),
  };
  const controller = new CdsController(cdsService as any);
  return { controller, cdsService };
}

describe('CdsController', () => {
  it('delegates createRule', async () => {
    const d = build();
    const dto = { code: 'C1', name: 'R' };
    await d.controller.createRule(dto as any, actor);
    expect(d.cdsService.createRule).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates publish (UC-18-13)', async () => {
    const d = build();
    const dto = { messageTemplate: 'm' };
    await d.controller.publish('r1', dto as any, actor);
    expect(d.cdsService.publishVersion).toHaveBeenCalledWith('r1', dto, actor);
  });

  it('delegates rollback (UC-18-13)', async () => {
    const d = build();
    await d.controller.rollback('r1', actor);
    expect(d.cdsService.rollbackVersion).toHaveBeenCalledWith('r1', actor);
  });

  it('delegates evaluate (UC-18-03)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1' };
    await d.controller.evaluate(dto as any, actor);
    expect(d.cdsService.evaluate).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates checkInteractions (UC-18-04)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', substanceConceptIds: ['a', 'b'] };
    await d.controller.checkInteractions(dto as any, actor);
    expect(d.cdsService.checkInteractions).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createDrugInteraction', async () => {
    const d = build();
    const dto = { substanceAConceptId: 'a', substanceBConceptId: 'b' };
    await d.controller.createDrugInteraction(dto as any, actor);
    expect(d.cdsService.createDrugInteraction).toHaveBeenCalledWith(dto, actor);
  });
});
