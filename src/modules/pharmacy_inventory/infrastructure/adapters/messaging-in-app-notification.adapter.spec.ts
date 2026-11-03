import { jest } from '@jest/globals';
import { MessagingInAppNotificationAdapter } from './messaging-in-app-notification.adapter';

describe('MessagingInAppNotificationAdapter', () => {
  it('forwards the in-app notice and returns the messaging result', async () => {
    const input = {
      recipientUserId: 'user-1',
      category: 'CLINICAL' as const,
      subject: 'Su pedido fue confirmado',
      bodyText: 'La farmacia confirmó su pedido.',
      destination: { type: 'PHARMACY_ORDER' as const, id: 'order-1' },
      debounceKey: 'pharmacy:order-1:confirmed',
      actorUserId: 'user-2',
    };
    const result = { suppressed: true, suppressionReason: 'preference' };
    const notifications = {
      emitInApp: jest.fn(async () => result),
    };
    const adapter = new MessagingInAppNotificationAdapter(notifications as any);

    await expect(adapter.emit(input)).resolves.toBe(result);
    expect(notifications.emitInApp).toHaveBeenCalledWith(input);
  });
});
