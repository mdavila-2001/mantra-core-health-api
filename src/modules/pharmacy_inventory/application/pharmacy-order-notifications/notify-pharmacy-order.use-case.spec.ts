import { jest } from '@jest/globals';
import { NotifyPharmacyOrderUseCase } from './notify-pharmacy-order.use-case';

describe('NotifyPharmacyOrderUseCase', () => {
  function build() {
    const em = { fork: jest.fn(() => ({})) };
    const accountLinks = {
      findActiveByPerson: jest.fn(async () => ({ userId: 'user-1' })),
    };
    const notifications = {
      emit: jest.fn(async () => ({ suppressed: false })),
    };
    const logger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };
    return {
      useCase: new NotifyPharmacyOrderUseCase(
        em as any,
        notifications as any,
        accountLinks as any,
        logger as any,
      ),
      accountLinks,
      notifications,
      logger,
    };
  }

  it('sends the pickup code only in the patient order notice with a state debounce key', async () => {
    const d = build();

    await d.useCase.orderReady('order-1', 'patient-1', 'actor-1', 'A2BC34');

    expect(d.accountLinks.findActiveByPerson).toHaveBeenCalledWith(
      expect.anything(),
      'patient-1',
    );
    expect(d.notifications.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'user-1',
        subject: 'Su pedido está listo para retirar',
        bodyText: expect.stringContaining('A2BC34'),
        destination: { type: 'PHARMACY_ORDER', id: 'order-1' },
        debounceKey:
          'pharmacy:PHARMACY_ORDER:order-1:PINV_ORDER_LISTO_PARA_RETIRO',
        actorUserId: 'actor-1',
      }),
    );
  });

  it('suppresses a notice when the person has no active account', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null as any);

    await expect(
      d.useCase.orderUnderReview('order-1', 'patient-1', 'actor-1'),
    ).resolves.toEqual({ suppressed: false });
    expect(d.notifications.emit).not.toHaveBeenCalled();
    expect(d.logger.info).toHaveBeenCalled();
  });

  it('records notification failures without failing the committed transition', async () => {
    const d = build();
    d.notifications.emit.mockRejectedValue(
      new Error('notification unavailable'),
    );

    await expect(
      d.useCase.orderConfirmed('order-1', 'patient-1', 'actor-1'),
    ).resolves.toEqual({ suppressed: false, failed: true });
    expect(d.logger.error).toHaveBeenCalled();
  });
});
