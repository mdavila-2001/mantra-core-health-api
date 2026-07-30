import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsMessagesController } from './integrations-messages.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const messagingService = {
    enqueueOutbound: mockFn(),
    dispatch: mockFn(),
    retry: mockFn(),
    deadLetter: mockFn(),
    correlate: mockFn(),
  };
  const controller = new IntegrationsMessagesController(
    messagingService as any,
  );
  return { controller, messagingService };
}

describe('IntegrationsMessagesController', () => {
  it('delegates enqueueOutbound (UC-12-05)', async () => {
    const d = build();
    const dto = {
      connectionId: 'c1',
      idempotencyKey: 'k',
      requestPayloadJson: {},
    };
    await d.controller.enqueueOutbound(dto, actor);
    expect(d.messagingService.enqueueOutbound).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates dispatch (UC-12-06)', async () => {
    const d = build();
    const dto = { simulateFailure: false };
    await d.controller.dispatch('m1', dto, actor);
    expect(d.messagingService.dispatch).toHaveBeenCalledWith('m1', dto, actor);
  });

  it('delegates retry (UC-12-07)', async () => {
    const d = build();
    await d.controller.retry('m1', actor);
    expect(d.messagingService.retry).toHaveBeenCalledWith('m1', actor);
  });

  it('delegates deadLetter (UC-12-08)', async () => {
    const d = build();
    await d.controller.deadLetter('m1', actor);
    expect(d.messagingService.deadLetter).toHaveBeenCalledWith('m1', actor);
  });

  it('delegates correlate (UC-12-10)', async () => {
    const d = build();
    await d.controller.correlate('i1', actor);
    expect(d.messagingService.correlate).toHaveBeenCalledWith('i1', actor);
  });
});
