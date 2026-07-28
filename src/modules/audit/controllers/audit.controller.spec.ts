import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuditController } from './audit.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const eventsService = {
    recordDataAccess: mockFn().mockResolvedValue({ id: 'd1' }),
    recordEvent: mockFn().mockResolvedValue({ id: 'a1' }),
    verifyIntegrity: mockFn().mockResolvedValue({ verified: true }),
    applyRetention: mockFn().mockResolvedValue({ applied: true }),
    scanAnomaly: mockFn().mockResolvedValue({ anomalous: false }),
  };
  const historyService = {
    getTimeline: mockFn().mockResolvedValue({ count: 0 }),
  };
  const thirdPartyService = {
    record: mockFn().mockResolvedValue({ id: 'del1' }),
  };
  const controller = new AuditController(
    eventsService as any,
    historyService as any,
    thirdPartyService as any,
  );
  return { controller, eventsService, historyService, thirdPartyService };
}

describe('AuditController', () => {
  it('delega recordDataAccess (UC-10-01)', async () => {
    const d = build();
    const dto = { resourceType: 'clinical' };
    await d.controller.recordDataAccess(dto, actor);
    expect(d.eventsService.recordDataAccess).toHaveBeenCalledWith(dto, actor);
  });

  it('delega recordEvent (UC-10-04)', async () => {
    const d = build();
    const dto = { action: 'UPDATE', entity: 'users', outcome: 'SUCCESS' };
    await d.controller.recordEvent(dto, actor);
    expect(d.eventsService.recordEvent).toHaveBeenCalledWith(dto, actor);
  });

  it('delega getHistory (UC-10-05)', async () => {
    const d = build();
    await d.controller.getHistory('users', 'u1', { as_of: undefined }, actor);
    expect(d.historyService.getTimeline).toHaveBeenCalledWith(
      'users',
      'u1',
      { as_of: undefined },
      actor,
    );
  });

  it('delega verifyIntegrity (UC-10-06)', async () => {
    const d = build();
    await d.controller.verifyIntegrity({}, actor);
    expect(d.eventsService.verifyIntegrity).toHaveBeenCalledWith({}, actor);
  });

  it('delega applyRetention (UC-10-09)', async () => {
    const d = build();
    await d.controller.applyRetention({}, actor);
    expect(d.eventsService.applyRetention).toHaveBeenCalledWith({}, actor);
  });

  it('delega scanAnomaly (UC-10-10)', async () => {
    const d = build();
    await d.controller.scanAnomaly({}, actor);
    expect(d.eventsService.scanAnomaly).toHaveBeenCalledWith({}, actor);
  });

  it('delega recordThirdPartyAccess (UC-10-12)', async () => {
    const d = build();
    const dto = { channel: 'DELEGATED', outcome: 'SUCCESS' };
    await d.controller.recordThirdPartyAccess(dto, actor);
    expect(d.thirdPartyService.record).toHaveBeenCalledWith(dto, actor);
  });
});
