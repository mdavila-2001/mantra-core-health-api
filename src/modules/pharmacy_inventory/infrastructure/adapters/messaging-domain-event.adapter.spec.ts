import { jest } from '@jest/globals';
import { MessagingDomainEventAdapter } from './messaging-domain-event.adapter';

describe('MessagingDomainEventAdapter', () => {
  it('publishes the pharmacy event with the caller transaction', async () => {
    const uow = {};
    const input = {
      eventType: 'pharmacy_inventory.order.created',
      aggregateType: 'PHARMACY_ORDER',
      aggregateId: 'order-1',
      payloadJson: { orderId: 'order-1' },
    };
    const outbox = {
      publishDomainEvent: jest.fn(async () => ({ duplicate: false })),
    };
    const adapter = new MessagingDomainEventAdapter(outbox as any);

    await expect(adapter.publish(uow as any, input)).resolves.toBeUndefined();
    expect(outbox.publishDomainEvent).toHaveBeenCalledWith(uow, input);
  });
});
