import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ComplianceController } from './compliance.controller';
import { PrivacyController } from './privacy.controller';
import { ModerationController } from './moderation.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('ComplianceController (UC-10-07)', () => {
  it('delega exportEvidence', async () => {
    const service = {
      exportEvidence: mockFn().mockResolvedValue({ id: 'g1' }),
    };
    const controller = new ComplianceController(service as any);
    const dto = { entity: 'audit_log' };
    await controller.exportEvidence(dto, actor);
    expect(service.exportEvidence).toHaveBeenCalledWith(dto, actor);
  });
});

describe('PrivacyController (UC-10-08)', () => {
  it('delega createDsar', async () => {
    const service = {
      createDsar: mockFn().mockResolvedValue({ id: 'ds1' }),
      updateDsar: mockFn(),
    };
    const controller = new PrivacyController(service as any);
    const dto = { type: 'ACCESS' };
    await controller.createDsar(dto, actor);
    expect(service.createDsar).toHaveBeenCalledWith(dto, actor);
  });

  it('delega updateDsar', async () => {
    const service = {
      createDsar: mockFn(),
      updateDsar: mockFn().mockResolvedValue({ id: 'ds1' }),
    };
    const controller = new PrivacyController(service as any);
    const dto = { status: 'COMPLETED' };
    await controller.updateDsar('ds1', dto, actor);
    expect(service.updateDsar).toHaveBeenCalledWith('ds1', dto, actor);
  });
});

describe('ModerationController (UC-10-11)', () => {
  it('delega recordDecision', async () => {
    const service = {
      recordDecision: mockFn().mockResolvedValue({ id: 'm1' }),
    };
    const controller = new ModerationController(service as any);
    const dto = { targetType: 'CONTENT', targetId: 't1', action: 'REMOVE' };
    await controller.recordDecision(dto, actor);
    expect(service.recordDecision).toHaveBeenCalledWith(dto, actor);
  });
});
