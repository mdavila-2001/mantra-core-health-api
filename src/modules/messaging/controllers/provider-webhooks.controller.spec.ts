import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ProviderWebhooksController } from './provider-webhooks.controller';

const ID = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const notificationsService = { recordProviderReceipt: mockFn() };
  return {
    controller: new ProviderWebhooksController(notificationsService as any),
    notificationsService,
  };
}

describe('ProviderWebhooksController', () => {
  it('delegates the receipt with the provider code (UC-35-12)', async () => {
    const d = build();
    const dto = {
      providerMessageRef: 'prov-1',
      receiptType: 'DELIVERED',
    } as any;
    d.notificationsService.recordProviderReceipt.mockResolvedValue({
      receiptId: ID,
    });

    await d.controller.recordReceipt('sendgrid', dto);

    expect(d.notificationsService.recordProviderReceipt).toHaveBeenCalledWith(
      'sendgrid',
      dto,
    );
  });

  it('passes the provider code untouched', async () => {
    const d = build();
    d.notificationsService.recordProviderReceipt.mockResolvedValue({
      receiptId: ID,
    });

    await d.controller.recordReceipt('twilio-sms', {
      providerMessageRef: 'x',
    } as any);

    expect(d.notificationsService.recordProviderReceipt).toHaveBeenCalledWith(
      'twilio-sms',
      expect.anything(),
    );
  });
});
