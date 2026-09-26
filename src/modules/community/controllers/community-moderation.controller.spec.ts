import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityModerationController } from './community-moderation.controller';

const actor = { id: 'mod-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    report: mockFn(),
    decide: mockFn(),
    appeal: mockFn(),
    resolveAppeal: mockFn(),
  };
  const readService = {
    listQueue: mockFn(),
    listDecisions: mockFn(),
    listAppeals: mockFn(),
    listMyDecisions: mockFn(),
  };
  return {
    controller: new CommunityModerationController(
      service as any,
      readService as any,
    ),
    service,
    readService,
  };
}

describe('CommunityModerationController', () => {
  it('delegates report (UC-19-08)', async () => {
    const d = build();
    const dto = { targetType: 'POST', targetId: 'r', reason: 'SPAM' };
    await d.controller.report(dto as any, actor);
    expect(d.service.report).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates decide (UC-19-09)', async () => {
    const d = build();
    const dto = { decision: 'REMOVED' };
    await d.controller.decide('q1', dto as any, actor);
    expect(d.service.decide).toHaveBeenCalledWith('q1', dto, actor);
  });

  it('delegates appeal (UC-19-10)', async () => {
    const d = build();
    const dto = { appellantProfileId: 'p1', reasonText: 'x' };
    await d.controller.appeal('dec1', dto, actor);
    expect(d.service.appeal).toHaveBeenCalledWith('dec1', dto, actor);
  });

  it('delegates resolveAppeal (UC-19-10, cierre)', async () => {
    const d = build();
    const dto = { resolution: 'UPHELD' };
    await d.controller.resolveAppeal('ap-1', dto as any, actor);
    expect(d.service.resolveAppeal).toHaveBeenCalledWith('ap-1', dto, actor);
  });

  /**
   * El tope por defecto se resuelve en el controlador y llega explícito al
   * servicio: si el servicio tuviera su propio default, un `limit` omitido
   * podría paginar distinto según por dónde entre la llamada.
   */
  it('delegates listQueue con el tope por defecto resuelto', async () => {
    const d = build();
    const query = { status: ['QUEUED'] };
    await d.controller.listQueue(query as any);
    expect(d.readService.listQueue).toHaveBeenCalledWith(query, 50);
  });

  it('delegates listQueue respetando el tope pedido', async () => {
    const d = build();
    const query = { limit: 10 };
    await d.controller.listQueue(query as any);
    expect(d.readService.listQueue).toHaveBeenCalledWith(query, 10);
  });

  it('delegates listMyDecisions (AG-18) con el profileId, el tope y el actor', async () => {
    const d = build();
    const query = { profileId: 'pp-1' };
    await d.controller.listMyDecisions(query as any, actor);
    expect(d.readService.listMyDecisions).toHaveBeenCalledWith(
      'pp-1',
      query,
      50,
      actor,
    );
  });

  it('delegates listDecisions y listAppeals', async () => {
    const d = build();
    await d.controller.listDecisions({} as any);
    expect(d.readService.listDecisions).toHaveBeenCalledWith({}, 50);

    await d.controller.listAppeals({ status: ['OPEN'] } as any);
    expect(d.readService.listAppeals).toHaveBeenCalledWith(
      { status: ['OPEN'] },
      50,
    );
  });
});
